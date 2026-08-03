import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CircleAlert as AlertCircle, CircleCheck as CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSettings } from '../lib/settings';

export default function ResetPasswordPage() {
  const { t } = useSettings();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // The recovery link from the email redirects here with a session.
    // Wait for Supabase to process the recovery token in the URL hash/query.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
      } else {
        // If no session yet, listen for the auth state change (recovery)
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session) {
            setReady(true);
          }
        });
        // Timeout fallback — if no recovery session arrives, the link may be invalid/expired
        const timeout = setTimeout(() => {
          setReady(true);
        }, 3000);
        return () => {
          listener.subscription.unsubscribe();
          clearTimeout(timeout);
        };
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError(t('auth.passwordPlaceholder'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.password'));
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setDone(true);
      setLoading(false);
      // Sign out after password reset so they log in fresh
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/login');
      }, 2500);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-full max-w-md">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">{t('profile.saved')}</h2>
            <p className="text-slate-500 text-sm">{t('auth.goLogin')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <img src="/grabado_en_logo_DOCAIDE_sin_transparencia.png" alt="DocAide" className="h-28 mx-auto mb-3" style={{mixBlendMode:'multiply'}} />
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">{t('auth.recoverPassword')}</h2>
          <p className="text-sm text-slate-500 mb-5">{t('auth.passwordPlaceholder')}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <label className="label">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pl-9"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? t('auth.processing') : t('common.save')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
