import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, ClipboardList, User, Mail, Lock, CircleAlert as AlertCircle, Eye, EyeOff, CircleCheck as CheckCircle2, ArrowLeft, MailCheck } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useSettings } from '../lib/settings';
import type { UserRole } from '../types';

const ROLE_KEYS: { value: UserRole; labelKey: string; icon: typeof User; descKey: string }[] = [
  { value: 'doctor', labelKey: 'role.doctor', icon: Stethoscope, descKey: 'auth.roleDoctor' },
  { value: 'secretary', labelKey: 'role.secretary', icon: ClipboardList, descKey: 'auth.roleSecretary' },
  { value: 'patient', labelKey: 'role.patient', icon: User, descKey: 'auth.rolePatient' },
];

type View = 'login' | 'register' | 'forgot' | 'success';

export default function AuthPage() {
  const { signIn, signUp, resetPassword, session, profile } = useAuth();
  const { t } = useSettings();
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
      if (!name.trim()) { setError(t('auth.yourName')); setLoading(false); return; }
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
            <h2 className="text-xl font-bold text-slate-900 mb-2">{t('auth.accountCreated')}</h2>
            <p className="text-slate-500 text-sm mb-6">
              {t('auth.checkEmail')} <strong>{email}</strong>.
              {t('auth.checkEmailDesc')}
            </p>
            <button className="btn-primary w-full" onClick={() => { resetForm(); setView('login'); }}>
              {t('auth.goLogin')}
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
          <p className="text-slate-500 text-sm">{t('app.tagline')}</p>
        </div>

        <div className="card p-6">
          {isForgot ? (
            <>
              <button type="button" onClick={() => { resetForm(); setView('login'); }} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition">
                <ArrowLeft className="w-4 h-4" /> {t('common.back')}
              </button>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">{t('auth.recoverPassword')}</h2>
              <p className="text-sm text-slate-500 mb-5">{t('auth.recoverDesc')}</p>
            </>
          ) : (
            <div className="flex gap-1 p-1 bg-slate-100 rounded-lg mb-5">
              <button type="button" onClick={() => { resetForm(); setView('login'); }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition ${view === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                {t('auth.login')}
              </button>
              <button type="button" onClick={() => { resetForm(); setView('register'); }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition ${view === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                {t('auth.register')}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'register' && (
              <div>
                <label className="label">{t('auth.iAm')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLE_KEYS.map((r) => (
                    <button key={r.value} type="button" onClick={() => setRole(r.value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition ${
                        role === r.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                      }`}>
                      <r.icon className={`w-5 h-5 ${role === r.value ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className={`text-xs font-medium ${role === r.value ? 'text-blue-700' : 'text-slate-500'}`}>{t(r.labelKey)}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1.5">{t(ROLE_KEYS.find((r) => r.value === role)?.descKey ?? '')}</p>
              </div>
            )}

            {view === 'register' && (
              <div>
                <label className="label">{t('auth.name')}</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className="input pl-9" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('auth.yourName')} />
                </div>
              </div>
            )}

            <div>
              <label className="label">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" className="input pl-9" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth.emailPlaceholder')} />
              </div>
            </div>

            {!isForgot && (
              <div>
                <label className="label">{t('auth.password')}</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input pl-9 pr-10"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.passwordPlaceholder')}
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
              {loading ? t('auth.processing') : isForgot ? t('auth.sendLink') : view === 'login' ? t('auth.login') : t('auth.register')}
            </button>

            {view === 'login' && (
              <button type="button" onClick={() => { resetForm(); setView('forgot'); }}
                className="w-full text-sm text-slate-500 hover:text-blue-600 transition text-center">
                {t('auth.forgot')}
              </button>
            )}
          </form>

          {isForgot && (
            <div className="flex items-start gap-2 mt-4 text-xs text-slate-400 bg-blue-50/50 border border-blue-100 rounded-lg p-3">
              <MailCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
              <p>{t('auth.spamNotice')}</p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          {t('auth.termsNotice')}
        </p>
      </div>
    </div>
  );
}
