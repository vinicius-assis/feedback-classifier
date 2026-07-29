import { Route, Routes, Navigate } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { FeedbackDetailPage } from './pages/FeedbackDetailPage';
import { IngestBulkPage } from './pages/IngestBulkPage';
import { IngestFilePage } from './pages/IngestFilePage';
import { IngestPage } from './pages/IngestPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/ingest" element={<IngestPage />} />
        <Route path="/ingest/bulk" element={<IngestBulkPage />} />
        <Route path="/ingest/file" element={<IngestFilePage />} />
        <Route path="/integrations" element={<IntegrationsPage />} />
        <Route path="/feedback/:id" element={<FeedbackDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
