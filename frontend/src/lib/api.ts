const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8001/api').replace(/\/$/, '');
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
  },

  async login(email: string, password: string): Promise<SessionUser> {
    const data = await request<{ token: string; user: SessionUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(data.token);
    return data.user;
  },

  async me(): Promise<SessionUser> {
    const data = await request<{ user: SessionUser }>('/auth/me');
    return data.user;
  },

  async logout(): Promise<void> {
    try {
      await request<{ message: string }>('/auth/logout', {
        method: 'POST',
      });
    } finally {
      setAuthToken(null);
    }
  },

  async getCompanies(): Promise<CompanyItem[]> {
    return request<CompanyItem[]>('/companies');
  },

  async getJobs(limit = 10, query = '', status = 'all'): Promise<JobListItem[]> {
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
    return request<{ message: string; job: { id: string; title: string; approval_status: string } }>('/jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateJob(jobId: string, payload: UpdateJobPayload): Promise<{ message: string; job: { id: string; title: string; approval_status: string } }> {
    return request<{ message: string; job: { id: string; title: string; approval_status: string } }>(`/jobs/${encodeURIComponent(jobId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteJob(jobId: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/jobs/${encodeURIComponent(jobId)}`, {
      method: 'DELETE',
    });
  },

  async getJob(jobId: string): Promise<JobDetail> {
    return request<JobDetail>(`/jobs/${encodeURIComponent(jobId)}`);
  },

  async getApplications(status = 'all', userId?: string): Promise<ApplicationItem[]> {
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
    const form = new FormData();
    form.append('job_id', jobId);
    form.append('intro_video', introVideo);
    return request<{ message: string; id: string }>('/applications', {
      method: 'POST',
      body: form,
    });
  },

  async getProfile(profileId: string): Promise<Profile> {
    return request<Profile>(`/profiles/${encodeURIComponent(profileId)}`);
  },

  async getProfileStats(profileId: string): Promise<ProfileStats> {
    return request<ProfileStats>(`/profiles/${encodeURIComponent(profileId)}/stats`);
  },

  async getAdminOverview(): Promise<AdminOverview> {
    return request<AdminOverview>('/admin/overview');
  },

  async reviewJob(jobId: string, status: 'approved' | 'rejected', note = ''): Promise<{ message: string }> {
    return request<{ message: string }>(`/admin/jobs/${encodeURIComponent(jobId)}/approval`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        note: note.trim() ? note.trim() : null,
      }),
    });
  },
};
