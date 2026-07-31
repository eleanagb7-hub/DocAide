import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, ClipboardList, User, Mail, Lock, CircleAlert as AlertCircle, Eye, EyeOff, CircleCheck as CheckCircle2, ArrowLeft, MailCheck } from 'lucide-react';
import { useAuth } from '../lib/auth';
import type { UserRole } from '../types';

const ROLES: { value: UserRole; label: string; icon: typeof User; desc: string }[] = [
  { value: 'doctor', label: 'Doctor', icon: Stethoscope, desc: 'Gestiona citas, pacientes y clínica' },
  { value: 'secretary', label: 'Secretaria', icon: ClipboardList, desc: 'Agenda y administración' },
  { value: 'patient', label: 'Paciente', icon: User, desc: 'Tus citas y expediente médico' },
];

type View = 'login' | 'register' | 'forgot' | 'success';

export default function AuthPage() {
  const { signIn, signUp, resetPassword, session, profile } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<View>('login');
  const [role, setRole] = useState<UserRole>('doctor');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session && profile) {
      navigate(`/${profile.role}`, { replace: true });
    }
  }, [session, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (view === 'register') {
      if (!name.trim()) { setError('Ingresa tu nombre'); setLoading(false); return; }
      const { error, needsLogin } = await signUp(email, password, name, role);
      if (error) setError(error);
      else if (needsLogin) setView('success');
    } else if (view === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else if (view === 'forgot') {
      const { error } = await resetPassword(email);
      if (error) setError(error);
      else setView('success');
    }
    setLoading(false);
  };

  const resetForm = () => {
    setError(null);
    setEmail('');
    setPassword('');
    setName('');
  };

  // Success screen (after register or password reset)
  if (view === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-full max-w-md">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">¡Cuenta creada con éxito!</h2>
            <p className="text-slate-500 text-sm mb-6">
              Hemos enviado un correo de confirmación a <strong>{email}</strong>.
              Revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
            </p>
            <button className="btn-primary w-full" onClick={() => { resetForm(); setView('login'); }}>
              Ir a iniciar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Forgot password screen
  const isForgot = view === 'forgot';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <img src="/grabado_en_logo_DOCAIDE_sin_transparencia.png" alt="DocAide" className="h-14 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Gestión médica integral</p>
        </div>

        <div className="card p-6">
          {isForgot ? (
            <>
              <button type="button" onClick={() => { resetForm(); setView('login'); }} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition">
                <ArrowLeft className="w-4 h-4" /> Volver
              </button>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Recuperar contraseña</h2>
              <p className="text-sm text-slate-500 mb-5">Te enviaremos un enlace para restablecer tu contraseña.</p>
            </>
          ) : (
            <div className="flex gap-1 p-1 bg-slate-100 rounded-lg mb-5">
              <button type="button" onClick={() => { resetForm(); setView('login'); }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition ${view === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                Iniciar sesión
              </button>
              <button type="button" onClick={() => { resetForm(); setView('register'); }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition ${view === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                Crear cuenta
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'register' && (
              <div>
                <label className="label">Soy...</label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map((r) => (
                    <button key={r.value} type="button" onClick={() => setRole(r.value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition ${
                        role === r.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                      }`}>
                      <r.icon className={`w-5 h-5 ${role === r.value ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className={`text-xs font-medium ${role === r.value ? 'text-blue-700' : 'text-slate-500'}`}>{r.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1.5">{ROLES.find((r) => r.value === role)?.desc}</p>
              </div>
            )}

            {view === 'register' && (
              <div>
                <label className="label">Nombre completo</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className="input pl-9" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
                </div>
              </div>
            )}

            <div>
              <label className="label">Correo electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" className="input pl-9" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" />
              </div>
            </div>

            {!isForgot && (
              <div>
                <label className="label">Contraseña</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input pl-9 pr-10"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Procesando...' : isForgot ? 'Enviar enlace' : view === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>

            {view === 'login' && (
              <button type="button" onClick={() => { resetForm(); setView('forgot'); }}
                className="w-full text-sm text-slate-500 hover:text-blue-600 transition text-center">
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </form>

          {isForgot && (
            <div className="flex items-start gap-2 mt-4 text-xs text-slate-400 bg-blue-50/50 border border-blue-100 rounded-lg p-3">
              <MailCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
              <p>Te llegará un correo con un enlace para crear una nueva contraseña. Revisa también tu carpeta de spam.</p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Al continuar aceptas nuestros términos de servicio y política de privacidad.
        </p>
      </div>
    </div>
  );
}
