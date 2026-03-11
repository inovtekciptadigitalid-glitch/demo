import { useState, useEffect } from 'react';
import { api, type JobListItem } from '../lib/api';
import { JobCard } from '../components/JobCard';
import { TrendingUp, Award, Users, Zap, Briefcase, Bell, Menu, Search } from 'lucide-react';

type Job = JobListItem;

interface HomePageProps {
  onJobClick: (jobId: string) => void;
}

export function HomePage({ onJobClick }: HomePageProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const data = await api.getJobs(10);
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: TrendingUp, title: 'High Demand', desc: 'Posisi paling dicari', color: 'from-sky-500 to-cyan-500' },
    { icon: Award, title: 'Verified Company', desc: 'Perusahaan terkurasi', color: 'from-amber-500 to-orange-500' },
    { icon: Users, title: 'Career Path', desc: 'Jenjang jelas & stabil', color: 'from-emerald-500 to-teal-500' },
    { icon: Zap, title: 'Quick Apply', desc: 'Lamar hanya 1 klik', color: 'from-blue-500 to-cyan-500' },
  ];

  return (
    <div className="min-h-screen pb-28">
      <section className="relative overflow-hidden rounded-b-[2.25rem] bg-[linear-gradient(130deg,#0f172a_0%,#0b57d0_55%,#0f766e_100%)] px-4 pb-14 pt-8 text-white shadow-[0_30px_70px_rgba(15,23,42,0.36)]">
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-35" />
        <div className="pointer-events-none absolute -left-20 top-6 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-14 top-24 h-52 w-52 rounded-full bg-cyan-300/25 blur-3xl" />

        <div className="relative mx-auto w-full max-w-5xl">
          <div className="mb-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/35 bg-white/15 shadow-lg backdrop-blur">
                  <Briefcase className="h-5 w-5 text-cyan-100" />
                </div>
                <div>
                  <p className="brand-title text-3xl leading-none text-white">KarirKu</p>
                  <p className="mt-0.5 text-xs font-medium text-cyan-100/95">Cari kerja sesuai skill-mu</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="rounded-lg border border-white/30 bg-white/10 p-2 text-white/90 hover:bg-white/15">
                  <Bell className="h-5 w-5" />
                </button>
                <button className="rounded-lg border border-white/30 bg-white/10 p-2 text-white/90 hover:bg-white/15">
                  <Menu className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Mau cari kerja apa?"
                className="w-full rounded-2xl border border-white/20 bg-white px-11 py-3 text-sm font-medium text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.2)] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/15"
                >
                  <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} shadow-lg shadow-black/20`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold">{feature.title}</h3>
                  <p className="mt-1 text-[11px] text-slate-100/85">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-8 w-full max-w-5xl px-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.09)] md:p-6">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 md:text-2xl">Lowongan Pilihan Minggu Ini</h2>
              <p className="mt-1 text-sm text-slate-500">Rekomendasi terbaik berdasarkan kebutuhan industri saat ini</p>
            </div>
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white md:text-sm">{jobs.length} posisi</span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job, index) => (
                <div
                  key={job.id}
                  className="animate-rise-in"
                  style={{ animationDelay: `${index * 65}ms`, animationFillMode: 'both' }}
                >
                  <JobCard
                    job={{
                      ...job,
                      company: {
                        name: job.companies?.name || 'Unknown',
                        logo_url: job.companies?.logo_url || '',
                      },
                    }}
                    onClick={() => onJobClick(job.id)}
                    onSave={() => console.log('Save job:', job.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
