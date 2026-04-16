import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../lib/api';
import { Bug, Priority } from '../types';
import { toast } from 'sonner';

interface BugFormProps {
  onSubmit: (bug: Omit<Bug, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  initialData?: Bug;
  allUsers: { id: number; username: string; email: string }[];
}

export function BugForm({ onSubmit, onCancel, initialData, allUsers }: BugFormProps) {
  const TITLE_MAX_LENGTH = 80;
  const CODE_MAX_LENGTH = 300;
  const DESCRIPTION_MAX_LENGTH = 1000;
  const AI_NOTE_HEADER = '[AI Triage Note]';

  const stripAiTriageNote = (text: string): string => {
    const markerIndex = text.indexOf(`\n---\n${AI_NOTE_HEADER}\n`);
    if (markerIndex === -1) return text;
    return text.slice(0, markerIndex).trimEnd();
  };

  const upsertAiTriageNote = (description: string, aiNote: string): string => {
    const base = stripAiTriageNote(description).trimEnd();
    const note = aiNote.trim();
    if (!note) return base;
    if (!base) {
      return `${AI_NOTE_HEADER}\n${note}`;
    }
    return `${base}\n---\n${AI_NOTE_HEADER}\n${note}`;
  };

  const clampToMaxLength = (text: string, maxLength: number): string =>
    text.length > maxLength ? text.slice(0, maxLength) : text;

  const hasEmoji = (text: string): boolean => /\p{Extended_Pictographic}/u.test(text);

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
  const [titleError, setTitleError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [aiError, setAiError] = useState('');
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);

  const filteredUsers = allUsers.filter((user) => {
    const q = assigneeSearch.trim().toLowerCase();
    if (!q) return true;
    return user.username.toLowerCase().includes(q) || user.email.toLowerCase().includes(q);
  });

  useEffect(() => {
    setTitleError('');
    setCodeError('');
    setDescriptionError('');
  }, [initialData?.id]);

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
    const trimmedTitle = formData.title.trim();
    const trimmedCode = formData.code.trim();
    const trimmedDescription = formData.description.trim();

    if (hasEmoji(trimmedTitle) || hasEmoji(trimmedCode) || hasEmoji(trimmedDescription)) {
      if (hasEmoji(trimmedTitle)) setTitleError('No emojis permitted');
      if (hasEmoji(trimmedCode)) setCodeError('No emojis permitted');
      if (hasEmoji(trimmedDescription)) setDescriptionError('No emojis permitted');
      toast.error('No emojis permitted');
      return;
    }

    if (!trimmedTitle) {
      setTitleError('Title is required');
      return;
    }
    if (!trimmedCode) {
      setCodeError('Code/Reference is required');
      return;
    }
    if (!trimmedDescription) {
      setDescriptionError('Description is required');
      return;
    }
    setTitleError('');
    setCodeError('');
    setDescriptionError('');
    onSubmit({
      ...formData,
      title: trimmedTitle,
      code: trimmedCode,
      description: trimmedDescription,
    });
  };

  const handleSuggestPriority = async () => {
    setAiError('');

    const title = formData.title.trim();
    const description = formData.description.trim();
    const code = formData.code.trim();
    if (!title || !description) {
      setAiError('Add a title and description before suggesting priority.');
      return;
    }

    setAiSuggesting(true);
    try {
      const res = await api.suggestPriority({ title, description, code });
      if (res.success) {
        let truncatedByLimit = false;
        setFormData((prev) => ({
          ...prev,
          priority: res.priority as Priority,
          description: (() => {
            const withAiNote = upsertAiTriageNote(prev.description, res.explanation);
            const clamped = clampToMaxLength(withAiNote, DESCRIPTION_MAX_LENGTH);
            truncatedByLimit = clamped.length !== withAiNote.length;
            return clamped;
          })(),
        }));
        if (truncatedByLimit) {
          setAiError(`AI note was trimmed to stay within ${DESCRIPTION_MAX_LENGTH} characters.`);
        }
      } else {
        // Never block the form; keep the user's current priority.
        setAiError('Failed to suggest priority.');
      }
    } catch {
      setAiError('Failed to suggest priority. You can still submit normally.');
    } finally {
      setAiSuggesting(false);
    }
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
              onChange={(e) => {
                setTitleError('');
                setFormData({ ...formData, title: e.target.value });
              }}
              maxLength={TITLE_MAX_LENGTH}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                titleError ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Login button not responding"
            />
            {titleError ? <p className="text-sm text-red-600 mt-1">{titleError}</p> : null}
            <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
              <span>Max {TITLE_MAX_LENGTH} characters</span>
              <span>{formData.title.length}/{TITLE_MAX_LENGTH}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code/Reference *
            </label>
            <textarea
              required
              value={formData.code}
              onChange={(e) => {
                setCodeError('');
                setFormData({ ...formData, code: e.target.value });
              }}
              maxLength={CODE_MAX_LENGTH}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm ${
                codeError ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., src/components/Auth/LoginButton.tsx:42"
              rows={3}
            />
            {codeError ? <p className="text-sm text-red-600 mt-1">{codeError}</p> : null}
            <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
              <span>Max {CODE_MAX_LENGTH} characters</span>
              <span>{formData.code.length}/{CODE_MAX_LENGTH}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Priority *
                </label>
                {!initialData && (
                  <button
                    type="button"
                    disabled={
                      aiSuggesting ||
                      !formData.title.trim() ||
                      !formData.description.trim()
                    }
                    onClick={handleSuggestPriority}
                    className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-xs font-medium"
                  >
                    {aiSuggesting ? 'Suggesting...' : 'Suggest Priority'}
                  </button>
                )}
              </div>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              {!initialData && (
                <div className="mt-2 space-y-2">
                  {aiError ? <p className="text-sm text-red-600">{aiError}</p> : null}
                </div>
              )}
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
              onChange={(e) => {
                setDescriptionError('');
                setFormData({ ...formData, description: e.target.value });
              }}
              maxLength={DESCRIPTION_MAX_LENGTH}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                descriptionError ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe the bug and any relevant details..."
              rows={5}
            />
            {descriptionError ? <p className="text-sm text-red-600 mt-1">{descriptionError}</p> : null}
            <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
              <span>Max {DESCRIPTION_MAX_LENGTH} characters</span>
              <span>{formData.description.length}/{DESCRIPTION_MAX_LENGTH}</span>
            </div>
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