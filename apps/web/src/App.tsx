import { lazy } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { AppShell } from './components/AppShell';

/**
 * One chunk per route. It matters mostly for the dashboard: recharts and
 * @chakra-ui/charts are the bulk of the bundle and were being downloaded even
 * by someone who only ever opens /ingest.
 */
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const FeedbackDetailPage = lazy(() =>
  import('./pages/FeedbackDetailPage').then((m) => ({ default: m.FeedbackDetailPage })),
);
const IngestPage = lazy(() =>
  import('./pages/IngestPage').then((m) => ({ default: m.IngestPage })),
);
const IngestBulkPage = lazy(() =>
  import('./pages/IngestBulkPage').then((m) => ({ default: m.IngestBulkPage })),
);
const IngestFilePage = lazy(() =>
  import('./pages/IngestFilePage').then((m) => ({ default: m.IngestFilePage })),
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/ingest" element={<IngestPage />} />
        <Route path="/ingest/bulk" element={<IngestBulkPage />} />
        <Route path="/ingest/file" element={<IngestFilePage />} />
        <Route path="/feedback/:id" element={<FeedbackDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
