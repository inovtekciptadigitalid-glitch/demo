import { useState, useEffect, type ChangeEvent } from 'react';
import { ArrowLeft, MapPin, DollarSign, Clock, Briefcase, CheckCircle, Building } from 'lucide-react';
import { api, type JobDetail } from '../lib/api';

interface JobDetailPageProps {
  jobId: string;
  onBack: () => void;
  onApply: (jobId: string, introVideo: File) => void;
}

export function JobDetailPage({ jobId, onBack, onApply }: JobDetailPageProps) {
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [introVideo, setIntroVideo] = useState<File | null>(null);
  const [videoError, setVideoError] = useState('');
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [validatingVideo, setValidatingVideo] = useState(false);
  const requiredVideoSeconds = 300;
  const durationToleranceSeconds = 5;

  useEffect(() => {
    setLoading(true);

    const fetchJobDetail = async () => {
      try {
        const data = await api.getJob(jobId);
        setJob(data);
      } catch (error) {
        console.error('Error fetching job detail:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetail();
  }, [jobId]);

  const formatSalary = (min: number, max: number) => {
    const formatNumber = (num: number) => {
      return new Intl.NumberFormat('id-ID').format(num);
    };
    return `Rp ${formatNumber(min)} - ${formatNumber(max)}`;
  };

  const handleVideoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setIntroVideo(null);
      setVideoDuration(null);
      setVideoError('');
      return;
    }

    setValidatingVideo(true);
    setVideoError('');
    setIntroVideo(null);
    setVideoDuration(null);

    if (!file.type.startsWith('video/')) {
      setVideoError('File harus berupa video');
      setValidatingVideo(false);
      return;
    }

    const url = URL.createObjectURL(file);
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const duration = probe.duration;
      if (!Number.isFinite(duration) || duration <= 0) {
        setVideoError('Gagal membaca durasi video');
        setValidatingVideo(false);
        return;
      }

      setVideoDuration(duration);
      const minAllowed = requiredVideoSeconds - durationToleranceSeconds;
      const maxAllowed = requiredVideoSeconds + durationToleranceSeconds;
      if (duration < minAllowed || duration > maxAllowed) {
        setVideoError('Durasi video harus 5 menit (±5 detik)');
        setValidatingVideo(false);
        return;
      }

      setIntroVideo(file);
      setValidatingVideo(false);
    };
    probe.onerror = () => {
      URL.revokeObjectURL(url);
      setVideoError('Gagal memuat video');
      setValidatingVideo(false);
    };
    probe.src = url;
  };

  const handleApplyClick = () => {
    if (validatingVideo) {
      alert('Sedang memeriksa video, tunggu sebentar');
      return;
    }
    if (!introVideo) {
      alert('Video perkenalan wajib berdurasi 5 menit sebelum melamar');
      return;
    }
    if (videoError) {
      alert(videoError);
      return;
    }
    onApply(jobId, introVideo);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-slate-800 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Job not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28">
      <div className="sticky top-0 z-10 bg-[linear-gradient(130deg,#0f172a_0%,#0b57d0_55%,#0f766e_100%)] text-white shadow-lg">
        <div className="mx-auto w-full max-w-5xl px-4 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Kembali</span>
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.09)]">
          <div className="p-6">
            <div className="flex gap-4 mb-6">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 ring-1 ring-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {job.companies.logo_url ? (
                  <img
                    src={job.companies.logo_url}
                    alt={job.companies.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-slate-700">
                    {job.companies.name.charAt(0)}
                  </span>
                )}
              </div>

              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">{job.title}</h1>
                <div className="flex items-center gap-2 text-slate-600 mb-2">
                  <Building className="w-4 h-4" />
                  <span className="font-medium">{job.companies.name}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{job.location}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <DollarSign className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-xs text-slate-600 mb-1">Gaji</p>
                <p className="text-sm font-bold text-slate-900">{formatSalary(job.salary_min, job.salary_max)}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-xs text-slate-600 mb-1">Tipe</p>
                <p className="text-sm font-bold text-slate-900">{job.job_type}</p>
              </div>
              <div className="bg-cyan-50 rounded-lg p-3 text-center">
                <Briefcase className="w-5 h-5 text-cyan-700 mx-auto mb-1" />
                <p className="text-xs text-slate-600 mb-1">Level</p>
                <p className="text-sm font-bold text-slate-900">Mid-Senior</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg p-6 mb-4">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Deskripsi Pekerjaan</h2>
          <p className="text-slate-600 leading-relaxed">{job.description}</p>
        </div>

        {job.requirements && job.requirements.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg p-6 mb-4">
            <h2 className="text-lg font-bold text-slate-900 mb-3">Persyaratan</h2>
            <ul className="space-y-2">
              {job.requirements.map((req, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-600">{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {job.benefits && job.benefits.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg p-6 mb-4">
            <h2 className="text-lg font-bold text-slate-900 mb-3">Benefit</h2>
            <div className="flex flex-wrap gap-2">
              {job.benefits.map((benefit, index) => (
                <span
                  key={index}
                  className="rounded-full bg-cyan-100 px-4 py-2 text-sm font-medium text-cyan-800"
                >
                  {benefit}
                </span>
              ))}
            </div>
          </div>
        )}

        {(job.min_age || job.max_age || job.min_experience_years != null) && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg p-6 mb-4">
            <h2 className="text-lg font-bold text-slate-900 mb-3">Skrining Otomatis</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500 mb-1">Lokasi</p>
                <p className="text-sm font-semibold text-slate-900">{job.location || '-'}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500 mb-1">Pengalaman Min.</p>
                <p className="text-sm font-semibold text-slate-900">
                  {job.min_experience_years != null ? `${job.min_experience_years} tahun` : 'Tidak disyaratkan'}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500 mb-1">Rentang Usia</p>
                <p className="text-sm font-semibold text-slate-900">
                  {job.min_age || job.max_age
                    ? `${job.min_age ?? '-'} - ${job.max_age ?? '-'} tahun`
                    : 'Tidak disyaratkan'}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Sistem akan mengecek kecocokan lokasi, pengalaman, dan usia saat lamaran masuk.
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg p-6 mb-4">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Video Perkenalan</h2>
          <p className="text-sm text-slate-600 mb-4">
            Upload video perkenalan berdurasi 5 menit. Video ini akan dilihat HRD dan admin untuk skrining awal.
          </p>
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
          />
          {validatingVideo && (
            <p className="mt-2 text-xs text-slate-500">Memeriksa durasi video...</p>
          )}
          {videoDuration != null && !videoError && (
            <p className="mt-2 text-xs text-emerald-600">
              Durasi terdeteksi: {Math.round(videoDuration)} detik
            </p>
          )}
          {videoError && (
            <p className="mt-2 text-xs font-semibold text-rose-600">{videoError}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Tentang Perusahaan</h2>
          <p className="text-slate-600 mb-3">{job.companies.description}</p>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{job.companies.location}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="mx-auto w-full max-w-5xl">
          <button
            onClick={handleApplyClick}
            disabled={validatingVideo || !introVideo || !!videoError}
            className="w-full rounded-xl bg-[linear-gradient(130deg,#0f172a_0%,#0b57d0_55%,#0f766e_100%)] py-4 font-bold text-white transition-all hover:opacity-95 shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
          >
            {validatingVideo ? 'Memeriksa Video...' : 'Lamar Sekarang'}
          </button>
        </div>
      </div>
    </div>
  );
}
