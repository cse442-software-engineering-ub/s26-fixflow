import { useOutletContext } from 'react-router';
import { BugCard } from '../components/BugCard';
import { Bug } from '../types';
import { UserCheck } from 'lucide-react';

interface OutletContext {
  bugs: Bug[];
  currentUser: string;
  sessionDisplayName: string;
  onToggleStatus: (id: string) => void;
  onEdit: (bug: Bug) => void;
  onDelete: (id: string) => void;
  onBugClick: (bug: Bug) => void;
}

export function AssignedBugs() {
  const { bugs, currentUser, sessionDisplayName, onToggleStatus, onEdit, onDelete, onBugClick } =
    useOutletContext<OutletContext>();

  const assignedBugs = bugs
    .filter(bug => bug.assignedTo === currentUser)
    .sort((a, b) => {
      // Active bugs first
      if (a.status !== b.status) {
        return a.status === 'active' ? -1 : 1;
      }
      // Then by due date
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  const activeBugs = assignedBugs.filter(b => b.status === 'active');
  const fixedBugs = assignedBugs.filter(b => b.status === 'fixed');

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 bg-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
          <h2 className="text-3xl sm:text-4xl font-bold mb-2">Assigned to You</h2>
          <p className="text-slate-300 text-base sm:text-lg">
            {assignedBugs.length} {assignedBugs.length === 1 ? 'bug' : 'bugs'} assigned to {sessionDisplayName}
          </p>
        </div>

        {assignedBugs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-md">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <UserCheck className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bugs assigned</h3>
            <p className="text-gray-600">You don't have any bugs assigned to you</p>
          </div>
        ) : (
          <div className="space-y-8">
            {activeBugs.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Active ({activeBugs.length})
                </h3>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                  {activeBugs.map((bug) => (
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
              </div>
            )}

            {fixedBugs.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Fixed ({fixedBugs.length})
                </h3>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                  {fixedBugs.map((bug) => (
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}