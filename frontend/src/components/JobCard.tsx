import { ArrowUpRight, Bookmark, Clock, DollarSign, MapPin } from 'lucide-react';

interface JobCardProps {
  job: {
    id: string;
    title: string;
    company: {
      name: string;
      logo_url: string;
    };
    location: string;
    salary_min: number;
    salary_max: number;
    job_type: string;
    is_featured: boolean;
  };
  onClick?: () => void;
  onSave?: () => void;
}

export function JobCard({ job, onClick, onSave }: JobCardProps) {
  const formatSalary = (min: number, max: number) => {
    const formatNumber = (num: number) => {
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}jt`;
      }
      return `${(num / 1000).toFixed(0)}rb`;
    };
    return `Rp ${formatNumber(min)} - ${formatNumber(max)}`;
  };

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_18px_38px_rgba(15,23,42,0.14)] md:p-5"
    >
      <div
        className={`absolute left-0 top-0 h-1.5 w-full ${
          job.is_featured
            ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400'
            : 'bg-gradient-to-r from-slate-100 to-slate-50'
        }`}
      />

      {job.is_featured && (
        <div className="absolute right-3 top-3 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold tracking-[0.12em] text-amber-700">
          FEATURED
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className="shrink-0">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 ring-1 ring-slate-200 md:h-16 md:w-16">
            {job.company.logo_url ? (
              <img
                src={job.company.logo_url}
                alt={job.company.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-slate-700 md:text-2xl">
                {job.company.name.charAt(0)}
              </span>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-extrabold text-slate-900 transition-colors group-hover:text-sky-700 md:text-lg">
            {job.title}
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-500">{job.company.name}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              <MapPin className="h-3 w-3" />
              {job.location}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <DollarSign className="h-3 w-3" />
              {formatSalary(job.salary_min, job.salary_max)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700">
              <Clock className="h-3 w-3" />
              {job.job_type}
            </span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSave?.();
          }}
          className="shrink-0 rounded-xl border border-slate-200 p-2.5 text-slate-400 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
        >
          <Bookmark className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
        <p className="text-xs font-medium text-slate-500">Lihat detail dan kirim lamaran sekarang</p>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 transition-colors group-hover:text-sky-700">
          Detail
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}
