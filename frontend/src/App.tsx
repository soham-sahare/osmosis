import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useThemeStore } from './store/themeStore';
import { ToastProvider } from './contexts/ToastContext';
import { Loader } from './components/common/Loader';

// Lazy load views for better initial performance
const LandingPage = lazy(() => import('./components/LandingPage/LandingPage').then(module => ({ default: module.LandingPage })));
const WorkspaceListView = lazy(() => import('./components/WorkspaceView/WorkspaceListView').then(module => ({ default: module.WorkspaceListView })));
const WorkspaceDetailView = lazy(() => import('./components/WorkspaceView/WorkspaceDetailView').then(module => ({ default: module.WorkspaceDetailView })));
const ExecutionDetailView = lazy(() => import('./components/Execution/ExecutionDetailView').then(module => ({ default: module.ExecutionDetailView })));
const CanvasView = lazy(() => import('./components/CanvasView/CanvasView').then(module => ({ default: module.CanvasView })));

function App() {
  const { theme } = useThemeStore();

  useEffect(() => {
    // Apply theme class to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Loading fallback
  const PageLoader = () => (
    <div className="h-screen flex items-center justify-center bg-vercel-light-bg dark:bg-vercel-dark-bg">
      <Loader size="lg" text="Loading..." />
    </div>
  );

  return (
    <ToastProvider>
      <BrowserRouter>
        <div className={`min-h-screen bg-vercel-light-bg dark:bg-vercel-dark-bg text-vercel-light-text dark:text-vercel-dark-text transition-colors duration-200`}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/workspaces" element={<WorkspaceListView />} />
              <Route path="/workspace/:workspaceId" element={<WorkspaceDetailView />} />
              <Route path="/workspace/:workspaceId/execution/:executionId" element={<ExecutionDetailView />} />
              <Route path="/job/:jobId" element={<CanvasView />} />
              <Route path="/workspace" element={<Navigate to="/workspaces" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
