const STORAGE_KEYS = {
  session: 'demo_session',
  jobs: 'demo_jobs',
  applications: 'demo_applications',
};

const demoProfile = {
  id: 'demo-user-1',
  full_name: 'Lutfi Dani',
  age: 24,
  years_experience: 3,
  location: 'Jakarta',
  education: 'S1 Teknik Informatika',
};

const defaultJobs = [
  {
    id: 'job-1',
    title: 'Frontend React Developer',
    location: 'Jakarta',
    salary_min: 9000000,
    salary_max: 14000000,
    min_age: 21,
    max_age: 35,
    min_experience_years: 2,
    company: 'Tech Nusantara',
    created_by_role: 'hrd',
  },
  {
    id: 'job-2',
    title: 'Backend Laravel Engineer',
    location: 'Remote',
    salary_min: 10000000,
    salary_max: 16000000,
    min_age: 23,
    max_age: 40,
    min_experience_years: 3,
    company: 'Fintek Maju',
    created_by_role: 'hrd',
  },
  {
    id: 'job-3',
    title: 'UI/UX Designer',
    location: 'Bandung',
    salary_min: 7000000,
    salary_max: 11000000,
    min_age: 20,
    max_age: 32,
    min_experience_years: 1,
    company: 'Nusantara Creative',
    created_by_role: 'hrd',
  },
];

let state = {
  session: null,
  view: 'home',
  jobs: [],
  applications: [],
  selectedJobId: null,
  selectedVideo: null,
  videoPreviewMap: new Map(),
  screeningFilter: 'all',
  statusFilter: 'all',
};

const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const roleBadge = document.getElementById('roleBadge');
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const logoutBtn = document.getElementById('logoutBtn');
const jobList = document.getElementById('jobList');
const jobDetail = document.getElementById('jobDetail');
const applicationList = document.getElementById('applicationList');
const profileCard = document.getElementById('profileCard');
const jobForm = document.getElementById('jobForm');
const hrdApplications = document.getElementById('hrdApplications');
const adminApplications = document.getElementById('adminApplications');
const adminMetrics = document.getElementById('adminMetrics');
const videoModal = document.getElementById('videoModal');
const modalVideo = document.getElementById('modalVideo');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const closeModalBtn = document.getElementById('closeModal');

const roleButtons = document.querySelectorAll('.role-btn');
const navButtons = document.querySelectorAll('.nav-btn');

const hrdTab = document.getElementById('hrdTab');
const adminTab = document.getElementById('adminTab');
const screeningFilters = document.getElementById('screeningFilters');
const statusFilters = document.getElementById('statusFilters');

const requiredVideoSeconds = 300;
const durationToleranceSeconds = 5;

function loadState() {
  const session = localStorage.getItem(STORAGE_KEYS.session);
  const jobs = localStorage.getItem(STORAGE_KEYS.jobs);
  const applications = localStorage.getItem(STORAGE_KEYS.applications);
  state.session = session ? JSON.parse(session) : null;
  state.jobs = jobs ? JSON.parse(jobs) : defaultJobs;
  state.applications = applications ? JSON.parse(applications) : [];
}

function persistState() {
  localStorage.setItem(STORAGE_KEYS.jobs, JSON.stringify(state.jobs));
  localStorage.setItem(STORAGE_KEYS.applications, JSON.stringify(state.applications));
}

function setSession(session) {
  state.session = session;
  if (session) {
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEYS.session);
  }
}

function setView(view) {
  state.view = view;
  document.querySelectorAll('.view').forEach((el) => {
    el.classList.toggle('hidden', el.id !== `view-${view}`);
  });
  navButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
}

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID').format(value);
}

function normalizeLocation(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ');
}

function isRemoteLocation(value) {
  const v = normalizeLocation(value);
  return v.includes('remote') || v.includes('wfh') || v.includes('work from home') || v.includes('hybrid');
}

function calculateScreening(profile, job) {
  const jobLocation = normalizeLocation(job.location || '');
  const candidateLocation = normalizeLocation(profile.location || '');
  const locationMatch = jobLocation === ''
    ? true
    : isRemoteLocation(jobLocation)
      ? true
      : candidateLocation && (jobLocation.includes(candidateLocation) || candidateLocation.includes(jobLocation));

  const experienceMatch = job.min_experience_years == null
    ? true
    : profile.years_experience != null && profile.years_experience >= job.min_experience_years;

  const ageMatch = (job.min_age == null && job.max_age == null)
    ? true
    : profile.age != null &&
      (job.min_age == null || profile.age >= job.min_age) &&
      (job.max_age == null || profile.age <= job.max_age);

  const matches = [locationMatch, experienceMatch, ageMatch].filter(Boolean).length;
  const score = Math.round((matches / 3) * 100);
  const pass = matches >= 2;

  return {
    score,
    result: pass ? 'pass' : 'fail',
    status: pass ? 'reviewing' : 'rejected',
    notes: [
      locationMatch ? 'Lokasi cocok' : 'Lokasi tidak cocok',
      experienceMatch ? 'Pengalaman cukup' : 'Pengalaman kurang',
      ageMatch ? 'Usia sesuai' : 'Usia tidak sesuai',
    ].join(' | '),
  };
}

function renderJobs() {
  jobList.innerHTML = '';
  state.jobs.forEach((job) => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <strong>${job.title}</strong>
      <div>${job.company} • ${job.location}</div>
      <div class="hint">Rp ${formatRupiah(job.salary_min)} - ${formatRupiah(job.salary_max)}</div>
    `;
    item.addEventListener('click', () => {
      state.selectedJobId = job.id;
      renderJobDetail();
    });
    jobList.appendChild(item);
  });
}

function renderJobDetail() {
  const job = state.jobs.find((j) => j.id === state.selectedJobId);
  if (!job) {
    jobDetail.innerHTML = 'Pilih lowongan untuk melihat detail.';
    return;
  }

  jobDetail.innerHTML = `
    <h3>${job.title}</h3>
    <p>${job.company} • ${job.location}</p>
    <p>Gaji: Rp ${formatRupiah(job.salary_min)} - ${formatRupiah(job.salary_max)}</p>
    <p>Syarat usia: ${job.min_age ?? '-'} - ${job.max_age ?? '-'} tahun</p>
    <p>Min pengalaman: ${job.min_experience_years ?? '-'} tahun</p>
    <label>
      Upload video perkenalan (5 menit)
      <input type="file" id="videoInput" accept="video/*" />
    </label>
    <div id="videoInfo" class="hint"></div>
    <button id="applyBtn" class="primary">Lamar Sekarang</button>
  `;

  const videoInput = jobDetail.querySelector('#videoInput');
  const videoInfo = jobDetail.querySelector('#videoInfo');
  const applyBtn = jobDetail.querySelector('#applyBtn');

  state.selectedVideo = null;
  videoInfo.textContent = '';

  videoInput.addEventListener('change', () => {
    const file = videoInput.files?.[0];
    if (!file) {
      state.selectedVideo = null;
      videoInfo.textContent = '';
      return;
    }

    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const duration = video.duration;
      const minAllowed = requiredVideoSeconds - durationToleranceSeconds;
      const maxAllowed = requiredVideoSeconds + durationToleranceSeconds;
      if (duration < minAllowed || duration > maxAllowed) {
        state.selectedVideo = null;
        videoInfo.textContent = 'Durasi video harus 5 menit (±5 detik).';
        return;
      }
      state.selectedVideo = file;
      videoInfo.textContent = `Durasi terdeteksi: ${Math.round(duration)} detik. Video siap.`;
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      state.selectedVideo = null;
      videoInfo.textContent = 'Gagal membaca video.';
    };
    video.src = url;
  });

  applyBtn.addEventListener('click', () => {
    if (!state.session || state.session.role !== 'user') {
      alert('Hanya kandidat (user) yang dapat melamar.');
      return;
    }
    if (!state.selectedVideo) {
      alert('Video perkenalan wajib dan harus 5 menit.');
      return;
    }

    const alreadyApplied = state.applications.some(
      (app) => app.job_id === job.id && app.user_id === demoProfile.id,
    );
    if (alreadyApplied) {
      alert('Anda sudah melamar lowongan ini.');
      return;
    }

    const screening = calculateScreening(demoProfile, job);
    const application = {
      id: `app-${Date.now()}`,
      user_id: demoProfile.id,
      candidate_name: demoProfile.full_name,
      job_id: job.id,
      job_title: job.title,
      company: job.company,
      location: job.location,
      status: screening.status,
      screening_score: screening.score,
      screening_result: screening.result,
      screening_notes: screening.notes,
      applied_at: new Date().toISOString(),
      has_video: true,
    };

    state.applications.unshift(application);
    const previewUrl = URL.createObjectURL(state.selectedVideo);
    state.videoPreviewMap.set(application.id, previewUrl);

    persistState();
    alert('Lamaran berhasil dikirim (demo).');
    renderApplications();
    renderHrdApplications();
    renderAdminApplications();
  });
}

function renderApplications() {
  applicationList.innerHTML = '';
  if (!state.session || state.session.role !== 'user') {
    applicationList.innerHTML = '<div class="card">Login sebagai user untuk melihat lamaran.</div>';
    return;
  }
  const apps = state.applications.filter((app) => app.user_id === demoProfile.id);
  if (apps.length === 0) {
    applicationList.innerHTML = '<div class="card">Belum ada lamaran.</div>';
    return;
  }

  apps.forEach((app) => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <strong>${app.job_title}</strong>
      <div>${app.company} • ${app.location}</div>
      <div class="hint">Status: ${app.status} | Skrining: ${app.screening_result} (${app.screening_score}%)</div>
      <button class="ghost" data-preview="${app.id}">Preview Video</button>
    `;
    item.querySelector('[data-preview]').addEventListener('click', () => {
      openVideoModal(app.job_title, state.videoPreviewMap.get(app.id));
    });
    applicationList.appendChild(item);
  });
}

function renderProfile() {
  profileCard.innerHTML = `
    <strong>${demoProfile.full_name}</strong>
    <p>Lokasi: ${demoProfile.location}</p>
    <p>Usia: ${demoProfile.age} tahun</p>
    <p>Pengalaman: ${demoProfile.years_experience} tahun</p>
    <p>Pendidikan: ${demoProfile.education}</p>
  `;
}

function renderHrdApplications() {
  if (!hrdApplications) return;
  hrdApplications.innerHTML = '';

  if (!state.session || state.session.role !== 'hrd') {
    hrdApplications.innerHTML = '<div class="card">Login sebagai HRD untuk melihat lamaran.</div>';
    return;
  }

  const filtered = state.applications.filter((app) => {
    const job = state.jobs.find((j) => j.id === app.job_id);
    if (!job || job.created_by_role !== 'hrd') return false;
    const screeningMatch = state.screeningFilter === 'all'
      ? true
      : state.screeningFilter === 'none'
        ? !app.screening_result
        : app.screening_result === state.screeningFilter;
    const statusMatch = state.statusFilter === 'all' || app.status === state.statusFilter;
    return screeningMatch && statusMatch;
  });

  if (filtered.length === 0) {
    hrdApplications.innerHTML = '<div class="card">Tidak ada lamaran sesuai filter.</div>';
    return;
  }

  filtered.forEach((app) => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <strong>${app.candidate_name}</strong>
      <div>${app.job_title} • ${app.company}</div>
      <div class="hint">Status: ${app.status} | Skrining: ${app.screening_result} (${app.screening_score}%)</div>
      <button class="ghost" data-preview="${app.id}">Preview Video</button>
    `;
    item.querySelector('[data-preview]').addEventListener('click', () => {
      openVideoModal(app.candidate_name, state.videoPreviewMap.get(app.id));
    });
    hrdApplications.appendChild(item);
  });
}

function renderAdminMetrics() {
  if (!adminMetrics) return;
  const totalJobs = state.jobs.length;
  const totalApps = state.applications.length;
  const totalUsers = 3;
  adminMetrics.innerHTML = `
    <div class="card"><strong>Total Jobs</strong><div>${totalJobs}</div></div>
    <div class="card"><strong>Total Lamaran</strong><div>${totalApps}</div></div>
    <div class="card"><strong>Total User</strong><div>${totalUsers}</div></div>
  `;
}

function renderAdminApplications() {
  if (!adminApplications) return;
  adminApplications.innerHTML = '';

  if (!state.session || state.session.role !== 'admin') {
    adminApplications.innerHTML = '<div class="card">Login sebagai Admin untuk melihat lamaran.</div>';
    return;
  }

  if (state.applications.length === 0) {
    adminApplications.innerHTML = '<div class="card">Belum ada lamaran.</div>';
    return;
  }

  state.applications.slice(0, 5).forEach((app) => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <strong>${app.candidate_name}</strong>
      <div>${app.job_title} • ${app.company}</div>
      <div class="hint">Status: ${app.status} | Skrining: ${app.screening_result} (${app.screening_score}%)</div>
      <button class="ghost" data-preview="${app.id}">Preview Video</button>
    `;
    item.querySelector('[data-preview]').addEventListener('click', () => {
      openVideoModal(app.candidate_name, state.videoPreviewMap.get(app.id));
    });
    adminApplications.appendChild(item);
  });
}

function openVideoModal(title, previewUrl) {
  modalTitle.textContent = title;
  modalMessage.textContent = '';
  if (previewUrl) {
    modalVideo.src = previewUrl;
    modalVideo.style.display = 'block';
    modalMessage.textContent = '';
  } else {
    modalVideo.removeAttribute('src');
    modalVideo.style.display = 'none';
    modalMessage.textContent = 'Preview hanya tersedia di sesi ini.';
  }
  videoModal.classList.remove('hidden');
}

function closeVideoModal() {
  modalVideo.pause();
  modalVideo.removeAttribute('src');
  videoModal.classList.add('hidden');
}

function setupFilters() {
  const screeningOptions = [
    { id: 'all', label: 'Semua' },
    { id: 'pass', label: 'Lolos' },
    { id: 'fail', label: 'Tidak Lolos' },
    { id: 'none', label: 'Belum Skrining' },
  ];
  const statusOptions = [
    { id: 'all', label: 'Semua' },
    { id: 'pending', label: 'Pending' },
    { id: 'reviewing', label: 'Reviewing' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'rejected', label: 'Rejected' },
  ];

  screeningFilters.innerHTML = '';
  statusFilters.innerHTML = '';

  screeningOptions.forEach((opt) => {
    const btn = document.createElement('button');
    btn.className = `filter-btn ${state.screeningFilter === opt.id ? 'active' : ''}`;
    btn.textContent = opt.label;
    btn.addEventListener('click', () => {
      state.screeningFilter = opt.id;
      setupFilters();
      renderHrdApplications();
    });
    screeningFilters.appendChild(btn);
  });

  statusOptions.forEach((opt) => {
    const btn = document.createElement('button');
    btn.className = `filter-btn ${state.statusFilter === opt.id ? 'active' : ''}`;
    btn.textContent = opt.label;
    btn.addEventListener('click', () => {
      state.statusFilter = opt.id;
      setupFilters();
      renderHrdApplications();
    });
    statusFilters.appendChild(btn);
  });
}

function bindEvents() {
  roleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const role = btn.dataset.role;
      if (role === 'admin') {
        emailInput.value = 'admin@karirku.test';
        passwordInput.value = 'admin12345';
      } else if (role === 'hrd') {
        emailInput.value = 'hrd@karirku.test';
        passwordInput.value = 'hrd12345';
      } else {
        emailInput.value = 'user@karirku.test';
        passwordInput.value = 'user12345';
      }
      emailInput.dataset.role = role;
    });
  });

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const role = emailInput.dataset.role || 'user';
    setSession({ role, email: emailInput.value });
    initUI();
  });

  logoutBtn.addEventListener('click', () => {
    setSession(null);
    closeVideoModal();
    initUI();
  });

  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setView(btn.dataset.view);
    });
  });

  jobForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const newJob = {
      id: `job-${Date.now()}`,
      title: document.getElementById('jobTitle').value,
      location: document.getElementById('jobLocation').value,
      salary_min: Number(document.getElementById('jobSalaryMin').value),
      salary_max: Number(document.getElementById('jobSalaryMax').value),
      min_age: document.getElementById('jobMinAge').value ? Number(document.getElementById('jobMinAge').value) : null,
      max_age: document.getElementById('jobMaxAge').value ? Number(document.getElementById('jobMaxAge').value) : null,
      min_experience_years: document.getElementById('jobMinExp').value ? Number(document.getElementById('jobMinExp').value) : null,
      company: 'Perusahaan Demo',
      created_by_role: 'hrd',
    };
    state.jobs.unshift(newJob);
    persistState();
    renderJobs();
    renderAdminMetrics();
    alert('Lowongan demo dibuat (status pending).');
    event.target.reset();
  });

  closeModalBtn.addEventListener('click', closeVideoModal);
  videoModal.addEventListener('click', (event) => {
    if (event.target === videoModal) {
      closeVideoModal();
    }
  });
}

function initUI() {
  closeVideoModal();
  if (!state.session) {
    loginView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
    return;
  }

  loginView.classList.add('hidden');
  dashboardView.classList.remove('hidden');

  roleBadge.textContent = `Role: ${state.session.role}`;
  hrdTab.style.display = state.session.role === 'hrd' ? 'inline-flex' : 'none';
  adminTab.style.display = state.session.role === 'admin' ? 'inline-flex' : 'none';

  setView('home');
  renderJobs();
  renderJobDetail();
  renderApplications();
  renderProfile();
  renderHrdApplications();
  renderAdminMetrics();
  renderAdminApplications();
  setupFilters();
}

loadState();
bindEvents();
initUI();
