import { useEffect, useState } from 'react';
import { Search, FileText, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { fetchDoctorByUser, fetchPatients, fetchMedicalRecordsByPatient } from '../../lib/queries';
import { Spinner, EmptyState, formatDate } from '../../lib/ui';
import type { Doctor, Patient, MedicalRecord } from '../../types';

export default function DoctorRecords() {
  const { profile } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [evolution, setEvolution] = useState('');

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const doc = await fetchDoctorByUser(profile.id);
      setDoctor(doc);
      setPatients(await fetchPatients());
      setLoading(false);
    })();
  }, [profile]);

  const selectPatient = async (p: Patient) => {
    setSelectedPatient(p);
    setRecords(await fetchMedicalRecordsByPatient(p.id));
  };

  const filteredPatients = patients.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const addRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctor || !selectedPatient || !evolution.trim()) return;
    await supabase.from('medical_records').insert({
      patient_id: selectedPatient.id,
      doctor_id: doctor.id,
      evolution,
    });
    setEvolution('');
    setShowForm(false);
    setRecords(await fetchMedicalRecordsByPatient(selectedPatient.id));
  };

  const deleteRecord = async (id: string) => {
    if (!confirm('¿Eliminar este registro?')) return;
    await supabase.from('medical_records').delete().eq('id', id);
    if (selectedPatient) setRecords(await fetchMedicalRecordsByPatient(selectedPatient.id));
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Historias clínicas</h1>
        <p className="text-slate-500 mt-1">Registra la evolución de tus pacientes</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Patient list */}
        <div className="card p-4 lg:col-span-1">
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Buscar paciente..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {filteredPatients.map((p) => (
              <button
                key={p.id}
                onClick={() => selectPatient(p)}
                className={`w-full text-left p-3 rounded-lg transition flex items-center gap-3 ${
                  selectedPatient?.id === p.id ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-50'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-slate-500">{p.name.charAt(0).toUpperCase()}</span>
                </div>
                <span className="font-medium text-sm truncate">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Records */}
        <div className="lg:col-span-2">
          {!selectedPatient ? (
            <EmptyState icon={FileText} message="Selecciona un paciente para ver su historia clínica" />
          ) : (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-slate-900">{selectedPatient.name}</h2>
                  <p className="text-sm text-slate-500">
                    {selectedPatient.date_of_birth && `Nacido: ${new Date(selectedPatient.date_of_birth).toLocaleDateString('es-ES')}`}
                    {selectedPatient.phone && ` · Tel: ${selectedPatient.phone}`}
                  </p>
                </div>
                <button className="btn-primary" onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4" /> Nueva nota
                </button>
              </div>

              {records.length === 0 ? (
                <p className="text-center text-slate-400 py-8 text-sm">No hay registros todavía</p>
              ) : (
                <div className="space-y-3">
                  {records.map((r) => (
                    <div key={r.id} className="border border-slate-100 rounded-lg p-4 group">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-slate-400">{formatDate(r.created_at)}</p>
                        <button onClick={() => deleteRecord(r.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-red-600 transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{r.evolution}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showForm && selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Nueva nota de evolución</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <form onSubmit={addRecord} className="p-5 space-y-4">
              <div>
                <label className="label">Paciente</label>
                <p className="text-sm font-medium text-slate-700">{selectedPatient.name}</p>
              </div>
              <div>
                <label className="label">Evolución / Nota clínica *</label>
                <textarea className="input min-h-[150px] resize-y" required value={evolution} onChange={(e) => setEvolution(e.target.value)} placeholder="Describe la evolución del paciente, síntomas, diagnóstico, tratamiento..." />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar nota</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
