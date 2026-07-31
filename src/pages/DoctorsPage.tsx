import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, X, Stethoscope, Phone, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Doctor } from '../types';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('doctors').select('*').order('name');
    if (!error && data) setDoctors(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  const filtered = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este doctor? Se eliminarán también sus citas.')) return;
    const { error } = await supabase.from('doctors').delete().eq('id', id);
    if (!error) setDoctors((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Doctores</h1>
          <p className="text-slate-500 mt-1">Directorio de profesionales médicos</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditingId(null);
            setShowForm(true);
          }}
        >
          <Plus className="w-4 h-4" /> Nuevo doctor
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-9"
          placeholder="Buscar por nombre o especialidad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Stethoscope className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No se encontraron doctores</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => (
            <div key={doc.id} className="card p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                    onClick={() => {
                      setEditingId(doc.id);
                      setShowForm(true);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-slate-900">{doc.name}</h3>
              <p className="text-sm text-blue-600 font-medium mb-3">{doc.specialty}</p>
              <div className="space-y-1.5 text-sm text-slate-500">
                {doc.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> {doc.phone}
                  </p>
                )}
                {doc.email && (
                  <p className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" /> {doc.email}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <DoctorForm
          editingId={editingId}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            loadDoctors();
          }}
        />
      )}
    </div>
  );
}

interface DoctorFormProps {
  editingId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

function DoctorForm({ editingId, onClose, onSaved }: DoctorFormProps) {
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editingId) return;
    (async () => {
      const { data } = await supabase.from('doctors').select('*').eq('id', editingId).maybeSingle();
      if (data) {
        setName(data.name);
        setSpecialty(data.specialty);
        setPhone(data.phone ?? '');
        setEmail(data.email ?? '');
      }
    })();
  }, [editingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name,
      specialty,
      phone: phone || null,
      email: email || null,
    };

    let result;
    if (editingId) {
      result = await supabase.from('doctors').update(payload).eq('id', editingId);
    } else {
      result = await supabase.from('doctors').insert(payload);
    }

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
    } else {
      onSaved();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {editingId ? 'Editar doctor' : 'Nuevo doctor'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Nombre *</label>
            <input
              className="input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del doctor"
            />
          </div>
          <div>
            <label className="label">Especialidad *</label>
            <input
              className="input"
              required
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="Ej: Cardiología"
            />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Número de contacto"
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
            />
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear doctor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
