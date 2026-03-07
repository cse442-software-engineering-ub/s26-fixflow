import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Bug, Priority } from '../types';

interface BugFormProps {
  onSubmit: (bug: Omit<Bug, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  initialData?: Bug;
  allUsers: { id: number; username: string; email: string }[];
}

export function BugForm({ onSubmit, onCancel, initialData, allUsers }: BugFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    code: initialData?.code || '',
    priority: initialData?.priority || 'medium' as Priority,
    dueDate: initialData?.dueDate || '',
    description: initialData?.description || '',
    status: initialData?.status || 'active' as const,
    assignedTo: initialData?.assignedTo || '',
    bugNumber: initialData?.bugNumber || '',
  });
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);

  const filteredUsers = allUsers.filter((user) => {
    const q = assigneeSearch.trim().toLowerCase();
    if (!q) return true;
    return user.username.toLowerCase().includes(q) || user.email.toLowerCase().includes(q);
  });

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!assigneeDropdownRef.current) return;
      if (!assigneeDropdownRef.current.contains(event.target as Node)) {
        setAssigneeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const assigneeLabel =
    formData.assignedTo === ''
      ? 'Select User'
      : formData.assignedTo === '__random__'
      ? 'Random (assign by workload)'
      : formData.assignedTo;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-semibold">
            {initialData ? 'Edit Bug' : 'Add New Bug'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bug Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="e.g., Login button not responding"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code/Reference *
            </label>
            <textarea
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm"
              placeholder="e.g., src/components/Auth/LoginButton.tsx:42"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned To
              </label>
              <div ref={assigneeDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAssigneeDropdownOpen((v) => !v)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-left focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none flex items-center justify-between"
                >
                  <span className={formData.assignedTo ? 'text-gray-900' : 'text-gray-500'}>{assigneeLabel}</span>
                  <span className="text-gray-500 text-sm">▼</span>
                </button>

                {assigneeDropdownOpen && (
                  <div className="absolute z-50 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-gray-200">
                      <input
                        type="text"
                        value={assigneeSearch}
                        onChange={(e) => setAssigneeSearch(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Search users by username or email"
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      <button
                        type="button"
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={() => {
                          setFormData({ ...formData, assignedTo: '' });
                          setAssigneeDropdownOpen(false);
                        }}
                      >
                        Select User
                      </button>
                      <button
                        type="button"
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={() => {
                          setFormData({ ...formData, assignedTo: '__random__' });
                          setAssigneeDropdownOpen(false);
                        }}
                      >
                        Random (assign by workload)
                      </button>
                      {filteredUsers.map((user) => (
                        <button
                          key={user.username}
                          type="button"
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          onClick={() => {
                            setFormData({ ...formData, assignedTo: user.username });
                            setAssigneeDropdownOpen(false);
                          }}
                        >
                          {user.username} ({user.email})
                        </button>
                      ))}
                      {filteredUsers.length === 0 && (
                        <p className="px-4 py-3 text-sm text-gray-500">No users found</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bug Number
              </label>
              {formData.bugNumber ? (
                <p className="px-4 py-2 text-gray-700 text-sm border border-gray-200 rounded-lg bg-gray-50 font-medium">
                  {formData.bugNumber}
                </p>
              ) : (
                <p className="px-4 py-2 text-gray-500 text-sm border border-gray-200 rounded-lg bg-gray-50">
                  Auto-assigned when you save
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Describe the bug and any relevant details..."
              rows={5}
            />
          </div>

          {initialData && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="active"
                    checked={formData.status === 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'fixed' })}
                    className="w-4 h-4"
                  />
                  <span>Active</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="fixed"
                    checked={formData.status === 'fixed'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'fixed' })}
                    className="w-4 h-4"
                  />
                  <span>Fixed</span>
                </label>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {initialData ? 'Update Bug' : 'Add Bug'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}