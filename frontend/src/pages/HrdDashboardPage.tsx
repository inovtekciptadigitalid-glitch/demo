import { useEffect, useState, type ReactNode } from 'react';
import { api, type ApplicationItem, type CompanyItem, type CreateJobPayload, type SessionUser } from '../lib/api';
import { LogOut, Send } from 'lucide-react';

interface HrdDashboardPageProps {
  user: SessionUser;
  onLogout: () => Promise<void>;
}

const defaultFormState = {
  company_id: '',
  title: '',
  description: '',
  location: '',
  salary_min: '',
  salary_max: '',
  job_type: 'Full-time',
  min_age: '',
  max_age: '',
  min_experience_years: '',
  requirements: '',
  benefits: '',
  expires_at: '',
};

export function HrdDashboardPage({ user, onLogout }: HrdDashboardPageProps) {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(defaultFormState);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [applicationsError, setApplicationsError] = useState('');
  const [screeningFilter, setScreeningFilter] = useState<'all' | 'pass' | 'fail' | 'none'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewing' | 'accepted' | 'rejected'>('all');
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [previewVideoTitle, setPreviewVideoTitle] = useState<string>('');

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      setError('');

      try {
        const companyData = await api.getCompanies();
        setCompanies(companyData);
        setForm((prev) => {
          if (prev.company_id || !companyData[0]) {
            return prev;
          }

          return { ...prev, company_id: companyData[0].id };
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat data perusahaan');
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, []);

  useEffect(() => {
    const fetchApplications = async () => {
      setApplicationsLoading(true);
      setApplicationsError('');

      try {
        const data = await api.getApplications('all');
        setApplications(data);
      } catch (err) {
        setApplicationsError(err instanceof Error ? err.message : 'Gagal memuat lamaran');
      } finally {
        setApplicationsLoading(false);
      }
    };

    void fetchApplications();
  }, []);

  const filteredApplications = applications.filter((application) => {
    if (screeningFilter === 'all') {
      return statusFilter === 'all' || application.status === statusFilter;
    }
    if (screeningFilter === 'none') {
      const screeningOk = !application.screening_result;
      if (statusFilter === 'all') {
        return screeningOk;
      }
      return screeningOk && application.status === statusFilter;
    }
    const screeningOk = application.screening_result === screeningFilter;
    if (statusFilter === 'all') {
      return screeningOk;
    }
    return screeningOk && application.status === statusFilter;
  });

  const openVideoPreview = (url: string, title: string) => {
    setPreviewVideoUrl(url);
    setPreviewVideoTitle(title);
  };

  const closeVideoPreview = () => {
    setPreviewVideoUrl(null);
    setPreviewVideoTitle('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const payload: CreateJobPayload = {
        company_id: form.company_id,
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        salary_min: Number(form.salary_min),
        salary_max: Number(form.salary_max),
        job_type: form.job_type.trim(),
        requirements: splitByComma(form.requirements),
        benefits: splitByComma(form.benefits),
        min_age: form.min_age ? Number(form.min_age) : null,
        max_age: form.max_age ? Number(form.max_age) : null,
        min_experience_years: form.min_experience_years ? Number(form.min_experience_years) : null,
        expires_at: form.expires_at || undefined,
      };

      const response = await api.createJob(payload);
      setSuccess(response.message);
      setForm((prev) => ({
        ...defaultFormState,
        company_id: prev.company_id,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim lowongan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-8">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">HRD</p>
            <h1 className="mt-1 text-2xl font-black text-slate-900">Kirim Lowongan</h1>
            <p className="mt-1 text-sm text-slate-600">
              {user.name}, fokus isi form lowongan saja. Admin akan review pengajuan.
            </p>
          </div>
          <button
            onClick={() => {
              void onLogout();
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto mt-5 w-full max-w-4xl px-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-extrabold text-slate-900">Form Input Lowongan</h2>

          {error && (
            <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Perusahaan">
                <select
                  value={form.company_id}
                  onChange={(event) => setForm((prev) => ({ ...prev, company_id: event.target.value }))}
                  required
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                >
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name} ({company.location})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Judul Lowongan">
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  required
                  maxLength={160}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </Field>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Lokasi">
                <input
                  type="text"
                  value={form.location}
                  onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </Field>
              <Field label="Tipe Kerja">
                <input
                  type="text"
                  value={form.job_type}
                  onChange={(event) => setForm((prev) => ({ ...prev, job_type: event.target.value }))}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </Field>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Gaji Minimum">
                <input
                  type="number"
                  min={0}
                  value={form.salary_min}
                  onChange={(event) => setForm((prev) => ({ ...prev, salary_min: event.target.value }))}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </Field>
              <Field label="Gaji Maksimum">
                <input
                  type="number"
                  min={0}
                  value={form.salary_max}
                  onChange={(event) => setForm((prev) => ({ ...prev, salary_max: event.target.value }))}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </Field>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Usia Minimum">
                <input
                  type="number"
                  min={16}
                  max={80}
                  value={form.min_age}
                  onChange={(event) => setForm((prev) => ({ ...prev, min_age: event.target.value }))}
                  placeholder="Opsional"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </Field>
              <Field label="Usia Maksimum">
                <input
                  type="number"
                  min={16}
                  max={80}
                  value={form.max_age}
                  onChange={(event) => setForm((prev) => ({ ...prev, max_age: event.target.value }))}
                  placeholder="Opsional"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </Field>
              <Field label="Min. Pengalaman (tahun)">
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={form.min_experience_years}
                  onChange={(event) => setForm((prev) => ({ ...prev, min_experience_years: event.target.value }))}
                  placeholder="Opsional"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </Field>
            </div>

            <Field label="Batas Akhir Lamaran (opsional)">
              <input
                type="date"
                value={form.expires_at}
                onChange={(event) => setForm((prev) => ({ ...prev, expires_at: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </Field>

            <Field label="Deskripsi Lowongan">
              <textarea
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </Field>

            <Field label="Persyaratan (pisahkan koma)">
              <input
                type="text"
                value={form.requirements}
                onChange={(event) => setForm((prev) => ({ ...prev, requirements: event.target.value }))}
                placeholder="Contoh: React, Laravel, MySQL"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </Field>

            <Field label="Benefit (pisahkan koma)">
              <input
                type="text"
                value={form.benefits}
                onChange={(event) => setForm((prev) => ({ ...prev, benefits: event.target.value }))}
                placeholder="Contoh: BPJS, Laptop, Bonus"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </Field>

            <button
              type="submit"
              disabled={submitting || loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Mengirim...' : 'Kirim Lowongan'}
            </button>
          </form>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-extrabold text-slate-900">Lamaran Masuk</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'pass', label: 'Lolos Skrining' },
              { id: 'fail', label: 'Tidak Lolos' },
              { id: 'none', label: 'Belum Skrining' },
            ].map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setScreeningFilter(filter.id as typeof screeningFilter)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  screeningFilter === filter.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'Status: Semua' },
              { id: 'pending', label: 'Pending' },
              { id: 'reviewing', label: 'Reviewing' },
              { id: 'accepted', label: 'Accepted' },
              { id: 'rejected', label: 'Rejected' },
            ].map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setStatusFilter(filter.id as typeof statusFilter)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  statusFilter === filter.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          {applicationsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-20 animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
              ))}
            </div>
          ) : applicationsError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              {applicationsError}
            </div>
          ) : filteredApplications.length === 0 ? (
            <p className="text-sm text-slate-500">Tidak ada lamaran sesuai filter.</p>
          ) : (
            <div className="space-y-3">
              {filteredApplications.map((application) => (
                <div
                  key={application.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {application.candidate?.full_name ?? 'Kandidat'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {application.jobs.title} • {application.jobs.companies?.name ?? ''}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {application.status}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>Lokasi: {application.jobs.location}</span>
                    {application.screening_result && (
                      <span>
                        Skrining: {application.screening_result === 'pass' ? 'Lolos' : 'Tidak Lolos'}
                        {application.screening_score != null ? ` (${application.screening_score}%)` : ''}
                      </span>
                    )}
                  </div>
                  {application.intro_video_url && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openVideoPreview(
                            application.intro_video_url ?? '',
                            application.candidate?.full_name ?? 'Video Kandidat',
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Preview Video
                      </button>
                      <a
                        href={application.intro_video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Lihat Video Perkenalan
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      {previewVideoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">{previewVideoTitle}</h3>
              <button
                type="button"
                onClick={closeVideoPreview}
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>
            <video
              src={previewVideoUrl}
              controls
              preload="metadata"
              className="w-full rounded-xl border border-slate-200"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function splitByComma(value: string): string[] {
  if (!value.trim()) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-[0.09em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}
