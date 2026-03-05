import { useOutletContext } from 'react-router';
import { BugCard } from '../components/BugCard';
import { Bug } from '../types';
import { Calendar } from 'lucide-react';

interface OutletContext {
  bugs: Bug[];
  onToggleStatus: (id: string) => void;
  onEdit: (bug: Bug) => void;
  onDelete: (id: string) => void;
  onBugClick: (bug: Bug) => void;
}

export function UpcomingBugs() {
  const { bugs, onToggleStatus, onEdit, onDelete, onBugClick } = useOutletContext<OutletContext>();

  const today = new Date();
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(today.getDate() + 7);

  const upcomingBugs = bugs
    .filter(bug => {
      if (bug.status !== 'active') return false;
      const dueDate = new Date(bug.dueDate);
      return dueDate >= today && dueDate <= sevenDaysFromNow;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 bg-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
          <h2 className="text-3xl sm:text-4xl font-bold mb-2">Upcoming Bugs</h2>
          <p className="text-slate-300 text-base sm:text-lg">
            {upcomingBugs.length} {upcomingBugs.length === 1 ? 'bug' : 'bugs'} due in the next 7 days
          </p>
        </div>

        {upcomingBugs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-md">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming deadlines</h3>
            <p className="text-gray-600">No bugs are due in the next 7 days</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {upcomingBugs.map((bug) => (
              <BugCard
                key={bug.id}
                bug={bug}
                onToggleStatus={onToggleStatus}
                onEdit={onEdit}
                onDelete={onDelete}
                onClick={onBugClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}