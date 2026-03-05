import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface UserSelectWithSearchProps {
  users: string[];
  value: string;
  onChange: (value: string) => void;
  allOptionValue: string;
  allOptionLabel: string;
}

export function UserSelectWithSearch({
  users,
  value,
  onChange,
  allOptionValue,
  allOptionLabel,
}: UserSelectWithSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.toLowerCase().includes(q));
  }, [query, users]);

  const selectedLabel =
    value === allOptionValue ? allOptionLabel : value || allOptionLabel;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent flex items-center justify-between"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute z-40 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent"
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                onChange(allOptionValue);
                setIsOpen(false);
                setQuery('');
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              {allOptionLabel}
            </button>

            {filteredUsers.map((user) => (
              <button
                key={user}
                type="button"
                onClick={() => {
                  onChange(user);
                  setIsOpen(false);
                  setQuery('');
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
              >
                {user}
              </button>
            ))}

            {filteredUsers.length === 0 && (
              <p className="px-4 py-3 text-sm text-gray-500">No users found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
