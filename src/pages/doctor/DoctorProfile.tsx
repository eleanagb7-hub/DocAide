import { useEffect, useState } from 'react';
import {
  Save, Stethoscope, Users, MessageSquare, Video, Activity,
  BarChart2, UserPlus, ClipboardList, Share2, FileText, Receipt,
  TrendingDown, Gift, Calendar, Image, Bell, Palette, RefreshCw,
  UserCheck, Clock,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { fetchDoctorByUser } from '../../lib/queries';
import { Spinner } from '../../lib/ui';
import type { Doctor } from '../../types';

const FEATURES = [
  {
    icon: Users,
    title: 'Usuarios de recepcionista',
    description: 'Agregue usuarios para administrar las citas de su clínica. Podrá controlar el acceso a todos los permisos, como finanzas, pagos e historiales médicos.',
  },
  {
    icon: MessageSquare,
    title: 'Mensajes personalizados de WhatsApp y SMS',
    description: 'Crea plantillas elaboradas utilizando palabras clave y úsalas para recordatorios, información, notificaciones o para vender tus servicios.',
  },
  {
    icon: Video,
    title: 'Teleconsulta y telemedicina',
    description: 'Una forma sencilla y fácil de realizar teleconsultas con sus pacientes; estos no necesitan registrarse ni instalar la aplicación, solo enviarles el enlace de acceso por WhatsApp o SMS.',
  },
  {
    icon: Activity,
    title: 'Seguimiento del paciente',
    description: 'Puedes ver, por intervalo de tiempo y tipo de programación, a qué pacientes puedes volver a contactar para programar nuevas citas, aumentando así los ingresos de tu clínica.',
  },
  {
    icon: BarChart2,
    title: 'Informes financieros y de productividad',
    description: 'Existen varios informes sobre productividad y finanzas. Adjunte imágenes y archivos a los registros de sus pacientes.',
  },
  {
    icon: UserPlus,
    title: 'Múltiples profesionales y horarios',
    description: 'Añade otros profesionales a tu clínica; puedes compartir pacientes, pero selecciona qué tipo de información quieres compartir.',
  },
  {
    icon: ClipboardList,
    title: 'Formularios de historial médico y anamnesis',
    description: 'Crea formularios con casillas de verificación y preguntas. Son muy fáciles de crear y la información en los registros médicos queda bien organizada.',
  },
  {
    icon: Share2,
    title: 'Comparte cuestionarios con tus pacientes',
    description: 'Puedes enviar cuestionarios a tus pacientes por WhatsApp o SMS antes, durante o después de la consulta. La información queda guardada directamente en su historial clínico.',
  },
  {
    icon: FileText,
    title: 'Certificados médicos',
    description: 'Crea, guarda e imprime certificados médicos de tus pacientes con tu información y logotipo. Puedes crear plantillas personalizadas y compartirlas.',
  },
  {
    icon: Receipt,
    title: 'Recetas médicas',
    description: 'Crea, guarda e imprime recetas médicas para tus pacientes con tu información y logotipo. Puedes crear plantillas personalizadas y compartirlas.',
  },
  {
    icon: TrendingDown,
    title: 'Control de gastos',
    description: 'Controla todos tus gastos con informes detallados para una mejor gestión financiera de tu clínica.',
  },
  {
    icon: Gift,
    title: 'Cumpleaños del día',
    description: 'Reciba alertas y envíe mensajes a sus pacientes en sus cumpleaños para fortalecer la relación con ellos.',
  },
  {
    icon: Image,
    title: 'Foto del paciente',
    description: 'Agrega y gestiona fotos de tus pacientes para identificarlos fácilmente en su historial y expediente.',
  },
  {
    icon: Bell,
    title: 'Recordatorios y confirmación de citas',
    description: 'Solicite confirmación de asistencia por WhatsApp, SMS y correo electrónico. Su paciente recibirá un enlace único para la confirmación.',
  },
  {
    icon: Palette,
    title: 'Personalización con logotipo',
    description: 'Personaliza las pantallas, los recordatorios y los informes con tu logotipo e imagen de marca.',
  },
  {
    icon: RefreshCw,
    title: 'Sincronizar con Google Calendar',
    description: 'Sincroniza tus citas con Google Calendar y accede a todas las funciones, como recordatorios, vista mensual y vista anual.',
  },
  {
    icon: UserCheck,
    title: 'Manejo de pacientes',
    description: 'Tenga un mejor control al inactivar a los pacientes que ya no ve.',
  },
  {
    icon: Calendar,
    title: 'Google Drive para archivos',
    description: 'Utilizando tu cuenta de Google Drive, puedes guardar todos los archivos que desees para tus pacientes.',
  },
  {
    icon: Clock,
    title: 'Horarios por día de la semana',
    description: 'Establece tu horario por día de la semana. Ideal para quienes trabajan en diferentes horarios y periodos durante la semana.',
  },
];

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
    <div className="space-y-8 animate-fade-in">
      {/* Profile form */}
      <div className="max-w-lg space-y-5">
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

      {/* Features section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Funcionalidades disponibles</h2>
          <p className="text-slate-500 mt-1">Todo lo que puedes hacer con tu cuenta de doctor</p>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="card p-4 flex gap-4 items-start hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm leading-snug">{title}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
