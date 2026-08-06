import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ConversationPage from './pages/ConversationPage';
import ScorecardPage from './pages/ScorecardPage';
import DocumentTrainerPage from './pages/DocumentTrainerPage';
import { useAuth } from './hooks/useAuth';

import { isSupabaseConfigured } from './lib/supabaseClient';
import { ShieldAlert } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div></div>;
  }
  
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function MissingConfigScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="glass-panel max-w-lg w-full p-8 rounded-3xl text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 via-rose-400 to-rose-500"></div>
        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <ShieldAlert size={40} />
        </div>
        <h1 className="text-3xl font-bold mb-4">Configuration Missing</h1>
        <p className="text-slate-600 dark:text-slate-300 mb-6 text-lg">
          The application requires Supabase credentials to run. Please add them to your environment variables.
        </p>
        <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl text-left border border-slate-200 dark:border-slate-700">
          <code className="text-sm text-slate-800 dark:text-slate-200 break-all font-mono">
            VITE_SUPABASE_URL=your_url_here<br/>
            VITE_SUPABASE_ANON_KEY=your_key_here
          </code>
        </div>
        <p className="text-sm text-slate-500 mt-6">Create a <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">.env</code> file in the frontend directory and restart the development server.</p>
      </div>
    </div>
  );
}

export default function App() {
  if (!isSupabaseConfigured) {
    return <MissingConfigScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        
        <Route path="/conversation/:sessionId" element={
          <ProtectedRoute>
            <ConversationPage />
          </ProtectedRoute>
        } />
        
        <Route path="/scorecard/:sessionId" element={
          <ProtectedRoute>
            <ScorecardPage />
          </ProtectedRoute>
        } />
        
        <Route path="/document-trainer" element={
          <ProtectedRoute>
            <DocumentTrainerPage />
          </ProtectedRoute>
        } />
        
        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
