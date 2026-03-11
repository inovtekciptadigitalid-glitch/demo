import { useState, useEffect } from 'react';
import { api, type Profile, type ProfileStats } from '../lib/api';
import { User, MapPin, GraduationCap, Phone, Calendar, Award, Settings, LogOut, CreditCard as Edit, Briefcase } from 'lucide-react';

interface ProfilePageProps {
  userId: string | null;
  onAuthToggle: () => void;
}

export function ProfilePage({ userId, onAuthToggle }: ProfilePageProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ProfileStats | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setStats(null);
      setLoading(false);
      return;
    }

    fetchProfile(userId);
  }, [userId]);

  const fetchProfile = async (profileId: string) => {
    setLoading(true);
    try {
      const [profileData, profileStats] = await Promise.all([
        api.getProfile(profileId),
        api.getProfileStats(profileId),
      ]);
      setProfile(profileData);
      setStats(profileStats);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-28">
        <div className="text-center">
          <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">Silakan login untuk melihat profil</p>
          <button
            onClick={onAuthToggle}
            className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition-colors hover:bg-slate-800"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-28">
        <div className="animate-spin w-12 h-12 border-4 border-slate-800 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28">
      <div className="bg-[linear-gradient(130deg,#0f172a_0%,#0b57d0_55%,#0f766e_100%)] text-white pt-6 pb-20 px-4 shadow-[0_24px_56px_rgba(15,23,42,0.3)]">
        <div className="mx-auto w-full max-w-5xl">
          <div className="flex justify-end gap-2 mb-6">
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onAuthToggle}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 -mt-16">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_14px_34px_rgba(15,23,42,0.09)] p-6 mb-4">
          <div className="flex items-start gap-4 mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-800 to-sky-700 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
              {profile?.is_premium && (
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <Award className="w-3 h-3" />
                  PRO
                </div>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {profile?.full_name || 'User'}
              </h1>
              {profile?.bio && (
                <p className="text-slate-600 text-sm mb-3">{profile.bio}</p>
              )}
              <button className="inline-flex items-center gap-2 text-sky-700 text-sm font-semibold hover:text-sky-800">
                <Edit className="w-4 h-4" />
                Edit Profil
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {profile?.location && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-sky-700" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Lokasi</p>
                  <p className="text-sm font-semibold text-slate-900">{profile.location}</p>
                </div>
              </div>
            )}

            {profile?.education && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-5 h-5 text-cyan-700" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Pendidikan</p>
                  <p className="text-sm font-semibold text-slate-900">{profile.education}</p>
                </div>
              </div>
            )}

            {profile?.age && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Usia</p>
                  <p className="text-sm font-semibold text-slate-900">{profile.age} Tahun</p>
                </div>
              </div>
            )}

            {profile?.years_experience != null && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Pengalaman</p>
                  <p className="text-sm font-semibold text-slate-900">{profile.years_experience} Tahun</p>
                </div>
              </div>
            )}

            {profile?.phone && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Telepon</p>
                  <p className="text-sm font-semibold text-slate-900">{profile.phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg p-6 mb-4">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Statistik</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-sky-700 mb-1">{stats?.application_count || 0}</div>
              <p className="text-sm text-slate-600">Lamaran</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">{stats?.accepted_count || 0}</div>
              <p className="text-sm text-slate-600">Diterima</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-700 mb-1">{stats?.profile_completion || 85}%</div>
              <p className="text-sm text-slate-600">Profil</p>
            </div>
          </div>
        </div>

        {!profile?.is_premium && (
          <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2">Upgrade ke PRO</h3>
                <p className="text-sm text-white/90 mb-4">
                  Dapatkan akses ke fitur premium dan tingkatkan peluang karir Anda
                </p>
                <button className="bg-white text-orange-600 font-bold px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors shadow-md">
                  Upgrade Sekarang
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
