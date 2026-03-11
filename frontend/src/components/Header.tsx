import { Search, Bell, Menu, Briefcase } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export function Header({ onMenuClick, showSearch, searchValue, onSearchChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-[linear-gradient(130deg,#0f172a_0%,#0b57d0_55%,#0f766e_100%)] text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-white/35 bg-white/15 p-2 backdrop-blur-sm">
              <Briefcase className="h-5 w-5 text-cyan-100" />
            </div>
            <h1 className="brand-title text-2xl font-bold tracking-tight">KarirKu</h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showSearch && (
          <div className="pb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari pekerjaan impian anda..."
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md"
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
