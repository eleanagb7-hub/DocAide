import { useEffect, useState } from 'react';
import { Save, Stethoscope } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { fetchDoctorByUser } from '../../lib/queries';
import { Spinner } from '../../lib/ui';
import type { Doctor } from '../../types';

export default function DoctorProfile() {
  const { profile } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [specialty, setSpecialty] = useState('');
  const [bio, setBio] = useState('');
  const [fee, setFee] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const doc = await fetchDoctorByUser(profile.id);
      setDoctor(doc);
      if (doc) { setSpecialty(doc.specialty); setBio(doc.bio ?? ''); setFee(String(doc.consultation_fee)); }
      setLoading(false);
    })();
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true); setSaved(false);
    const payload = { user_id: profile.id, specialty, bio: bio || null, consultation_fee: parseFloat(fee) || 0, active: true };
    if (doctor) {
      await supabase.from('doctors').update(payload).eq('id', doctor.id);
    } else {
      const { data } = await supabase.from('doctors').insert(payload).select('*').single();
      if (data) setDoctor(data as Doctor);
    }
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="space-y-5 animate-fade-in max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mi perfil profesional</h1>
        <p className="text-slate-500 mt-1">Configura tu información de doctor</p>
      </div>
      <form onSubmit={handleSave} className="card p-5 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center">
            <Stethoscope className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{profile?.name}</p>
            <p className="text-sm text-slate-500">Doctor</p>
          </div>
        </div>
        <div><label className="label">Especialidad *</label><input className="input" required value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Ej: Cardiología" /></div>
        <div><label className="label">Biografía</label><textarea className="input min-h-[100px] resize-y" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Describe tu experiencia y formación" /></div>
        <div><label className="label">Costo de consulta</label><input type="number" step="0.01" className="input" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="0.00" /></div>
        {saved && <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">Perfil guardado correctamente</div>}
        <button type="submit" className="btn-primary" disabled={saving}><Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar perfil'}</button>
      </form>
    </div>
  );
}
