import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface AdminUsersProps {
  currentUser: string;
}

interface UserRow {
  id: number;
  full_name: string;
  email: string;
  username: string;
  created_at: string;
  last_login_at: string | null;
  role: 'admin' | 'developer';
  assigned_count: number;
}

interface AdminMetrics {
  users_total: number;
  bugs_total: number;
  bugs_open: number;
  bugs_resolved: number;
  bugs_overdue: number;
  bugs_unassigned: number;
  top_assignees: Array<{ username: string; bug_count: number }>;
}

interface AuditLogRow {
  id: number;
  actor_username: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: string | null;
  created_at: string;
}

export function AdminUsers({ currentUser }: AdminUsersProps) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [resetTargetUser, setResetTargetUser] = useState<UserRow | null>(null);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ full_name: string; email: string; username: string }>({
    full_name: '',
    email: '',
    username: '',
  });
  const [selectedUserForBugs, setSelectedUserForBugs] = useState<UserRow | null>(null);
  const [selectedUserBugs, setSelectedUserBugs] = useState<
    {
      id: number;
      bugNumber?: string;
      title: string;
      status: string;
      priority: string;
      created_at: string;
      due_date: string | null;
    }[]
  >([]);
  const [loadingBugs, setLoadingBugs] = useState(false);
  const [reassignTargetId, setReassignTargetId] = useState<number | 'unassign' | ''>('');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [usersRes, metricsRes, auditRes] = await Promise.all([
          api.adminListUsers(),
          api.adminMetrics(),
          api.adminAuditLog(100),
        ]);
        if (cancelled) return;
        if (!usersRes.success) {
          setError((usersRes as any as string) || 'Failed to load users');
          return;
        }
        setUsers(usersRes.users);
        if (metricsRes.success) setMetrics(metricsRes.metrics);
        if (auditRes.success) setAuditLogs(auditRes.logs);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load users');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openResetModal = (user: UserRow) => {
    setError('');
    setActionMessage('');
    setResetTargetUser(user);
    setResetPasswordInput('');
  };

  const closeResetModal = () => {
    setResetTargetUser(null);
    setResetPasswordInput('');
  };

  const handleResetPassword = async () => {
    if (!resetTargetUser) return;
    setError('');
    setActionMessage('');
    if (!resetPasswordInput.trim()) {
      setError('Please enter a temporary password.');
      return;
    }
    try {
      const res = await api.adminResetPassword(resetTargetUser.id, resetPasswordInput.trim());
      if (!res.success) {
        setError(res.message || 'Failed to reset password');
        return;
      }
      setActionMessage(`Password reset for ${resetTargetUser.username}`);
      closeResetModal();
    } catch (e: any) {
      setError(e?.message || 'Failed to reset password');
    }
  };

  const handleDeleteUser = async (user: UserRow) => {
    setError('');
    setActionMessage('');
    if (user.username === currentUser) {
      setError('You cannot delete your own account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      return;
    }
    try {
      const res = await api.adminDeleteUser(user.id);
      if (!res.success) {
        setError(res.message || 'Failed to delete user');
        return;
      }
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setActionMessage(`Deleted user ${user.username}`);
    } catch (e: any) {
      setError(e?.message || 'Failed to delete user');
    }
  };

  const handleSetRole = async (user: UserRow, nextRole: 'admin' | 'developer') => {
    setError('');
    setActionMessage('');
    if (user.role === nextRole) return;
    try {
      const res = await api.adminSetRole(user.id, nextRole);
      if (!res.success) {
        setError(res.message || 'Failed to update role');
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u)));
      setActionMessage(`Updated role for ${user.username} to ${nextRole}`);
      const auditRes = await api.adminAuditLog(100);
      if (auditRes.success) setAuditLogs(auditRes.logs);
    } catch (e: any) {
      setError(e?.message || 'Failed to update role');
    }
  };

  const startEdit = (user: UserRow) => {
    setEditingId(user.id);
    setEditValues({
      full_name: user.full_name,
      email: user.email,
      username: user.username,
    });
    setError('');
    setActionMessage('');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (user: UserRow) => {
    setError('');
    setActionMessage('');
    try {
      const res = await api.adminUpdateUser({
        userId: user.id,
        full_name: editValues.full_name,
        email: editValues.email,
        username: editValues.username,
      });
      if (!res.success) {
        setError(res.message || 'Failed to update user');
        return;
      }
      setUsers(prev =>
        prev.map(u =>
          u.id === user.id
            ? {
                ...u,
                full_name: editValues.full_name,
                email: editValues.email,
                username: editValues.username,
              }
            : u,
        ),
      );
      setEditingId(null);
      setActionMessage(`Updated user ${editValues.username}`);
    } catch (e: any) {
      setError(e?.message || 'Failed to update user');
    }
  };

  const openUserBugs = async (user: UserRow) => {
    setError('');
    setActionMessage('');
    setSelectedUserForBugs(user);
    setLoadingBugs(true);
    setSelectedUserBugs([]);
    try {
      const res = await api.adminUserBugs(user.id);
      if (!res.success) {
        setError(res.message || 'Failed to load bugs');
        return;
      }
      setSelectedUserBugs(res.bugs);
    } catch (e: any) {
      setError(e?.message || 'Failed to load bugs');
    } finally {
      setLoadingBugs(false);
    }
  };

  const closeUserBugs = () => {
    setSelectedUserForBugs(null);
    setSelectedUserBugs([]);
    setReassignTargetId('');
  };

  const handleReassignAll = async () => {
    if (!selectedUserForBugs) return;
    setError('');
    setActionMessage('');
    if (reassignTargetId === '') {
      setError('Choose a target user or Unassign.');
      return;
    }
    const toUserId = reassignTargetId === 'unassign' ? null : Number(reassignTargetId);
    if (toUserId === selectedUserForBugs.id) {
      setError('Target user cannot be the same as the source user.');
      return;
    }
    try {
      const res = await api.adminReassignUserBugs(selectedUserForBugs.id, toUserId);
      if (!res.success) {
        setError(res.message || 'Failed to reassign bugs');
        return;
      }
      // Update counts locally
      setUsers(prev =>
        prev.map(u => {
          if (u.id === selectedUserForBugs.id) {
            return { ...u, assigned_count: 0 };
          }
          if (toUserId !== null && u.id === toUserId) {
            return { ...u, assigned_count: u.assigned_count + selectedUserBugs.length };
          }
          return u;
        }),
      );
      setActionMessage(
        toUserId === null
          ? `Unassigned ${selectedUserBugs.length} bugs from ${selectedUserForBugs.username}`
          : `Reassigned ${selectedUserBugs.length} bugs from ${selectedUserForBugs.username}`,
      );
      closeUserBugs();
    } catch (e: any) {
      setError(e?.message || 'Failed to reassign bugs');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading users…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Admin – Manage Users</h1>
          <p className="text-gray-600 text-sm">
            Only the admin user can access this page. Use it to manage users, reset passwords, and clean up bug ownership.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {actionMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
            {actionMessage}
          </div>
        )}

        {metrics && (
          <div className="mb-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white rounded-lg p-3 shadow-sm border">
              <p className="text-xs text-gray-500">Users</p>
              <p className="text-xl font-bold">{metrics.users_total}</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border">
              <p className="text-xs text-gray-500">Total Bugs</p>
              <p className="text-xl font-bold">{metrics.bugs_total}</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border">
              <p className="text-xs text-gray-500">Open</p>
              <p className="text-xl font-bold text-amber-700">{metrics.bugs_open}</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border">
              <p className="text-xs text-gray-500">Resolved</p>
              <p className="text-xl font-bold text-green-700">{metrics.bugs_resolved}</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border">
              <p className="text-xs text-gray-500">Overdue</p>
              <p className="text-xl font-bold text-red-700">{metrics.bugs_overdue}</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border">
              <p className="text-xs text-gray-500">Unassigned</p>
              <p className="text-xl font-bold">{metrics.bugs_unassigned}</p>
            </div>
          </div>
        )}

        {metrics && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border p-4">
            <h2 className="text-lg font-semibold mb-2">Top Assignees (Open Bugs)</h2>
            {metrics.top_assignees.length === 0 ? (
              <p className="text-sm text-gray-500">No assigned open bugs.</p>
            ) : (
              <ul className="text-sm space-y-1">
                {metrics.top_assignees.map((row) => (
                  <li key={row.username} className="flex items-center justify-between border-b last:border-b-0 py-1">
                    <span className="font-mono">{row.username}</span>
                    <span>{row.bug_count} open bug{row.bug_count === 1 ? '' : 's'}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">ID</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">Username</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">Name</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">Email</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">Created</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">Last login</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">Role</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">Assigned bugs</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-2">{u.id}</td>
                  <td className="px-4 py-2 font-mono">
                    {editingId === u.id ? (
                      <input
                        type="text"
                        value={editValues.username}
                        onChange={(e) => setEditValues(v => ({ ...v, username: e.target.value }))}
                        className="px-2 py-1 border rounded text-xs w-32"
                      />
                    ) : (
                      u.username
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editingId === u.id ? (
                      <input
                        type="text"
                        value={editValues.full_name}
                        onChange={(e) => setEditValues(v => ({ ...v, full_name: e.target.value }))}
                        className="px-2 py-1 border rounded text-xs w-40"
                      />
                    ) : (
                      u.full_name
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editingId === u.id ? (
                      <input
                        type="email"
                        value={editValues.email}
                        onChange={(e) => setEditValues(v => ({ ...v, email: e.target.value }))}
                        className="px-2 py-1 border rounded text-xs w-56"
                      />
                    ) : (
                      u.email
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">
                    {new Date(u.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={u.role}
                      onChange={(e) => handleSetRole(u, e.target.value as 'admin' | 'developer')}
                      className="px-2 py-1 border rounded text-xs"
                      disabled={u.username === currentUser}
                    >
                      <option value="developer">Developer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      className="text-xs font-semibold text-blue-700 hover:underline"
                      onClick={() => openUserBugs(u)}
                    >
                      {u.assigned_count} bug{u.assigned_count === 1 ? '' : 's'}
                    </button>
                  </td>
                  <td className="px-4 py-2 min-w-[180px]">
                    {editingId === u.id ? (
                      <div className="flex flex-col gap-2">
                        <button
                          className="px-3 py-1 rounded-md text-xs font-semibold bg-green-600 text-white hover:bg-green-700 w-full"
                          onClick={() => saveEdit(u)}
                        >
                          Save
                        </button>
                        <button
                          className="px-3 py-1 rounded-md text-xs font-semibold bg-gray-300 text-gray-800 hover:bg-gray-400 w-full"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <button
                          className="px-3 py-1 rounded-md text-xs font-semibold bg-slate-600 text-white hover:bg-slate-700 w-full"
                          onClick={() => startEdit(u)}
                        >
                          Edit
                        </button>
                        <button
                          className="px-3 py-1 rounded-md text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 w-full"
                          onClick={() => openResetModal(u)}
                        >
                          Reset Password
                        </button>
                        <button
                          className="px-3 py-1 rounded-md text-xs font-semibold bg-red-600 text-white hover:bg-red-700 w-full"
                          onClick={() => handleDeleteUser(u)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-4 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
            <h2 className="font-semibold">Audit Log</h2>
            <button
              className="px-3 py-1 rounded-md text-xs font-semibold bg-slate-600 text-white hover:bg-slate-700"
              onClick={async () => {
                try {
                  const res = await api.adminAuditLog(100);
                  if (res.success) setAuditLogs(res.logs);
                } catch {
                  // keep old data on refresh failure
                }
              }}
            >
              Refresh
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {auditLogs.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">No audit events yet.</p>
            ) : (
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Time</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Actor</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Action</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Target</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="border-t align-top">
                      <td className="px-3 py-2 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="px-3 py-2 font-mono">{log.actor_username}</td>
                      <td className="px-3 py-2">{log.action}</td>
                      <td className="px-3 py-2">
                        {log.target_type}
                        {log.target_id ? `:${log.target_id}` : ''}
                      </td>
                      <td className="px-3 py-2 max-w-[420px] break-words text-gray-700">{log.details || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      {resetTargetUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h2 className="font-semibold text-lg">Reset Password</h2>
              <button onClick={closeResetModal} className="text-sm text-gray-600 hover:text-gray-900">
                Close
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-700">
                Set a temporary password for <span className="font-semibold">{resetTargetUser.username}</span>.
              </p>
              <input
                type="text"
                value={resetPasswordInput}
                onChange={(e) => setResetPasswordInput(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="Enter temporary password"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-md text-xs font-semibold bg-gray-300 text-gray-800 hover:bg-gray-400"
                  onClick={closeResetModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
                  onClick={handleResetPassword}
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedUserForBugs && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h2 className="font-semibold text-lg">
                Bugs assigned to {selectedUserForBugs.username} ({selectedUserBugs.length})
              </h2>
              <button
                onClick={closeUserBugs}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Close
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Reassign all bugs to:</span>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={reassignTargetId}
                  onChange={(e) =>
                    setReassignTargetId(
                      e.target.value === '' ? '' : e.target.value === 'unassign' ? 'unassign' : Number(e.target.value),
                    )
                  }
                >
                  <option value="">Select user…</option>
                  <option value="unassign">Unassign (no owner)</option>
                  {users
                    .filter(u => u.id !== selectedUserForBugs.id)
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.username}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  className="px-3 py-1 rounded-md text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
                  onClick={handleReassignAll}
                  disabled={loadingBugs || selectedUserBugs.length === 0}
                >
                  Reassign all
                </button>
              </div>
              <div className="border rounded-lg max-h-[50vh] overflow-y-auto">
                {loadingBugs ? (
                  <p className="p-4 text-sm text-gray-500">Loading bugs…</p>
                ) : selectedUserBugs.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500">No bugs currently assigned.</p>
                ) : (
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">ID</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Bug ID</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Title</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Priority</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Created</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUserBugs.map(b => (
                        <tr key={b.id} className="border-t">
                          <td className="px-3 py-2">{b.id}</td>
                          <td className="px-3 py-2 font-mono">{b.bugNumber || `Bug-${b.id}`}</td>
                          <td className="px-3 py-2">{b.title}</td>
                          <td className="px-3 py-2">{b.status}</td>
                          <td className="px-3 py-2">{b.priority}</td>
                          <td className="px-3 py-2">{new Date(b.created_at).toLocaleString()}</td>
                          <td className="px-3 py-2">
                            {b.due_date ? new Date(b.due_date).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

