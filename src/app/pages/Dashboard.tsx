import { useState, useEffect } from 'react';
import { Outlet } from 'react-router';
import { toast } from 'sonner';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { BugForm } from '../components/BugForm';
import { BugDetailModal } from '../components/BugDetailModal';
import { AccountModal } from '../components/AccountModal';
import { MarkAsFixedModal } from '../components/MarkAsFixedModal';
import { DeleteBugModal } from '../components/DeleteBugModal';
import { Bug, FixDetails } from '../types';
import { api } from '../lib/api';
import { activityLogger } from '../lib/activity';

interface DashboardProps {
  currentUser: string;
  currentRole?: 'admin' | 'developer';
  onLogout: () => void;
  onUserUpdate?: (newUsername: string) => void;
}

export function Dashboard({ currentUser, currentRole = 'developer', onLogout, onUserUpdate }: DashboardProps) {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [deletedBugs, setDeletedBugs] = useState<Bug[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBug, setEditingBug] = useState<Bug | null>(null);
  const [selectedBug, setSelectedBug] = useState<Bug | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [bugToMarkAsFixed, setBugToMarkAsFixed] = useState<Bug | null>(null);
  const [bugToDelete, setBugToDelete] = useState<Bug | null>(null);
  const [assignableUsers, setAssignableUsers] = useState<{ id: number; username: string; email: string }[]>([]);

  async function refreshBugs() {
    try {
      const res = await api.listBugs({ sort: 'newest' });
      if (res.success) {
        setBugs((prev) => {
          const prevById = new Map(prev.map((p) => [String(p.id), p]));
          return res.bugs.map((b: any) => {
            const existing = prevById.get(String(b.id));
            return {
              id: b.id,
              bugNumber: b.bugNumber || existing?.bugNumber || `Bug-${b.id}`,
              title: b.title,
              // Backend may not persist these fields yet; keep prior values if missing.
              code: b.code || existing?.code || '',
              priority: b.priority,
              dueDate: b.due_date,
              description: b.description || existing?.description || '',
              status: b.status === 'Resolved' || b.status === 'Closed' ? 'fixed' : 'active',
              createdAt: b.created_at,
              fixedAt: b.fixedAt || b.fixed_at || existing?.fixedAt || undefined,
              fixDetails: b.fixDetails || existing?.fixDetails || undefined,
              assignedTo: b.assignedTo || undefined,
            } as Bug;
          });
        });
      }
    } catch {
      // ignore for manual refresh as well
    }
  }

  async function refreshDeletedBugs() {
    try {
      const res = await api.listDeletedBugs('newest');
      if (res.success) {
        setDeletedBugs(
          res.bugs.map((b: any) => ({
            id: b.id,
            bugNumber: b.bugNumber || `Bug-${b.id}`,
            title: b.title,
            code: b.code || '',
            priority: b.priority,
            dueDate: b.due_date,
            description: b.description || '',
            status: b.status === 'Resolved' || b.status === 'Closed' ? 'fixed' : 'active',
            createdAt: b.created_at,
            fixedAt: b.fixedAt || undefined,
            fixDetails: b.fixDetails,
            assignedTo: b.assignedTo,
            deletedAt: b.deleted_at,
            deletedBy: b.deletedBy,
            deletionReason: b.deletion_reason,
          } as Bug & { deletedAt?: string; deletedBy?: string; deletionReason?: string }))
        );
      }
    } catch {
      // ignore
    }
  }

  // Load bugs from backend and keep them in sync with short polling
  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      if (cancelled) return;
      await refreshBugs();
      await refreshDeletedBugs();
    };

    fetchAll();
    const interval = setInterval(fetchAll, 5000); // poll every 5s

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.listUsersBasic();
        if (cancelled) return;
        if (res.success) {
          setAssignableUsers(res.users);
        }
      } catch {
        // ignore; dropdown can be empty
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pickRandomAssigneeByWorkload = (): string | undefined => {
    if (assignableUsers.length === 0) return undefined;
    const activeCountByUser: Record<string, number> = {};
    for (const u of assignableUsers) activeCountByUser[u.username] = 0;
    for (const b of bugs) {
      if (b.status === 'active' && b.assignedTo) {
        activeCountByUser[b.assignedTo] = (activeCountByUser[b.assignedTo] ?? 0) + 1;
      }
    }
    let minCount = Infinity;
    const candidates: string[] = [];
    for (const u of assignableUsers) {
      const c = activeCountByUser[u.username] ?? 0;
      if (c < minCount) {
        minCount = c;
        candidates.length = 0;
        candidates.push(u.username);
      } else if (c === minCount) candidates.push(u.username);
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
  };

  const handleAddBug = async (bugData: Omit<Bug, 'id' | 'createdAt'>) => {
    try {
      let assignedTo =
        bugData.assignedTo === '__random__' ? pickRandomAssigneeByWorkload() : bugData.assignedTo;

      const res = await api.createBug({
        title: bugData.title,
        code: bugData.code,
        priority: bugData.priority,
        dueDate: bugData.dueDate,
        description: bugData.description,
        status: bugData.status,
        assignedTo: assignedTo || null,
      });

      if (!res.success) {
        toast.error('Failed to create bug');
        return;
      }

      const b = res.bug;
      const newBug: Bug = {
        id: b.id,
        bugNumber: b.bugNumber || `Bug-${b.id}`,
        title: b.title,
        code: b.code ?? bugData.code,
        priority: b.priority,
        dueDate: b.due_date ?? bugData.dueDate,
        description: b.description ?? bugData.description,
        status: b.status === 'Resolved' || b.status === 'Closed' ? 'fixed' : 'active',
        createdAt: b.created_at,
        assignedTo: b.assignedTo || undefined,
      };

      setBugs((prev) => [newBug, ...prev]);
      setShowForm(false);
      toast.success('Bug added successfully!');

      activityLogger.logActivity({
        type: 'created',
        bugNumber: newBug.bugNumber,
        bugTitle: newBug.title,
        user: currentUser,
      });
    } catch {
      toast.error('Failed to save. Please try again.');
    }
  };

  const handleUpdateBug = async (bugData: Omit<Bug, 'id' | 'createdAt'>) => {
    if (!editingBug) return;
    try {
      const res = await api.updateBug({
        id: Number(editingBug.id),
        title: bugData.title,
        code: bugData.code,
        priority: bugData.priority,
        dueDate: bugData.dueDate,
        description: bugData.description,
        status: bugData.status,
        assignedTo: bugData.assignedTo || null,
      });

      if (!res.success) {
        toast.error('Failed to update bug');
        return;
      }

      const updated = res.bug;
      setBugs((prev) =>
        prev.map((b) =>
          b.id === editingBug.id
            ? {
                id: updated.id,
                bugNumber: updated.bugNumber || b.bugNumber || `Bug-${updated.id}`,
                title: updated.title,
                code: updated.code,
                priority: updated.priority,
                dueDate: updated.due_date,
                description: updated.description,
                status:
                  updated.status === 'Resolved' || updated.status === 'Closed'
                    ? 'fixed'
                    : 'active',
                createdAt: updated.created_at,
                fixedAt: updated.fixedAt || updated.fixed_at || undefined,
                fixDetails: updated.fixDetails || undefined,
                assignedTo: updated.assignedTo || undefined,
              }
            : b
        )
      );

      setEditingBug(null);
      toast.success('Bug updated successfully!');
      activityLogger.logActivity({
        type: 'edited',
        bugNumber: editingBug.bugNumber || `Bug-${editingBug.id}`,
        bugTitle: editingBug.title,
        user: currentUser,
      });
    } catch {
      toast.error('Failed to save. Please try again.');
    }
  };

  const handleToggleStatus = (id: string) => {
    const bug = bugs.find(b => b.id === id);
    if (!bug) return;
    
    // If marking as fixed, show the modal first
    if (bug.status === 'active') {
      setBugToMarkAsFixed(bug);
      return;
    }
    
    // If unmarking (fixed -> active), just toggle
    const updates: Partial<Bug> = {
      status: 'active',
      fixedAt: undefined,
      fixDetails: undefined,
    };

    setBugs((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
    api
      .updateBug({
        id: Number(id),
        status: 'active',
      })
      .catch(() => {
        // revert on failure
        setBugs((prev) => prev.map((b) => (b.id === id ? bug : b)));
        toast.error('Failed to update status.');
      });
    toast.success('Bug marked as active!');
  };

  const handleMarkAsFixed = (fixDetails: Omit<FixDetails, 'fixedBy' | 'fixedAt'>) => {
    if (!bugToMarkAsFixed) return;
    try {
      const completeFixDetails: FixDetails = {
        ...fixDetails,
        fixedBy: currentUser,
        fixedAt: new Date().toISOString(),
      };
      const updates: Partial<Bug> = {
        status: 'fixed',
        fixedAt: new Date().toISOString(),
        fixDetails: completeFixDetails,
      };
      setBugs((prev) =>
        prev.map((b) =>
          b.id === bugToMarkAsFixed.id ? { ...b, ...updates } : b
        )
      );
      api
        .updateBug({
          id: Number(bugToMarkAsFixed.id),
          status: 'fixed',
          fixDetails: completeFixDetails,
        })
        .catch(() => {
          toast.error('Failed to update status.');
        });
      setBugToMarkAsFixed(null);
      toast.success('Bug marked as fixed with details!');
      activityLogger.logActivity({
        type: 'fixed',
        bugNumber: bugToMarkAsFixed.bugNumber,
        bugTitle: bugToMarkAsFixed.title,
        user: currentUser,
      });
    } catch {
      toast.error('Failed to save. Please try again (e.g. check storage or try again later).');
    }
  };

  const handleDeleteBug = (id: string) => {
    const bug = bugs.find(b => b.id === id);
    if (!bug) return;
    
    // Show the delete modal instead of using confirm/prompt
    setBugToDelete(bug);
  };

  const handleConfirmDelete = (reason: string) => {
    if (!bugToDelete) return;
    const bug = bugToDelete;
    setBugToDelete(null);
    api
      .deleteBug(Number(bug.id), reason)
      .then(() => {
        setBugs((prev) => prev.filter((b) => b.id !== bug.id));
        refreshDeletedBugs();
        toast.success('Bug deleted successfully!');
        activityLogger.logActivity({
          type: 'deleted',
          bugNumber: bug.bugNumber,
          bugTitle: bug.title,
          user: currentUser,
        });
      })
      .catch(() => {
        setBugToDelete(bug);
        toast.error('Failed to delete bug.');
      });
  };

  const handleRestoreBug = (id: string) => {
    api
      .restoreBug(Number(id))
      .then(() => {
        refreshBugs();
        refreshDeletedBugs();
        toast.success('Bug restored successfully!');
      })
      .catch(() => {
        toast.error('Failed to restore bug.');
      });
  };

  const handlePermanentlyDelete = (id: string) => {
    api
      .permanentDeleteBug(Number(id))
      .then(() => {
        setDeletedBugs((prev) => prev.filter((b) => String(b.id) !== String(id)));
        toast.success('Bug permanently deleted.');
      })
      .catch(() => {
        toast.error('Failed to permanently delete bug.');
      });
  };

  const handleEditBug = (bug: Bug) => {
    setEditingBug(bug);
  };

  const handleBugClick = (bug: Bug) => {
    setSelectedBug(bug);
  };

  const stats = {
    overdue: bugs.filter(b => {
      if (b.status !== 'active') return false;
      return new Date(b.dueDate) < new Date();
    }).length,
    assigned: bugs.filter(b => b.assignedTo === currentUser).length,
    total: bugs.length,
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar 
        onAddBug={() => setShowForm(true)} 
        currentUser={currentUser}
        isAdmin={currentRole === 'admin'}
        onLogout={onLogout}
        onOpenAccount={() => setShowAccountModal(true)}
        bugs={bugs}
        onBugSelect={handleBugClick}
        onRefreshBugs={refreshBugs}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <Outlet context={{ 
            bugs,
            deletedBugs,
            currentUser,
            allUsers: assignableUsers.map((u) => u.username),
            onToggleStatus: handleToggleStatus, 
            onEdit: handleEditBug, 
            onDelete: handleDeleteBug,
            onBugClick: handleBugClick,
            onBugSelect: handleBugClick,
            onRestore: handleRestoreBug,
            onPermanentlyDelete: handlePermanentlyDelete
          }} />
        </div>
        {/* Sidebar - desktop only, stays fixed */}
        <div className="hidden lg:block overflow-y-auto">
          <Sidebar onAddBug={() => setShowForm(true)} stats={stats} />
        </div>
      </div>
      
      {showForm && (
        <BugForm
          onSubmit={handleAddBug}
          onCancel={() => setShowForm(false)}
          allUsers={assignableUsers}
        />
      )}
      
      {editingBug && (
        <BugForm
          onSubmit={handleUpdateBug}
          onCancel={() => setEditingBug(null)}
          initialData={editingBug}
          allUsers={assignableUsers}
        />
      )}

      {selectedBug && (
        <BugDetailModal
          bug={selectedBug}
          onClose={() => setSelectedBug(null)}
          onEdit={handleEditBug}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeleteBug}
        />
      )}

      {showAccountModal && (
        <AccountModal
          isOpen={showAccountModal}
          onClose={() => setShowAccountModal(false)}
          currentUser={currentUser}
          onUserUpdate={onUserUpdate}
          bugs={bugs}
          onBugSelect={handleBugClick}
        />
      )}

      {bugToMarkAsFixed && (
        <MarkAsFixedModal
          bug={bugToMarkAsFixed}
          onSubmit={handleMarkAsFixed}
          onCancel={() => setBugToMarkAsFixed(null)}
        />
      )}

      {bugToDelete && (
        <DeleteBugModal
          bug={bugToDelete}
          onSubmit={handleConfirmDelete}
          onCancel={() => setBugToDelete(null)}
        />
      )}
    </div>
  );
}