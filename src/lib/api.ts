// ============================================================
// Agradut Foundation — API Client
// Replaces the old Supabase client. All DB calls go through
// the Express backend REST API.
// ============================================================

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

type ApiOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

async function apiFetch<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `API error ${res.status}`);
  }
  return data as T;
}

// ── Auth ────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  register: (payload: { full_name: string; email: string; password: string; member_id?: string; admin_id?: string }) =>
    apiFetch<{ token: string; user: any }>('/api/auth/register', {
      method: 'POST',
      body: payload,
    }),

  sendOtp: (email: string) =>
    apiFetch<{ success: boolean }>('/api/auth/send-otp', {
      method: 'POST',
      body: { email },
    }),

  verifyOtp: (email: string, otp: string) =>
    apiFetch<{ success: boolean }>('/api/auth/verify-otp', {
      method: 'POST',
      body: { email, otp },
    }),

  resetPassword: (email: string, otp: string, new_password: string) =>
    apiFetch<{ success: boolean; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: { email, otp, new_password },
    }),
};

// ── Members ─────────────────────────────────────────────────
export const membersApi = {
  getAll: () => apiFetch<any[]>('/api/members'),

  verify: (member_id: string) =>
    apiFetch<any>(`/api/members/verify/${encodeURIComponent(member_id)}`),

  add: (member: {
    full_name: string; member_id: string; email?: string; phone?: string;
    designation?: string; status?: string;
  }) => apiFetch<any>('/api/members', { method: 'POST', body: member }),

  bulkImport: (members: any[]) =>
    apiFetch<any[]>('/api/members/bulk', { method: 'POST', body: { members } }),

  update: (id: string, data: any) =>
    apiFetch<any>(`/api/members/${id}`, { method: 'PUT', body: data }),

  dismiss: (id: string) =>
    apiFetch<any>(`/api/members/${id}/dismiss`, { method: 'PATCH' }),

  delete: (id: string) =>
    apiFetch<any>(`/api/members/${id}`, { method: 'DELETE' }),

  deleteAll: () =>
    apiFetch<any>('/api/members', { method: 'DELETE' }),
};

// ── Programs ────────────────────────────────────────────────
const makeProgramApi = (type: 'past' | 'future') => ({
  getAll: () => apiFetch<any[]>(`/api/programs/${type}`),

  add: (prog: { title: string; date: string; place: string; details?: string; image_url?: string }) =>
    apiFetch<any>(`/api/programs/${type}`, { method: 'POST', body: prog }),

  update: (id: string, data: { title: string; date: string; place: string; details?: string }) =>
    apiFetch<any>(`/api/programs/${type}/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<any>(`/api/programs/${type}/${id}`, { method: 'DELETE' }),
});

export const pastProgramsApi  = makeProgramApi('past');
export const futureProgramsApi = makeProgramApi('future');

// ── Payments ────────────────────────────────────────────────
export const paymentsApi = {
  get: (month: number, year: number) =>
    apiFetch<any[]>(`/api/payments?month=${month}&year=${year}`),

  record: (payment: {
    receipt_id: string; member_id: string; full_name: string; amount: number;
    payment_method?: string; transaction_ref?: string; payment_date?: string;
    month: number; year: number; notes?: string;
  }) => apiFetch<any>('/api/payments', { method: 'POST', body: payment }),
};

// ── Donations ───────────────────────────────────────────────
export const donationsApi = {
  get: (month: number, year: number) =>
    apiFetch<any[]>(`/api/donations?month=${month}&year=${year}`),

  record: (donation: {
    receipt_id: string; full_name: string; email?: string; phone?: string;
    amount: number; transaction_id?: string; message?: string;
    donation_date?: string; month: number; year: number;
  }) => apiFetch<any>('/api/donations', { method: 'POST', body: donation }),
};

// ── Certificate Requests ─────────────────────────────────────
export const certificatesApi = {
  getAll: () => apiFetch<any[]>('/api/certificates'),

  check: (member_id: string, year: string) =>
    apiFetch<any[]>(`/api/certificates/check?member_id=${encodeURIComponent(member_id)}&year=${year}`),

  submit: (req: { member_id: string; full_name: string; email?: string; year: string }) =>
    apiFetch<any>('/api/certificates', { method: 'POST', body: req }),

  updateStatus: (id: string, status: 'approved' | 'rejected') =>
    apiFetch<any>(`/api/certificates/${id}`, { method: 'PUT', body: { status } }),
};

// ── Service Requests ─────────────────────────────────────────
export const servicesApi = {
  getAll: () => apiFetch<any[]>('/api/services'),

  submit: (req: {
    type: string; full_name: string; email?: string; phone: string;
    blood_group?: string | null; details?: string;
  }) => apiFetch<any>('/api/services', { method: 'POST', body: req }),

  updateStatus: (id: string, status: string) =>
    apiFetch<any>(`/api/services/${id}`, { method: 'PUT', body: { status } }),
};
