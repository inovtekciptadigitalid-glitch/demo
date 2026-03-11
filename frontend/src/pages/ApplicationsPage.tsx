import { useState, useEffect } from 'react';
import { api, type ApplicationItem } from '../lib/api';
import { FileText, Clock, CheckCircle, XCircle, MapPin, Building } from 'lucide-react';

type Application = ApplicationItem;

interface ApplicationsPageProps {
  userId: string | null;
  onJobClick: (jobId: string) => void;
}

export function ApplicationsPage({ userId, onJobClick }: ApplicationsPageProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [previewVideoTitle, setPreviewVideoTitle] = useState<string>('');

  useEffect(() => {
    const fetchApplications = async () => {
      if (!userId) {
        setApplications([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const data = await api.getApplications(filter);
        setApplications(data);
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [userId, filter]);

  const openVideoPreview = (url: string, title: string) => {
    setPreviewVideoUrl(url);
    setPreviewVideoTitle(title);
  };

  const closeVideoPreview = () => {
    setPreviewVideoUrl(null);
    setPreviewVideoTitle('');
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        label: 'Menunggu',
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
      },
      reviewing: {
        label: 'Ditinjau',
        icon: FileText,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
      },
      accepted: {
        label: 'Diterima',
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
      },
      rejected: {
        label: 'Ditolak',
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
      },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const filters = [
    { id: 'all', label: 'Semua' },
    { id: 'pending', label: 'Menunggu' },
    { id: 'reviewing', label: 'Ditinjau' },
    { id: 'accepted', label: 'Diterima' },
    { id: 'rejected', label: 'Ditolak' },
  ];

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-28">
        <div className="text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Silakan login untuk melihat lamaran</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28">
      <div className="rounded-b-[2rem] bg-[linear-gradient(130deg,#0f172a_0%,#0b57d0_55%,#0f766e_100%)] px-4 pb-9 pt-8 text-white shadow-[0_24px_56px_rgba(15,23,42,0.32)]">
        <div className="mx-auto w-full max-w-5xl">
          <h1 className="brand-title text-3xl mb-1">Lamaran Saya</h1>
          <p className="text-slate-100">Pantau status lamaran Anda secara real-time</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 -mt-5">
        <div className="mb-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_14px_30px_rgba(15,23,42,0.09)]">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  filter === f.id
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl h-32 border border-slate-200 shadow-md"></div>
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-2">Belum ada lamaran</p>
            <p className="text-sm text-slate-400">Mulai melamar pekerjaan sekarang</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => {
              const statusConfig = getStatusConfig(application.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={application.id}
                  onClick={() => onJobClick(application.jobs.id)}
                  className={`cursor-pointer rounded-2xl border bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(15,23,42,0.14)] ${statusConfig.borderColor}`}
                >
                  <div className="flex gap-4">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 ring-1 ring-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {application.jobs.companies?.logo_url ? (
                        <img
                          src={application.jobs.companies.logo_url}
                          alt={application.jobs.companies.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-bold text-slate-700">
                          {application.jobs.companies?.name?.charAt(0)}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 mb-1 truncate">
                        {application.jobs.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                        <Building className="w-3 h-3" />
                        <span className="truncate">{application.jobs.companies?.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <MapPin className="w-3 h-3" />
                        <span>{application.jobs.location}</span>
                      </div>
                      {application.screening_result && (
                        <div className="mt-2 text-xs font-semibold text-slate-600">
                          Skrining: {application.screening_result === 'pass' ? 'Lolos' : 'Tidak Lolos'}
                          {application.screening_score != null ? ` • ${application.screening_score}%` : ''}
                        </div>
                      )}
                      {application.intro_video_url && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openVideoPreview(
                                application.intro_video_url ?? '',
                                application.jobs.title,
                              )
                            }
                            className="text-xs font-semibold text-slate-700 underline"
                          >
                            Preview Video
                          </button>
                          <a
                            href={application.intro_video_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-slate-700 underline"
                          >
                            Buka Video
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <div
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${statusConfig.bgColor} ${statusConfig.color} text-xs font-semibold mb-2`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </div>
                      <p className="text-xs text-slate-400">
                        {formatDate(application.applied_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
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
