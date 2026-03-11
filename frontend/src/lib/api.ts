const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8001/api').replace(/\/$/, '');
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true' || !import.meta.env.VITE_API_URL;
const AUTH_TOKEN_KEY = 'karirku_auth_token';

let authToken: string | null =
  typeof window !== 'undefined' ? window.localStorage.getItem(AUTH_TOKEN_KEY) : null;

export interface CompanySummary {
  name: string;
  logo_url: string;
}

export interface JobListItem {
  id: string;
  title: string;
  location: string;
  salary_min: number;
  salary_max: number;
  job_type: string;
  min_age: number | null;
  max_age: number | null;
  min_experience_years: number | null;
  is_featured: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  approval_note: string | null;
  company_id: string;
  created_by?: {
    id: number;
    name: string;
    email: string;
  } | null;
  reviewed_by?: {
    id: number;
    name: string;
    email: string;
  } | null;
  reviewed_at?: string | null;
  companies: CompanySummary;
}

export interface JobDetail {
  id: string;
  title: string;
  description: string;
  location: string;
  salary_min: number;
  salary_max: number;
  job_type: string;
  min_age: number | null;
  max_age: number | null;
  min_experience_years: number | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  approval_note: string | null;
  created_by?: {
    id: number;
    name: string;
    email: string;
  } | null;
  reviewed_by?: {
    id: number;
    name: string;
    email: string;
  } | null;
  reviewed_at?: string | null;
  requirements: string[];
  benefits: string[];
  companies: CompanySummary & {
    description: string;
    location: string;
  };
}

export interface ApplicationItem {
  id: string;
  status: string;
  screening_score: number | null;
  screening_result: string | null;
  screening_notes: string | null;
  intro_video_url?: string | null;
  applied_at: string;
  jobs: {
    id: string;
    title: string;
    location: string;
    companies: CompanySummary;
  };
  candidate?: {
    id: string;
    full_name: string;
    location: string;
    phone: string;
  };
}

export interface Profile {
  id: string;
  full_name: string;
  education: string;
  age: number | null;
  years_experience: number | null;
  location: string;
  phone: string;
  bio: string;
  avatar_url: string;
  is_premium: boolean;
}

export interface ProfileStats {
  application_count: number;
  accepted_count: number;
  profile_completion: number;
}

export interface CompanyItem {
  id: string;
  name: string;
  location: string;
}

export type UserRole = 'admin' | 'hrd' | 'user';

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  profile_id: string | null;
  profile: {
    id: string;
    full_name: string;
    location: string;
    education: string;
  } | null;
}

export interface AdminOverview {
  metrics: {
    users_total: number;
    applicants_total: number;
    admins_total: number;
    hrd_total: number;
    users_candidate_total: number;
    companies_total: number;
    jobs_total: number;
    jobs_pending_approval: number;
    jobs_approved: number;
    jobs_rejected: number;
    applications_total: number;
    applications_pending: number;
    applications_reviewing: number;
    applications_accepted: number;
    applications_rejected: number;
  };
  recent_applications: Array<{
    id: string;
    status: string;
    applied_at: string;
    intro_video_url?: string | null;
    candidate: {
      id: string;
      full_name: string;
      location: string;
    };
    job: {
      id: string;
      title: string;
      company: string;
    };
  }>;
  pending_jobs: Array<{
    id: string;
    title: string;
    location: string;
    job_type: string;
    salary_min: number;
    salary_max: number;
    created_at: string;
    company: {
      id: string;
      name: string;
    };
    created_by: {
      id: number;
      name: string;
      email: string;
    };
  }>;
  accounts: Array<{
    id: number;
    name: string;
    email: string;
    role: UserRole;
    profile_id: string | null;
    created_at: string | null;
  }>;
}

export interface CreateJobPayload {
  company_id: string;
  title: string;
  description?: string;
  location: string;
  salary_min: number;
  salary_max: number;
  job_type: string;
  min_age?: number | null;
  max_age?: number | null;
  min_experience_years?: number | null;
  requirements?: string[];
  benefits?: string[];
  expires_at?: string;
}

export type UpdateJobPayload = CreateJobPayload;

interface ApiError {
  message?: string;
}

function setAuthToken(token: string | null) {
  authToken = token;
  if (typeof window === 'undefined') {
    return;
  }

  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

const DEMO_SESSION_KEY = 'karirku_demo_session';
const DEMO_JOBS_KEY = 'karirku_demo_jobs';
const DEMO_APPLICATIONS_KEY = 'karirku_demo_applications';

const demoUsers: Array<SessionUser & { password: string }> = [
  {
    id: 1,
    name: 'Admin KarirKu',
    email: 'admin@karirku.test',
    password: 'admin12345',
    role: 'admin',
    profile_id: null,
    profile: null,
  },
  {
    id: 2,
    name: 'HRD KarirKu',
    email: 'hrd@karirku.test',
    password: 'hrd12345',
    role: 'hrd',
    profile_id: null,
    profile: null,
  },
  {
    id: 3,
    name: 'Lutfi Dani',
    email: 'user@karirku.test',
    password: 'user12345',
    role: 'user',
    profile_id: 'profile-1',
    profile: {
      id: 'profile-1',
      full_name: 'Lutfi Dani',
      location: 'Jakarta',
      education: 'S1 Teknik Informatika',
    },
  },
];

const demoProfiles: Record<string, Profile> = {
  'profile-1': {
    id: 'profile-1',
    full_name: 'Lutfi Dani',
    education: 'S1 Teknik Informatika',
    age: 24,
    years_experience: 3,
    location: 'Jakarta',
    phone: '0812-0000-0000',
    bio: 'Frontend developer dengan pengalaman membangun aplikasi rekrutmen.',
    avatar_url: '',
    is_premium: true,
  },
};

const demoCompanies: CompanyItem[] = [
  { id: 'comp-1', name: 'Tech Nusantara', location: 'Jakarta' },
  { id: 'comp-2', name: 'Fintek Maju', location: 'Bandung' },
];

const demoJobsSeed: JobListItem[] = [
  {
    id: 'job-1',
    title: 'Frontend React Developer',
    location: 'Jakarta',
    salary_min: 9000000,
    salary_max: 14000000,
    job_type: 'Full-time',
    min_age: 21,
    max_age: 35,
    min_experience_years: 2,
    is_featured: true,
    approval_status: 'approved',
    approval_note: null,
    company_id: 'comp-1',
    created_by: { id: 2, name: 'HRD KarirKu', email: 'hrd@karirku.test' },
    reviewed_by: { id: 1, name: 'Admin KarirKu', email: 'admin@karirku.test' },
    reviewed_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    companies: { name: 'Tech Nusantara', logo_url: '' },
  },
  {
    id: 'job-2',
    title: 'Backend Laravel Engineer',
    location: 'Remote',
    salary_min: 10000000,
    salary_max: 16000000,
    job_type: 'Full-time',
    min_age: 23,
    max_age: 40,
    min_experience_years: 3,
    is_featured: false,
    approval_status: 'approved',
    approval_note: null,
    company_id: 'comp-2',
    created_by: { id: 2, name: 'HRD KarirKu', email: 'hrd@karirku.test' },
    reviewed_by: { id: 1, name: 'Admin KarirKu', email: 'admin@karirku.test' },
    reviewed_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    companies: { name: 'Fintek Maju', logo_url: '' },
  },
  {
    id: 'job-3',
    title: 'UI/UX Designer',
    location: 'Bandung',
    salary_min: 7000000,
    salary_max: 11000000,
    job_type: 'Contract',
    min_age: 20,
    max_age: 32,
    min_experience_years: 1,
    is_featured: false,
    approval_status: 'pending',
    approval_note: null,
    company_id: 'comp-1',
    created_by: { id: 2, name: 'HRD KarirKu', email: 'hrd@karirku.test' },
    reviewed_by: null,
    reviewed_at: null,
    companies: { name: 'Tech Nusantara', logo_url: '' },
  },
];

const demoJobDetails: Record<string, Pick<JobDetail, 'description' | 'requirements' | 'benefits'>> = {
  'job-1': {
    description: 'Bangun UI modern untuk portal rekrutmen dan kolaborasi dengan tim backend.',
    requirements: ['React 18', 'Tailwind CSS', 'REST API'],
    benefits: ['Remote hybrid', 'Budget training', 'Asuransi kesehatan'],
  },
  'job-2': {
    description: 'Mengelola API Laravel, integrasi database, serta deployment.',
    requirements: ['Laravel 10+', 'PostgreSQL', 'REST API'],
    benefits: ['WFH', 'Bonus proyek', 'Medical cover'],
  },
  'job-3': {
    description: 'Mendesain pengalaman pengguna untuk aplikasi rekrutmen.',
    requirements: ['Figma', 'Design system', 'User research'],
    benefits: ['Jam fleksibel', 'Remote', 'Laptop kantor'],
  },
};

interface DemoState {
  jobs: JobListItem[];
  applications: ApplicationItem[];
}

const demoState: DemoState = {
  jobs: [],
  applications: [],
};

function loadDemoState() {
  if (typeof window === 'undefined') {
    demoState.jobs = demoJobsSeed;
    demoState.applications = [];
    return;
  }

  const jobsRaw = window.localStorage.getItem(DEMO_JOBS_KEY);
  const appsRaw = window.localStorage.getItem(DEMO_APPLICATIONS_KEY);

  demoState.jobs = jobsRaw ? (JSON.parse(jobsRaw) as JobListItem[]) : demoJobsSeed;
  demoState.applications = appsRaw ? (JSON.parse(appsRaw) as ApplicationItem[]) : [];
}

function persistDemoState() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DEMO_JOBS_KEY, JSON.stringify(demoState.jobs));
  window.localStorage.setItem(DEMO_APPLICATIONS_KEY, JSON.stringify(demoState.applications));
}

function getDemoSession(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(DEMO_SESSION_KEY);
  return raw ? (JSON.parse(raw) as SessionUser) : null;
}

function setDemoSession(user: SessionUser | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(DEMO_SESSION_KEY);
  }
}

function ensureDemoState() {
  if (demoState.jobs.length === 0) {
    loadDemoState();
  }
}

function buildJobDetail(job: JobListItem): JobDetail {
  const extras = demoJobDetails[job.id] ?? {
    description: 'Deskripsi lowongan belum tersedia.',
    requirements: [],
    benefits: [],
  };

  return {
    id: job.id,
    title: job.title,
    description: extras.description,
    location: job.location,
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    job_type: job.job_type,
    min_age: job.min_age,
    max_age: job.max_age,
    min_experience_years: job.min_experience_years,
    approval_status: job.approval_status,
    approval_note: job.approval_note,
    created_by: job.created_by ?? null,
    reviewed_by: job.reviewed_by ?? null,
    reviewed_at: job.reviewed_at ?? null,
    requirements: extras.requirements,
    benefits: extras.benefits,
    companies: {
      name: job.companies.name,
      logo_url: job.companies.logo_url,
      description: `${job.companies.name} adalah perusahaan teknologi yang berkembang.`,
      location: job.location,
    },
  };
}

function calculateScreening(profile: Profile, job: JobListItem) {
  const normalize = (value: string) => value.toLowerCase().trim();
  const isRemote = normalize(job.location).includes('remote');
  const locationMatch = isRemote || normalize(profile.location) === normalize(job.location);
  const expMatch = job.min_experience_years == null || (profile.years_experience ?? 0) >= job.min_experience_years;
  const ageMatch =
    profile.age != null &&
    (job.min_age == null || profile.age >= job.min_age) &&
    (job.max_age == null || profile.age <= job.max_age);

  const matches = [locationMatch, expMatch, ageMatch].filter(Boolean).length;
  const score = Math.round((matches / 3) * 100);
  const pass = matches >= 2;

  return {
    score,
    result: pass ? 'pass' : 'fail',
    status: pass ? 'reviewing' : 'rejected',
    notes: [
      locationMatch ? 'Lokasi cocok' : 'Lokasi tidak cocok',
      expMatch ? 'Pengalaman cukup' : 'Pengalaman kurang',
      ageMatch ? 'Usia sesuai' : 'Usia tidak sesuai',
    ].join(' | '),
  };
}

function buildAdminOverview(): AdminOverview {
  ensureDemoState();
  const jobs = demoState.jobs;
  const applications = demoState.applications;
  const metrics = {
    users_total: demoUsers.length,
    applicants_total: demoUsers.filter((u) => u.role === 'user').length,
    admins_total: demoUsers.filter((u) => u.role === 'admin').length,
    hrd_total: demoUsers.filter((u) => u.role === 'hrd').length,
    users_candidate_total: demoUsers.filter((u) => u.role === 'user').length,
    companies_total: demoCompanies.length,
    jobs_total: jobs.length,
    jobs_pending_approval: jobs.filter((j) => j.approval_status === 'pending').length,
    jobs_approved: jobs.filter((j) => j.approval_status === 'approved').length,
    jobs_rejected: jobs.filter((j) => j.approval_status === 'rejected').length,
    applications_total: applications.length,
    applications_pending: applications.filter((a) => a.status === 'pending').length,
    applications_reviewing: applications.filter((a) => a.status === 'reviewing').length,
    applications_accepted: applications.filter((a) => a.status === 'accepted').length,
    applications_rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  const recent_applications = applications.slice(0, 5).map((app) => ({
    id: app.id,
    status: app.status,
    applied_at: app.applied_at,
    intro_video_url: app.intro_video_url ?? null,
    candidate: {
      id: app.candidate?.id ?? 'profile-1',
      full_name: app.candidate?.full_name ?? 'Kandidat Demo',
      location: app.candidate?.location ?? 'Jakarta',
    },
    job: {
      id: app.jobs.id,
      title: app.jobs.title,
      company: app.jobs.companies.name,
    },
  }));

  const pending_jobs = jobs
    .filter((job) => job.approval_status === 'pending')
    .map((job) => ({
      id: job.id,
      title: job.title,
      location: job.location,
      job_type: job.job_type,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      created_at: new Date().toISOString(),
      company: {
        id: job.company_id,
        name: job.companies.name,
      },
      created_by: job.created_by ?? { id: 2, name: 'HRD KarirKu', email: 'hrd@karirku.test' },
    }));

  const accounts = demoUsers.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    profile_id: user.profile_id,
    created_at: new Date().toISOString(),
  }));

  return {
    metrics,
    recent_applications,
    pending_jobs,
    accounts,
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const payload = (await response.json()) as ApiError;
      if (payload.message) {
        message = payload.message;
      }
    } catch {
      // Keep fallback message when response body is not JSON.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

export const api = {
  getToken(): string | null {
    return authToken;
  },

  clearToken(): void {
    setAuthToken(null);
    if (DEMO_MODE) {
      setDemoSession(null);
    }
  },

  async login(email: string, password: string): Promise<SessionUser> {
    if (DEMO_MODE) {
      ensureDemoState();
      const user = demoUsers.find((candidate) => candidate.email === email);
      if (!user || user.password !== password) {
        throw new Error('Email atau password salah');
      }
      const { password: _password, ...session } = user;
      setAuthToken(`demo-token-${user.id}`);
      setDemoSession(session);
      return session;
    }

    const data = await request<{ token: string; user: SessionUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(data.token);
    return data.user;
  },

  async me(): Promise<SessionUser> {
    if (DEMO_MODE) {
      const session = getDemoSession();
      if (!session) {
        throw new Error('Unauthenticated');
      }
      return session;
    }

    const data = await request<{ user: SessionUser }>('/auth/me');
    return data.user;
  },

  async logout(): Promise<void> {
    if (DEMO_MODE) {
      setAuthToken(null);
      setDemoSession(null);
      return;
    }

    try {
      await request<{ message: string }>('/auth/logout', {
        method: 'POST',
      });
    } finally {
      setAuthToken(null);
    }
  },

  async getCompanies(): Promise<CompanyItem[]> {
    if (DEMO_MODE) {
      return demoCompanies;
    }
    return request<CompanyItem[]>('/companies');
  },

  async getJobs(limit = 10, query = '', status = 'all'): Promise<JobListItem[]> {
    if (DEMO_MODE) {
      ensureDemoState();
      let jobs = [...demoState.jobs];
      if (status !== 'all') {
        jobs = jobs.filter((job) => job.approval_status === status);
      }
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        jobs = jobs.filter((job) =>
          [job.title, job.location, job.companies.name].some((value) =>
            value.toLowerCase().includes(q),
          ),
        );
      }
      return jobs.slice(0, limit);
    }

    const params = new URLSearchParams({
      limit: String(limit),
    });

    if (query.trim()) {
      params.set('q', query.trim());
    }

    if (status !== 'all') {
      params.set('status', status);
    }

    return request<JobListItem[]>(`/jobs?${params.toString()}`);
  },

  async createJob(payload: CreateJobPayload): Promise<{ message: string; job: { id: string; title: string; approval_status: string } }> {
    if (DEMO_MODE) {
      ensureDemoState();
      const company = demoCompanies.find((item) => item.id === payload.company_id) ?? demoCompanies[0];
      const newJob: JobListItem = {
        id: `job-${Date.now()}`,
        title: payload.title,
        location: payload.location,
        salary_min: payload.salary_min,
        salary_max: payload.salary_max,
        job_type: payload.job_type,
        min_age: payload.min_age ?? null,
        max_age: payload.max_age ?? null,
        min_experience_years: payload.min_experience_years ?? null,
        is_featured: false,
        approval_status: 'pending',
        approval_note: null,
        company_id: company.id,
        created_by: { id: 2, name: 'HRD KarirKu', email: 'hrd@karirku.test' },
        reviewed_by: null,
        reviewed_at: null,
        companies: { name: company.name, logo_url: '' },
      };
      demoState.jobs.unshift(newJob);
      demoJobDetails[newJob.id] = {
        description: payload.description ?? 'Lowongan demo terbaru.',
        requirements: payload.requirements ?? [],
        benefits: payload.benefits ?? [],
      };
      persistDemoState();
      return { message: 'Lowongan demo berhasil dibuat', job: { id: newJob.id, title: newJob.title, approval_status: newJob.approval_status } };
    }

    return request<{ message: string; job: { id: string; title: string; approval_status: string } }>('/jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateJob(jobId: string, payload: UpdateJobPayload): Promise<{ message: string; job: { id: string; title: string; approval_status: string } }> {
    if (DEMO_MODE) {
      ensureDemoState();
      const job = demoState.jobs.find((item) => item.id === jobId);
      if (!job) {
        throw new Error('Lowongan tidak ditemukan');
      }
      job.title = payload.title;
      job.location = payload.location;
      job.salary_min = payload.salary_min;
      job.salary_max = payload.salary_max;
      job.job_type = payload.job_type;
      job.min_age = payload.min_age ?? null;
      job.max_age = payload.max_age ?? null;
      job.min_experience_years = payload.min_experience_years ?? null;
      demoJobDetails[job.id] = {
        description: payload.description ?? '',
        requirements: payload.requirements ?? [],
        benefits: payload.benefits ?? [],
      };
      persistDemoState();
      return { message: 'Lowongan demo diperbarui', job: { id: job.id, title: job.title, approval_status: job.approval_status } };
    }

    return request<{ message: string; job: { id: string; title: string; approval_status: string } }>(`/jobs/${encodeURIComponent(jobId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteJob(jobId: string): Promise<{ message: string }> {
    if (DEMO_MODE) {
      ensureDemoState();
      demoState.jobs = demoState.jobs.filter((job) => job.id !== jobId);
      persistDemoState();
      return { message: 'Lowongan demo dihapus' };
    }

    return request<{ message: string }>(`/jobs/${encodeURIComponent(jobId)}`, {
      method: 'DELETE',
    });
  },

  async getJob(jobId: string): Promise<JobDetail> {
    if (DEMO_MODE) {
      ensureDemoState();
      const job = demoState.jobs.find((item) => item.id === jobId);
      if (!job) {
        throw new Error('Lowongan tidak ditemukan');
      }
      return buildJobDetail(job);
    }

    return request<JobDetail>(`/jobs/${encodeURIComponent(jobId)}`);
  },

  async getApplications(status = 'all', userId?: string): Promise<ApplicationItem[]> {
    if (DEMO_MODE) {
      ensureDemoState();
      let apps = [...demoState.applications];
      if (userId) {
        apps = apps.filter((app) => app.candidate?.id === userId);
      }
      if (status !== 'all') {
        apps = apps.filter((app) => app.status === status);
      }
      return apps;
    }

    const params = new URLSearchParams();

    if (status !== 'all') {
      params.set('status', status);
    }

    if (userId) {
      params.set('user_id', userId);
    }

    const query = params.toString();
    return request<ApplicationItem[]>(`/applications${query ? `?${query}` : ''}`);
  },

  async applyJob(jobId: string, introVideo: File): Promise<{ message: string; id: string }> {
    if (DEMO_MODE) {
      ensureDemoState();
      const session = getDemoSession();
      if (!session || !session.profile_id) {
        throw new Error('Unauthenticated');
      }
      const job = demoState.jobs.find((item) => item.id === jobId);
      if (!job) {
        throw new Error('Lowongan tidak ditemukan');
      }
      const already = demoState.applications.find(
        (app) => app.jobs.id === jobId && app.candidate?.id === session.profile_id,
      );
      if (already) {
        throw new Error('Anda sudah melamar pekerjaan ini');
      }
      const profile = demoProfiles[session.profile_id];
      const screening = profile ? calculateScreening(profile, job) : { score: 0, result: null, status: 'pending', notes: null };
      const introUrl = typeof window !== 'undefined' ? URL.createObjectURL(introVideo) : null;
      const newApp: ApplicationItem = {
        id: `app-${Date.now()}`,
        status: screening.status,
        screening_score: screening.score,
        screening_result: screening.result,
        screening_notes: screening.notes,
        intro_video_url: introUrl ?? null,
        applied_at: new Date().toISOString(),
        jobs: {
          id: job.id,
          title: job.title,
          location: job.location,
          companies: job.companies,
        },
        candidate: {
          id: session.profile_id,
          full_name: profile?.full_name ?? session.name,
          location: profile?.location ?? 'Jakarta',
          phone: profile?.phone ?? '0812-0000-0000',
        },
      };
      demoState.applications.unshift(newApp);
      persistDemoState();
      return { message: 'Lamaran demo terkirim', id: newApp.id };
    }

    const form = new FormData();
    form.append('job_id', jobId);
    form.append('intro_video', introVideo);
    return request<{ message: string; id: string }>('/applications', {
      method: 'POST',
      body: form,
    });
  },

  async getProfile(profileId: string): Promise<Profile> {
    if (DEMO_MODE) {
      const profile = demoProfiles[profileId];
      if (!profile) {
        throw new Error('Profil tidak ditemukan');
      }
      return profile;
    }

    return request<Profile>(`/profiles/${encodeURIComponent(profileId)}`);
  },

  async getProfileStats(profileId: string): Promise<ProfileStats> {
    if (DEMO_MODE) {
      ensureDemoState();
      const apps = demoState.applications.filter((app) => app.candidate?.id === profileId);
      return {
        application_count: apps.length,
        accepted_count: apps.filter((app) => app.status === 'accepted').length,
        profile_completion: 85,
      };
    }

    return request<ProfileStats>(`/profiles/${encodeURIComponent(profileId)}/stats`);
  },

  async getAdminOverview(): Promise<AdminOverview> {
    if (DEMO_MODE) {
      return buildAdminOverview();
    }
    return request<AdminOverview>('/admin/overview');
  },

  async reviewJob(jobId: string, status: 'approved' | 'rejected', note = ''): Promise<{ message: string }> {
    if (DEMO_MODE) {
      ensureDemoState();
      const job = demoState.jobs.find((item) => item.id === jobId);
      if (!job) {
        throw new Error('Lowongan tidak ditemukan');
      }
      job.approval_status = status;
      job.approval_note = note.trim() ? note.trim() : null;
      job.reviewed_by = { id: 1, name: 'Admin KarirKu', email: 'admin@karirku.test' };
      job.reviewed_at = new Date().toISOString();
      persistDemoState();
      return { message: 'Review demo tersimpan' };
    }

    return request<{ message: string }>(`/admin/jobs/${encodeURIComponent(jobId)}/approval`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        note: note.trim() ? note.trim() : null,
      }),
    });
  },
};
