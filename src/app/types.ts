export type Priority = 'high' | 'medium' | 'low';
export type BugStatus = 'active' | 'fixed';

export interface FixDetails {
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
}

export interface Bug {
  id: string | number;
  title: string;
  code: string;
  priority: Priority;
  dueDate: string;
  description: string;
  status: BugStatus;
  createdAt: string;
  fixedAt?: string;
  assignedTo?: string;
  bugNumber?: string;
  fixDetails?: FixDetails;
}