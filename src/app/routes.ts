import { createBrowserRouter } from 'react-router';
import { Dashboard } from './pages/Dashboard';
import { Home } from './pages/Home';
import { AllBugs } from './pages/AllBugs';
import { ActiveBugs } from './pages/ActiveBugs';
import { FixedBugs } from './pages/FixedBugs';
import { UpcomingBugs } from './pages/UpcomingBugs';
import { OverdueBugs } from './pages/OverdueBugs';
import { AssignedBugs } from './pages/AssignedBugs';
import { BugHistory } from './pages/BugHistory';
import { BrowseAllBugs } from './pages/BrowseAllBugs';
import { DeletedBugs } from './pages/DeletedBugs';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Dashboard,
    children: [
      { index: true, Component: Home },
      { path: 'all', Component: AllBugs },
      { path: 'active', Component: ActiveBugs },
      { path: 'fixed', Component: FixedBugs },
      { path: 'upcoming', Component: UpcomingBugs },
      { path: 'overdue', Component: OverdueBugs },
      { path: 'assigned', Component: AssignedBugs },
      { path: 'history', Component: BugHistory },
      { path: 'browse', Component: BrowseAllBugs },
      { path: 'deleted', Component: DeletedBugs },
    ],
  },
]);