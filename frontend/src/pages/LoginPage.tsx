import { useState } from 'react';
import { Briefcase, Building2, ShieldCheck, User } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('user@karirku.test');
  const [password, setPassword] = useState('user12345');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onLogin(email, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login gagal';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 rounded-3xl bg-[linear-gradient(130deg,#0f172a_0%,#0b57d0_55%,#0f766e_100%)] px-6 py-7 text-white shadow-[0_24px_56px_rgba(15,23,42,0.34)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/35 bg-white/15">
              <Briefcase className="h-5 w-5 text-cyan-100" />
            </div>
            <div>
              <p className="brand-title text-3xl leading-none">KarirKu</p>
              <p className="text-xs text-slate-100">Portal lowongan kerja modern</p>
            </div>
          </div>
          <h1 className="text-2xl font-bold">Masuk ke Akun</h1>
          <p className="mt-2 text-sm text-slate-100">Login sebagai admin, HRD, atau user untuk mulai menggunakan sistem.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.09)]"
        >
          <div className="mb-4 space-y-3">
            <button
              type="button"
              onClick={() => {
                setEmail('admin@karirku.test');
                setPassword('admin12345');
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              <ShieldCheck className="h-4 w-4" />
              Pakai Akun Admin
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('hrd@karirku.test');
                setPassword('hrd12345');
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              <Building2 className="h-4 w-4" />
              Pakai Akun HRD
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('user@karirku.test');
                setPassword('user12345');
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              <User className="h-4 w-4" />
              Pakai Akun User
            </button>
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-semibold text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          {error && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Memproses...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
