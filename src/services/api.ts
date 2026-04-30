/**
 * Serviço de API — conecta o frontend ao backend Node.js + RabbitMQ
 * Substitui as chamadas diretas ao Supabase nas operações de escrita.
 * Leituras continuam via Supabase (polling) para compatibilidade com o DataContext existente.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ── Token JWT ─────────────────────────────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem('jogos_unisanta_token');
}

export function setToken(token: string): void {
  localStorage.setItem('jogos_unisanta_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('jogos_unisanta_token');
}

// ── Fetch base ────────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw { status: res.status, ...data };
  }

  return data as T;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  status: 'ok' | 'unconfirmed' | 'invalid';
  user?: Record<string, unknown>;
  token?: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (userData: {
    email: string;
    name: string;
    surname: string;
    preferredCourse?: string;
    favoriteTeam?: string;
    password: string;
  }) =>
    request<{ success: boolean; pendingEmail?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  confirmEmail: (email: string, code: string) =>
    request<{ success: boolean; user?: Record<string, unknown>; token?: string; reason?: string }>(
      '/auth/confirm-email',
      {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      },
    ),

  resendConfirmation: (email: string) =>
    request<{ success: boolean }>('/auth/resend-confirmation', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  updateProfile: (updates: { name?: string; preferredCourse?: string; favoriteTeam?: string }) =>
    request<{ success: boolean }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  me: () => request<Record<string, unknown>>('/auth/me'),
};

// ── Matches ───────────────────────────────────────────────────────────────────

export const matchesApi = {
  getAll: () => request<unknown[]>('/matches'),

  getById: (id: string) => request<unknown>(`/matches/${id}`),

  create: (match: unknown) =>
    request<{ success: boolean }>('/matches', {
      method: 'POST',
      body: JSON.stringify(match),
    }),

  update: (id: string, match: unknown) =>
    request<{ success: boolean }>(`/matches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(match),
    }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/matches/${id}`, { method: 'DELETE' }),

  deleteScheduled: () =>
    request<{ success: boolean }>('/matches/scheduled', { method: 'DELETE' }),
};

// ── Courses ───────────────────────────────────────────────────────────────────

export const coursesApi = {
  getAll: () => request<unknown[]>('/courses'),

  create: (course: { id?: string; name: string; university: string; emblem_url?: string }) =>
    request<{ success: boolean }>('/courses', {
      method: 'POST',
      body: JSON.stringify(course),
    }),

  delete: (name: string, university: string) =>
    request<{ success: boolean }>('/courses', {
      method: 'DELETE',
      body: JSON.stringify({ name, university }),
    }),
};

// ── Athletes ──────────────────────────────────────────────────────────────────

export const athletesApi = {
  getAll: () => request<unknown[]>('/athletes'),

  create: (athlete: {
    id?: string;
    firstName: string;
    lastName: string;
    institution: string;
    course: string;
    sports: string[];
    sex?: string;
  }) =>
    request<{ success: boolean }>('/athletes', {
      method: 'POST',
      body: JSON.stringify(athlete),
    }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/athletes/${id}`, { method: 'DELETE' }),
};

// ── Ranking ───────────────────────────────────────────────────────────────────

export const rankingApi = {
  getAll: () => request<unknown[]>('/ranking'),

  update: (course: string, points: number) =>
    request<{ success: boolean }>(`/ranking/${encodeURIComponent(course)}`, {
      method: 'PUT',
      body: JSON.stringify({ points }),
    }),

  reset: () =>
    request<{ success: boolean }>('/ranking/reset', { method: 'POST' }),

  restore: () =>
    request<{ success: boolean }>('/ranking/restore', { method: 'POST' }),
};

// ── Predictions ───────────────────────────────────────────────────────────────

export const predictionsApi = {
  getAll: () => request<Record<string, unknown>>('/predictions'),

  save: (predictions: Record<string, { matchId: string; scoreA: number | ''; scoreB: number | '' }>) =>
    request<{ success: boolean }>('/predictions', {
      method: 'POST',
      body: JSON.stringify({ predictions }),
    }),
};

// ── Featured Athletes ─────────────────────────────────────────────────────────

export const featuredAthletesApi = {
  getAll: () => request<unknown[]>('/featured-athletes'),

  create: (athlete: {
    id?: string;
    name: string;
    institution: string;
    course: string;
    sport: string;
    reason?: string;
  }) =>
    request<{ success: boolean }>('/featured-athletes', {
      method: 'POST',
      body: JSON.stringify(athlete),
    }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/featured-athletes/${id}`, { method: 'DELETE' }),
};

// ── MVP ───────────────────────────────────────────────────────────────────────

export const mvpApi = {
  getCandidates: () => request<unknown[]>('/mvp/candidates'),

  getCandidatesByMatch: (matchId: string) =>
    request<unknown[]>(`/mvp/candidates/${matchId}`),

  ensureCandidates: (candidates: unknown[]) =>
    request<{ success: boolean }>('/mvp/candidates/ensure', {
      method: 'POST',
      body: JSON.stringify({ candidates }),
    }),

  getVotes: () => request<unknown[]>('/mvp/votes'),

  vote: (candidateId: string, currentVotes: number, matchId: string) =>
    request<{
      success: boolean;
      reason?: 'already-voted' | 'error';
      vote?: unknown;
    }>('/mvp/vote', {
      method: 'POST',
      body: JSON.stringify({ candidateId, currentVotes, matchId }),
    }),
};

// ── Torcida ───────────────────────────────────────────────────────────────────

export const torcidaApi = {
  getPosts: () => request<unknown[]>('/torcida/posts'),

  createPost: (content: string, imageFile?: File) => {
    const formData = new FormData();
    formData.append('content', content);
    if (imageFile) formData.append('image', imageFile);

    const token = getToken();
    return fetch(`${BASE_URL}/torcida/posts`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then((r) => r.json());
  },

  deletePost: (postId: string) =>
    request<{ success: boolean }>(`/torcida/posts/${postId}`, { method: 'DELETE' }),

  getComments: (postId: string) =>
    request<unknown[]>(`/torcida/posts/${postId}/comments`),

  createComment: (postId: string, content: string) =>
    request<unknown>(`/torcida/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  deleteComment: (commentId: string) =>
    request<{ success: boolean }>(`/torcida/comments/${commentId}`, { method: 'DELETE' }),

  getLikes: () => request<string[]>('/torcida/likes'),

  toggleLike: (postId: string) =>
    request<{ liked: boolean }>(`/torcida/posts/${postId}/like`, { method: 'POST' }),

  getNotifications: () => request<unknown[]>('/torcida/notifications'),
};

// ── Admin ─────────────────────────────────────────────────────────────────────

export const adminApi = {
  getAdmins: () => request<unknown[]>('/admin/users'),

  promote: (email: string) =>
    request<{ success: boolean }>('/admin/promote', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  demote: (id: string) =>
    request<{ success: boolean }>(`/admin/demote/${id}`, { method: 'POST' }),
};

// ── Leagues ───────────────────────────────────────────────────────────────────

export const leaguesApi = {
  getAll: () => request<unknown[]>('/leagues'),

  getById: (id: string) => request<unknown>(`/leagues/${id}`),

  create: (name: string, description: string) =>
    request<{ id: string }>('/leagues', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),

  update: (id: string, updates: { name?: string; description?: string; participants?: string[] }) =>
    request<{ success: boolean }>(`/leagues/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/leagues/${id}`, { method: 'DELETE' }),

  join: (id: string) =>
    request<{ success: boolean; alreadyMember?: boolean; league?: unknown }>(`/leagues/${id}/join`, {
      method: 'POST',
    }),

  getRanking: (id: string) => request<unknown[]>(`/leagues/${id}/ranking`),

  getBolaoRanking: () => request<unknown[]>('/leagues/bolao/ranking'),

  getUserPredictions: (email: string) =>
    request<unknown[]>(`/leagues/bolao/user-predictions/${encodeURIComponent(email)}`),

  getRequests: (id: string) => request<unknown[]>(`/leagues/${id}/requests`),

  createRequest: (id: string, user_name: string) =>
    request<{ success: boolean }>(`/leagues/${id}/requests`, {
      method: 'POST',
      body: JSON.stringify({ user_name }),
    }),

  updateRequest: (requestId: string, status: 'approved' | 'rejected') =>
    request<{ success: boolean }>(`/leagues/requests/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  getMyRequests: () => request<unknown[]>('/leagues/user/my-requests'),
};

// ── Forgot Password ───────────────────────────────────────────────────────────

export const forgotPasswordApi = {
  sendCode: (email: string) =>
    request<{ success: boolean }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyCode: (email: string, code: string) =>
    request<{ success: boolean }>('/auth/verify-reset-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    request<{ success: boolean }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
    }),
};
