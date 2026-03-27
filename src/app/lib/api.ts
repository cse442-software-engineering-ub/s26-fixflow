type ApiError = {
  message: string;
  status?: number;
};

type FixDetailsPayload = {
  description: string;
  removedCode?: {
    fileName: string;
    lineNumbers: string;
    reference: string;
  };
  addedCode?: {
    fileName: string;
    lineNumbers: string;
    reference: string;
  };
  gitBranch?: string;
  fixedBy: string;
  fixedAt: string;
};

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = import.meta.env.BASE_URL; // includes trailing slash
  const url = `${baseUrl}${path.replace(/^\//, '')}`;

  const res = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const text = await res.text();
  const json = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const message =
      (json && typeof json === 'object' && json !== null && 'message' in json && typeof (json as any).message === 'string'
        ? (json as any).message
        : `Request failed (${res.status})`);
    const err: ApiError = { message, status: res.status };
    throw err;
  }

  return json as T;
}

export const api = {
  notificationsList: (limit = 20) =>
    apiFetch<{
      success: boolean;
      activities: Array<{
        id: string;
        type: 'notification';
        bugNumber?: string;
        bugTitle?: string;
        message?: string;
        timestamp: string;
        user: string;
        isRead?: boolean;
      }>;
    }>(`api/notifications-list.php?limit=${encodeURIComponent(String(limit))}`, { method: 'GET' }),

  notificationsMarkRead: () =>
    apiFetch<{ success: boolean; message?: string }>('api/notifications-mark-read.php', { method: 'POST' }),

  me: () =>
    apiFetch<{ authenticated: boolean; user_id?: number; username?: string; role?: 'admin' | 'developer' }>('api/me.php', {
      method: 'GET',
    }),

  login: (username: string, password: string) =>
    apiFetch<{ success: boolean; username?: string; message?: string }>('api/login.php', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: () => apiFetch<{ success: boolean }>('api/logout.php', { method: 'POST' }),

  signup: (name: string, email: string, username: string, password: string) =>
    apiFetch<{ success: boolean; message?: string }>('api/signup.php', {
      method: 'POST',
      body: JSON.stringify({ name, email, username, password }),
    }),

  profileGet: () =>
    apiFetch<{
      user: {
        id: number;
        full_name?: string;
        name?: string;
        email: string;
        username: string;
        created_at?: string;
        joinDate?: string;
      };
      assignedBugs: any[];
    }>(
      'api/profile_get.php',
      { method: 'GET' }
    ),

  profileUpdate: (updates: { full_name?: string; email?: string; username?: string }) =>
    apiFetch<{ success: boolean; message?: string }>('api/profile_update.php', {
      method: 'POST',
      body: JSON.stringify(updates),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch<{ success: boolean; message?: string }>('api/change-password.php', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // Bugs CRUD
  listBugs: (options?: { status?: string; sort?: 'newest' | 'oldest'; assignedTo?: string }) => {
    const params = new URLSearchParams();
    if (options?.status) params.set('status', options.status);
    if (options?.sort) params.set('sort', options.sort);
    if (options?.assignedTo) params.set('assignedTo', options.assignedTo);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiFetch<{ success: boolean; bugs: any[] }>(`api/bugs-list.php${qs}`, {
      method: 'GET',
      cache: 'no-store',
    });
  },

  createBug: (payload: {
    title: string;
    code: string;
    priority: string;
    dueDate: string;
    description: string;
    status: string;
    assignedTo?: string | null;
  }) =>
    apiFetch<{ success: boolean; bug: any }>('api/bug-create.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateBug: (payload: {
    id: number;
    title?: string;
    code?: string;
    priority?: string;
    dueDate?: string;
    description?: string;
    status?: string;
    assignedTo?: string | null;
    fixDetails?: FixDetailsPayload;
  }) =>
    apiFetch<{ success: boolean; bug: any }>('api/bug-update.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteBug: (id: number, reason?: string) =>
    apiFetch<{ success: boolean }>('api/bug-delete.php', {
      method: 'POST',
      body: JSON.stringify({ id, reason: reason ?? '' }),
    }),

  suggestPriority: (payload: { title: string; description: string; code?: string }) =>
    apiFetch<{
      success: boolean;
      priority: 'high' | 'medium' | 'low';
      explanation: string;
      provider: string | null;
      fromCache: boolean;
      fallback?: boolean;
    }>('api/suggest-priority.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  listDeletedBugs: (sort?: 'newest' | 'oldest') => {
    const params = new URLSearchParams();
    if (sort) params.set('sort', sort);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiFetch<{ success: boolean; bugs: any[] }>(`api/bugs-deleted-list.php${qs}`, {
      method: 'GET',
      cache: 'no-store',
    });
  },

  restoreBug: (id: number) =>
    apiFetch<{ success: boolean }>('api/bug-restore.php', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),

  permanentDeleteBug: (id: number) =>
    apiFetch<{ success: boolean }>('api/bug-permanent-delete.php', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),

  sendVerificationCode: (email: string) =>
    apiFetch<{ success: boolean; message?: string; demo_code?: number | string }>('api/send-verification-code.php', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyResetCode: (email: string, code: string) =>
    apiFetch<{ success: boolean; message?: string }>('api/verify-reset-code.php', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),

  resetPassword: (email: string, code: string, password: string) =>
    apiFetch<{ success: boolean; message?: string }>('api/reset-password.php', {
      method: 'POST',
      body: JSON.stringify({ email, code, password }),
    }),

  // Admin-only endpoints (server enforces admin via session)
  adminListUsers: () =>
    apiFetch<{
      success: boolean;
      users: Array<{
        id: number;
        full_name: string;
        email: string;
        username: string;
        created_at: string;
        last_login_at: string | null;
        role: 'admin' | 'developer';
        assigned_count: number;
      }>;
    }>(
      'api/admin-list-users.php',
      { method: 'GET' }
    ),

  adminSetRole: (userId: number, role: 'admin' | 'developer') =>
    apiFetch<{ success: boolean; message?: string }>('api/admin-set-role.php', {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    }),

  adminMetrics: () =>
    apiFetch<{
      success: boolean;
      metrics: {
        users_total: number;
        bugs_total: number;
        bugs_open: number;
        bugs_resolved: number;
        bugs_overdue: number;
        bugs_unassigned: number;
        top_assignees: Array<{ username: string; bug_count: number }>;
      };
    }>('api/admin-metrics.php', { method: 'GET' }),

  adminAuditLog: (limit = 100) =>
    apiFetch<{
      success: boolean;
      logs: Array<{
        id: number;
        actor_username: string;
        action: string;
        target_type: string;
        target_id: string | null;
        details: string | null;
        created_at: string;
      }>;
    }>(`api/admin-audit-log.php?limit=${encodeURIComponent(String(limit))}`, { method: 'GET' }),

  adminResetPassword: (userId: number, newPassword: string) =>
    apiFetch<{ success: boolean; message?: string }>('api/admin-reset-password.php', {
      method: 'POST',
      body: JSON.stringify({ userId, newPassword }),
    }),

  adminDeleteUser: (userId: number) =>
    apiFetch<{ success: boolean; message?: string }>('api/admin-delete-user.php', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  adminUpdateUser: (payload: { userId: number; full_name?: string; email?: string; username?: string }) =>
    apiFetch<{ success: boolean; message?: string }>('api/admin-update-user.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  adminUserBugs: (userId: number) =>
    apiFetch<{
      success: boolean;
      bugs: Array<{
        id: number;
        bugNumber?: string;
        title: string;
        status: string;
        priority: string;
        created_at: string;
        due_date: string | null;
      }>;
    }>(
      `api/admin-user-bugs.php?userId=${encodeURIComponent(userId)}`,
      { method: 'GET' }
    ),

  adminReassignUserBugs: (fromUserId: number, toUserId: number | null) =>
    apiFetch<{ success: boolean; message?: string }>('api/admin-reassign-user-bugs.php', {
      method: 'POST',
      body: JSON.stringify({ fromUserId, toUserId }),
    }),

  listUsersBasic: () =>
    apiFetch<{ success: boolean; users: Array<{ id: number; username: string; email: string }> }>('api/users-options.php', {
      method: 'GET',
    }),
};


