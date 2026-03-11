import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { BottomNav } from './components/BottomNav';
import { JobCard } from './components/JobCard';
import { HomePage } from './pages/HomePage';
import { JobDetailPage } from './pages/JobDetailPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { HrdDashboardPage } from './pages/HrdDashboardPage';
import { api, type JobListItem, type SessionUser } from './lib/api';

type Page = 'home' | 'job-detail' | 'applications' | 'jobs' | 'chat' | 'profile';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      if (!api.getToken()) {
        setAuthLoading(false);
        return;
      }

      try {
        const user = await api.me();
        setSessionUser(user);
      } catch {
        api.clearToken();
        setSessionUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const user = await api.login(email, password);
    setSessionUser(user);
    setCurrentPage('home');
    setSelectedJobId(null);
  };

  const handleLogout = async () => {
    await api.logout();
    setSessionUser(null);
    setCurrentPage('home');
    setSelectedJobId(null);
    setSearchQuery('');
  };

  const handleJobClick = (jobId: string) => {
    setSelectedJobId(jobId);
    setCurrentPage('job-detail');
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
    setSelectedJobId(null);
  };

  const handleTabChange = (tab: string) => {
    setCurrentPage(tab as Page);
  };

  const handleApply = async (jobId: string, introVideo: File) => {
    if (!sessionUser || sessionUser.role !== 'user') {
      alert('Fitur lamaran hanya untuk akun user kandidat');
      return;
    }

    if (!sessionUser.profile_id) {
      alert('Akun Anda belum terhubung ke profil kandidat');
      return;
    }

    try {
      await api.applyJob(jobId, introVideo);
      alert('Lamaran berhasil dikirim!');
      setCurrentPage('applications');
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.toLowerCase().includes('sudah melamar')) {
        alert('Anda sudah melamar pekerjaan ini');
        return;
      }
      alert(message || 'Gagal mengirim lamaran');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-800 border-t-transparent" />
      </div>
    );
  }

  if (!sessionUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (sessionUser.role === 'admin') {
    return <AdminDashboardPage user={sessionUser} onLogout={handleLogout} />;
  }

  if (sessionUser.role === 'hrd') {
    return <HrdDashboardPage user={sessionUser} onLogout={handleLogout} />;
  }

  const userProfileId = sessionUser.profile_id;

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onJobClick={handleJobClick} />;
      case 'job-detail':
        if (!selectedJobId) return <HomePage onJobClick={handleJobClick} />;
        return (
          <JobDetailPage
            jobId={selectedJobId}
            onBack={handleBackToHome}
            onApply={handleApply}
          />
        );
      case 'applications':
        return <ApplicationsPage userId={userProfileId} onJobClick={handleJobClick} />;
      case 'jobs':
        return (
          <JobSearchPage
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onJobClick={handleJobClick}
          />
        );
      case 'chat':
        return <ChatPlaceholder />;
      case 'profile':
        return <ProfilePage userId={userProfileId} onAuthToggle={() => void handleLogout()} />;
      default:
        return <HomePage onJobClick={handleJobClick} />;
    }
  };

  const showBottomNav = currentPage !== 'job-detail';

  return (
    <div className="min-h-screen bg-transparent">
      {renderPage()}
      {showBottomNav && (
        <BottomNav activeTab={currentPage} onTabChange={handleTabChange} />
      )}
    </div>
  );
}

function JobSearchPage({
  searchQuery,
  onSearchChange,
  onJobClick,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onJobClick: (jobId: string) => void;
}) {
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchResults = async () => {
      const query = searchQuery.trim();
      if (!query) {
        setJobs([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await api.getJobs(20, query);
        if (active) {
          setJobs(data);
        }
      } catch (error) {
        console.error('Search jobs error:', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(fetchResults, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  return (
    <div className="min-h-screen pb-28">
      <div className="rounded-b-[2rem] bg-[linear-gradient(130deg,#0f172a_0%,#0b57d0_55%,#0f766e_100%)] px-4 pb-8 pt-8 text-white shadow-[0_22px_52px_rgba(15,23,42,0.32)]">
        <div className="mx-auto w-full max-w-5xl">
          <h1 className="brand-title mb-4 text-3xl">Cari Pekerjaan</h1>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan posisi, perusahaan, lokasi..."
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              className="w-full rounded-2xl border border-white/20 bg-white px-12 py-3 text-slate-900 placeholder-slate-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-300"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        {!searchQuery.trim() ? (
          <div className="text-center py-12">
            <Search className="mx-auto mb-4 h-16 w-16 text-slate-300" />
            <p className="text-slate-500">Ketik kata kunci untuk mulai mencari pekerjaan</p>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-slate-500">
            Tidak ada lowongan yang cocok dengan kata kunci Anda.
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={{
                  ...job,
                  company: {
                    name: job.companies?.name || 'Unknown',
                    logo_url: job.companies?.logo_url || '',
                  },
                }}
                onClick={() => onJobClick(job.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatPlaceholder() {
  return (
    <div className="min-h-screen pb-28 flex items-center justify-center">
      <div className="text-center px-4">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-cyan-100">
          <svg className="h-12 w-12 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Chat dengan HRD</h2>
        <p className="mb-6 max-w-md mx-auto text-slate-600">
          Fitur chat akan memungkinkan Anda berkomunikasi langsung dengan tim HRD perusahaan.
        </p>
        <div className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-2 text-sm font-medium text-cyan-800">
          Segera Hadir
        </div>
      </div>
    </div>
  );
}

export default App;
