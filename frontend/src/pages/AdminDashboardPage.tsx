import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { api, type AdminOverview, type CompanyItem, type CreateJobPayload, type JobDetail, type JobListItem, type SessionUser } from '../lib/api';
import { VideoPlayer } from '../components/VideoPlayer';
import { BarChart3, Briefcase, Building2, CheckCircle2, ClipboardList, LogOut, Trash2, Users, XCircle } from 'lucide-react';

interface AdminDashboardPageProps {
  user: SessionUser;
  onLogout: () => Promise<void>;
}

interface EditJobState {
  id: string;
  title: string;
  company_id: string;
  description: string;
  location: string;
  salary_min: number;
  salary_max: number;
  job_type: string;
  min_age: number | null;
  max_age: number | null;
  min_experience_years: number | null;
  requirements: string;
  benefits: string;
  expires_at: string;
}

const statusStyleMap: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  reviewing: 'bg-sky-100 text-sky-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
};

export function AdminDashboardPage({ user, onLogout }: AdminDashboardPageProps) {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewingJobId, setReviewingJobId] = useState<string | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [editingJob, setEditingJob] = useState<EditJobState | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [previewVideoTitle, setPreviewVideoTitle] = useState<string>('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [overviewData, jobsData, companiesData] = await Promise.all([
        api.getAdminOverview(),
        api.getJobs(200, '', 'all'),
        api.getCompanies(),
      ]);
      setOverview(overviewData);
      setJobs(jobsData);
      setCompanies(companiesData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memuat dashboard admin';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleReview = async (jobId: string, status: 'approved' | 'rejected') => {
    const note = window.prompt(
      status === 'approved'
        ? 'Catatan admin (opsional):'
        : 'Alasan penolakan lowongan (opsional):',
      '',
    ) ?? '';

    setReviewingJobId(jobId);
    setError('');

    try {
      await api.reviewJob(jobId, status, note);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses persetujuan lowongan');
    } finally {
      setReviewingJobId(null);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    const ok = window.confirm('Yakin ingin menghapus lowongan ini?');
    if (!ok) {
      return;
    }

    setDeletingJobId(jobId);
    setError('');

    try {
      await api.deleteJob(jobId);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus lowongan');
    } finally {
      setDeletingJobId(null);
    }
  };

  const openEditModal = async (jobId: string) => {
    setError('');
    try {
      const detail: JobDetail = await api.getJob(jobId);
      setEditingJob({
        id: detail.id,
        title: detail.title,
        company_id: jobs.find((job) => job.id === jobId)?.company_id ?? '',
        description: detail.description ?? '',
        location: detail.location,
        salary_min: detail.salary_min,
        salary_max: detail.salary_max,
        job_type: detail.job_type,
        min_age: detail.min_age ?? null,
        max_age: detail.max_age ?? null,
        min_experience_years: detail.min_experience_years ?? null,
        requirements: (detail.requirements ?? []).join(', '),
        benefits: (detail.benefits ?? []).join(', '),
        expires_at: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat detail lowongan');
    }
  };

  const openVideoPreview = (url: string, title: string) => {
    setPreviewVideoUrl(url);
    setPreviewVideoTitle(title);
  };

  const closeVideoPreview = () => {
    setPreviewVideoUrl(null);
    setPreviewVideoTitle('');
  };

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingJob) {
      return;
    }

    setSavingEdit(true);
    setError('');

    const payload: CreateJobPayload = {
      company_id: editingJob.company_id,
      title: editingJob.title,
      description: editingJob.description,
      location: editingJob.location,
      salary_min: Number(editingJob.salary_min),
      salary_max: Number(editingJob.salary_max),
      job_type: editingJob.job_type,
      min_age: editingJob.min_age ?? null,
      max_age: editingJob.max_age ?? null,
      min_experience_years: editingJob.min_experience_years ?? null,
      requirements: splitByComma(editingJob.requirements),
      benefits: splitByComma(editingJob.benefits),
      expires_at: editingJob.expires_at || undefined,
    };

    try {
      await api.updateJob(editingJob.id, payload);
      setEditingJob(null);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal update lowongan');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="min-h-screen pb-8">
      <div className="bg-[linear-gradient(130deg,#0f172a_0%,#0b57d0_55%,#0f766e_100%)] px-4 pb-8 pt-7 text-white shadow-[0_24px_58px_rgba(15,23,42,0.34)]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <div>
            <p className="brand-title text-3xl">Dashboard Admin</p>
            <p className="mt-1 text-sm text-slate-100">
              Selamat datang, {user.name}. CRUD lowongan, approval posting HRD, dan pantau seluruh akun.
            </p>
          </div>
          <button
            onClick={() => {
              void onLogout();
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      <div className="mx-auto -mt-4 w-full max-w-7xl px-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : overview ? (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <MetricCard icon={<Users className="h-5 w-5" />} label="Total User Login" value={overview.metrics.users_total} />
              <MetricCard icon={<Users className="h-5 w-5" />} label="Total Kandidat" value={overview.metrics.applicants_total} />
              <MetricCard icon={<Building2 className="h-5 w-5" />} label="Perusahaan" value={overview.metrics.companies_total} />
              <MetricCard icon={<Briefcase className="h-5 w-5" />} label="Lowongan" value={overview.metrics.jobs_total} />
              <MetricCard icon={<ClipboardList className="h-5 w-5" />} label="Lamaran" value={overview.metrics.applications_total} />
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.09)]">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-slate-700" />
                <h2 className="text-lg font-extrabold text-slate-900">Ringkasan Role Akun</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatusStat label="Admin" value={overview.metrics.admins_total} className="bg-indigo-50 text-indigo-700" />
                <StatusStat label="HRD" value={overview.metrics.hrd_total} className="bg-sky-50 text-sky-700" />
                <StatusStat label="User" value={overview.metrics.users_candidate_total} className="bg-cyan-50 text-cyan-700" />
                <StatusStat label="Pending Job" value={overview.metrics.jobs_pending_approval} className="bg-amber-50 text-amber-700" />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.09)]">
              <h2 className="mb-4 text-lg font-extrabold text-slate-900">Approval Lowongan HRD</h2>
              {overview.pending_jobs.length === 0 ? (
                <p className="text-sm text-slate-500">Tidak ada lowongan yang menunggu persetujuan.</p>
              ) : (
                <div className="space-y-3">
                  {overview.pending_jobs.map((job) => (
                    <div key={job.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-extrabold text-slate-900">{job.title}</p>
                          <p className="text-sm text-slate-600">
                            {job.company.name} • {job.location} • {job.job_type}
                          </p>
                          <p className="text-xs text-slate-500">
                            Pengaju: {job.created_by.name} ({job.created_by.email})
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              void handleReview(job.id, 'approved');
                            }}
                            disabled={reviewingJobId === job.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              void handleReview(job.id, 'rejected');
                            }}
                            disabled={reviewingJobId === job.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.09)]">
              <h2 className="mb-4 text-lg font-extrabold text-slate-900">CRUD Konten Posting Lowongan</h2>
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div key={job.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">{job.title}</p>
                        <p className="text-sm text-slate-600">
                          {job.companies.name} • {job.location} • {job.job_type}
                        </p>
                        <p className="text-xs text-slate-500">
                          Status: {job.approval_status}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            void openEditModal(job.id);
                          }}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            void handleDeleteJob(job.id);
                          }}
                          disabled={deletingJobId === job.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.09)]">
              <h2 className="mb-4 text-lg font-extrabold text-slate-900">Pantau Akun</h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.08em] text-slate-500">
                      <th className="px-2 py-2">Nama</th>
                      <th className="px-2 py-2">Email</th>
                      <th className="px-2 py-2">Role</th>
                      <th className="px-2 py-2">Profile ID</th>
                      <th className="px-2 py-2">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.accounts.map((account) => (
                      <tr key={account.id} className="border-b border-slate-100">
                        <td className="px-2 py-2 font-semibold text-slate-900">{account.name}</td>
                        <td className="px-2 py-2 text-slate-700">{account.email}</td>
                        <td className="px-2 py-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                            {account.role}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-slate-600">{account.profile_id ?? '-'}</td>
                        <td className="px-2 py-2 text-slate-600">
                          {account.created_at ? new Date(account.created_at).toLocaleDateString('id-ID') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.09)]">
              <h2 className="mb-4 text-lg font-extrabold text-slate-900">Lamaran Terbaru</h2>
              <div className="space-y-3">
                {overview.recent_applications.length === 0 ? (
                  <p className="text-sm text-slate-500">Belum ada data lamaran.</p>
                ) : (
                  overview.recent_applications.map((application) => (
                    <div
                      key={application.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{application.candidate.full_name}</p>
                          <p className="text-sm text-slate-600">
                            {application.job.title} • {application.job.company}
                          </p>
                          <p className="text-xs text-slate-500">{application.candidate.location}</p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                              statusStyleMap[application.status] ?? 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {application.status}
                          </span>
                          <p className="mt-1 text-xs text-slate-500">
                            {new Date(application.applied_at).toLocaleString('id-ID')}
                          </p>
                          {application.intro_video_url && (
                            <div className="mt-2 flex flex-col items-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openVideoPreview(
                                    application.intro_video_url ?? '',
                                    application.candidate.full_name,
                                  )
                                }
                                className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                              >
                                Preview Video
                              </button>
                              <a
                                href={application.intro_video_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                              >
                                Buka Video
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="mb-3 text-lg font-extrabold text-slate-900">Edit Lowongan</h3>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Perusahaan">
                  <select
                    value={editingJob.company_id}
                    onChange={(event) => setEditingJob((prev) => prev ? { ...prev, company_id: event.target.value } : prev)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Judul">
                  <input
                    type="text"
                    value={editingJob.title}
                    onChange={(event) => setEditingJob((prev) => prev ? { ...prev, title: event.target.value } : prev)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </Field>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Lokasi">
                  <input
                    type="text"
                    value={editingJob.location}
                    onChange={(event) => setEditingJob((prev) => prev ? { ...prev, location: event.target.value } : prev)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Tipe Kerja">
                  <input
                    type="text"
                    value={editingJob.job_type}
                    onChange={(event) => setEditingJob((prev) => prev ? { ...prev, job_type: event.target.value } : prev)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </Field>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Gaji Min">
                  <input
                    type="number"
                    min={0}
                    value={editingJob.salary_min}
                    onChange={(event) => setEditingJob((prev) => prev ? { ...prev, salary_min: Number(event.target.value) } : prev)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Gaji Max">
                  <input
                    type="number"
                    min={0}
                    value={editingJob.salary_max}
                    onChange={(event) => setEditingJob((prev) => prev ? { ...prev, salary_max: Number(event.target.value) } : prev)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </Field>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <Field label="Usia Min">
                  <input
                    type="number"
                    min={16}
                    max={80}
                    value={editingJob.min_age ?? ''}
                    onChange={(event) =>
                      setEditingJob((prev) => prev
                        ? { ...prev, min_age: event.target.value === '' ? null : Number(event.target.value) }
                        : prev)
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Usia Max">
                  <input
                    type="number"
                    min={16}
                    max={80}
                    value={editingJob.max_age ?? ''}
                    onChange={(event) =>
                      setEditingJob((prev) => prev
                        ? { ...prev, max_age: event.target.value === '' ? null : Number(event.target.value) }
                        : prev)
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Min. Pengalaman">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={editingJob.min_experience_years ?? ''}
                    onChange={(event) =>
                      setEditingJob((prev) => prev
                        ? { ...prev, min_experience_years: event.target.value === '' ? null : Number(event.target.value) }
                        : prev)
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </Field>
              </div>

              <Field label="Deskripsi">
                <textarea
                  rows={3}
                  value={editingJob.description}
                  onChange={(event) => setEditingJob((prev) => prev ? { ...prev, description: event.target.value } : prev)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </Field>

              <Field label="Persyaratan (pisah koma)">
                <input
                  type="text"
                  value={editingJob.requirements}
                  onChange={(event) => setEditingJob((prev) => prev ? { ...prev, requirements: event.target.value } : prev)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </Field>

              <Field label="Benefit (pisah koma)">
                <input
                  type="text"
                  value={editingJob.benefits}
                  onChange={(event) => setEditingJob((prev) => prev ? { ...prev, benefits: event.target.value } : prev)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </Field>

              <Field label="Batas Akhir (opsional)">
                <input
                  type="date"
                  value={editingJob.expires_at}
                  onChange={(event) => setEditingJob((prev) => prev ? { ...prev, expires_at: event.target.value } : prev)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </Field>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingJob(null)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
            <VideoPlayer url={previewVideoUrl} title={previewVideoTitle} />
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

function MetricCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
      <div className="mb-2 inline-flex rounded-lg bg-slate-900 p-2 text-white">{icon}</div>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

function StatusStat({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className={`rounded-xl px-4 py-3 ${className}`}>
      <p className="text-xs font-bold uppercase tracking-[0.08em]">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-[0.08em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}
