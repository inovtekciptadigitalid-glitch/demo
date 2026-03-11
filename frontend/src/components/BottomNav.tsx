import { Home, FileText, MessageCircle, Briefcase, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Beranda' },
    { id: 'applications', icon: FileText, label: 'Lamaran' },
    { id: 'jobs', icon: Briefcase, label: 'Pekerjaan' },
    { id: 'chat', icon: MessageCircle, label: 'Chat' },
    { id: 'profile', icon: User, label: 'Profil' },
  ];

  return (
    <nav className="fixed bottom-4 left-0 right-0 z-50 px-4">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200/80 bg-white/95 px-2 py-1.5 shadow-[0_18px_42px_rgba(15,23,42,0.16)] backdrop-blur">
        <div className="flex items-center justify-between gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[11px] transition-all md:text-xs ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/25'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className={`truncate font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
