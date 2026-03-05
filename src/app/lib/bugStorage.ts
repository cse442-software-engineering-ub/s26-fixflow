import { Bug } from '../types';

const STORAGE_KEY = 'bug_tracker_bugs';
const DELETED_STORAGE_KEY = 'bug_tracker_deleted_bugs';

export const bugStorage = {
  getAll: (): Bug[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading bugs from storage:', error);
      return [];
    }
  },

  getAllDeleted: (): Bug[] => {
    try {
      const data = localStorage.getItem(DELETED_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading deleted bugs from storage:', error);
      return [];
    }
  },

  save: (bugs: Bug[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bugs));
    } catch (error) {
      console.error('Error saving bugs to storage:', error);
      throw error;
    }
  },

  saveDeleted: (bugs: Bug[]): void => {
    try {
      localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(bugs));
    } catch (error) {
      console.error('Error saving deleted bugs to storage:', error);
      throw error;
    }
  },

  add: (bug: Bug): Bug[] => {
    const bugs = bugStorage.getAll();
    const newBugs = [...bugs, bug];
    bugStorage.save(newBugs);
    return newBugs;
  },

  update: (id: string, updates: Partial<Bug>): Bug[] => {
    const bugs = bugStorage.getAll();
    const newBugs = bugs.map(bug => 
      bug.id === id ? { ...bug, ...updates } : bug
    );
    bugStorage.save(newBugs);
    return newBugs;
  },

  delete: (id: string): Bug[] => {
    const bugs = bugStorage.getAll();
    const deletedBugs = bugStorage.getAllDeleted();
    
    // Find the bug to delete
    const bugToDelete = bugs.find(bug => bug.id === id);
    
    if (bugToDelete) {
      // Add deleted timestamp
      const deletedBug = {
        ...bugToDelete,
        deletedAt: new Date().toISOString()
      };
      
      // Add to deleted bugs
      const newDeletedBugs = [...deletedBugs, deletedBug];
      bugStorage.saveDeleted(newDeletedBugs);
    }
    
    // Remove from active bugs
    const newBugs = bugs.filter(bug => bug.id !== id);
    bugStorage.save(newBugs);
    return newBugs;
  },

  deleteWithReason: (id: string, reason: string): Bug[] => {
    const bugs = bugStorage.getAll();
    const deletedBugs = bugStorage.getAllDeleted();
    
    // Find the bug to delete
    const bugToDelete = bugs.find(bug => bug.id === id);
    
    if (bugToDelete) {
      // Add deleted timestamp and reason
      const deletedBug = {
        ...bugToDelete,
        deletedAt: new Date().toISOString(),
        deletionReason: reason
      };
      
      // Add to deleted bugs
      const newDeletedBugs = [...deletedBugs, deletedBug];
      bugStorage.saveDeleted(newDeletedBugs);
    }
    
    // Remove from active bugs
    const newBugs = bugs.filter(bug => bug.id !== id);
    bugStorage.save(newBugs);
    return newBugs;
  },

  deleteWithReasonAndUser: (id: string, reason: string, deletedBy: string): Bug[] => {
    const bugs = bugStorage.getAll();
    const deletedBugs = bugStorage.getAllDeleted();
    
    // Find the bug to delete
    const bugToDelete = bugs.find(bug => bug.id === id);
    
    if (bugToDelete) {
      // Add deleted timestamp, reason, and user
      const deletedBug = {
        ...bugToDelete,
        deletedAt: new Date().toISOString(),
        deletionReason: reason,
        deletedBy: deletedBy
      };
      
      // Add to deleted bugs
      const newDeletedBugs = [...deletedBugs, deletedBug];
      bugStorage.saveDeleted(newDeletedBugs);
    }
    
    // Remove from active bugs
    const newBugs = bugs.filter(bug => bug.id !== id);
    bugStorage.save(newBugs);
    return newBugs;
  },

  restore: (id: string): { activeBugs: Bug[], deletedBugs: Bug[] } => {
    const bugs = bugStorage.getAll();
    const deletedBugs = bugStorage.getAllDeleted();
    
    // Find the bug to restore
    const bugToRestore = deletedBugs.find(bug => bug.id === id);
    
    if (bugToRestore) {
      // Remove deletedAt timestamp, deletionReason, and deletedBy
      const { deletedAt, deletionReason, deletedBy, ...restoredBug } = bugToRestore as any;
      
      // Add back to active bugs
      const newBugs = [...bugs, restoredBug];
      bugStorage.save(newBugs);
      
      // Remove from deleted bugs
      const newDeletedBugs = deletedBugs.filter(bug => bug.id !== id);
      bugStorage.saveDeleted(newDeletedBugs);
      
      return { activeBugs: newBugs, deletedBugs: newDeletedBugs };
    }
    
    return { activeBugs: bugs, deletedBugs };
  },

  permanentlyDelete: (id: string): Bug[] => {
    const deletedBugs = bugStorage.getAllDeleted();
    const newDeletedBugs = deletedBugs.filter(bug => bug.id !== id);
    bugStorage.saveDeleted(newDeletedBugs);
    return newDeletedBugs;
  }
};