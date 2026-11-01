import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@/styles.css';
const HomePage = lazy(() => import('@/pages/homePage').then((module) => ({ default: module.HomePage })));
const LoginPage = lazy(() => import('@/pages/authPages').then((module) => ({ default: module.LoginPage })));
const SignupPage = lazy(() => import('@/pages/authPages').then((module) => ({ default: module.SignupPage })));
const ProtectedLayout = lazy(() => import('@/pages/protectedLayout').then((module) => ({ default: module.ProtectedLayout })));
const DashboardPage = lazy(() => import('@/pages/dashboardPage').then((module) => ({ default: module.DashboardPage })));
const RoadmapPage = lazy(() => import('@/pages/roadmapPage').then((module) => ({ default: module.RoadmapPage })));
const NotFoundPage = lazy(() => import('@/pages/notFoundPage').then((module) => ({ default: module.NotFoundPage })));
const ResumeAgent = lazy(() => import('@/components/agents/resume-agent').then((module) => ({ default: module.ResumeAgent })));
const InterviewAgent = lazy(() => import('@/components/agents/interview-agent').then((module) => ({ default: module.InterviewAgent })));
const FeedbackAgent = lazy(() => import('@/components/agents/feedback-agent').then((module) => ({ default: module.FeedbackAgent })));
const ProfileForm = lazy(() => import('@/components/profile/profile-form').then((module) => ({ default: module.ProfileForm })));
const SettingsPanel = lazy(() => import('@/components/profile/settings-panel').then((module) => ({ default: module.SettingsPanel })));

const queryClient = new QueryClient();

// Main browser entry point. React Router maps URLs to the corresponding page.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<div role="status" className="flex min-h-screen items-center justify-center bg-neutral-100 text-sm text-neutral-500">Loading your workspace…</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/resume" element={<ResumeAgent />} />
            <Route path="/interview" element={<InterviewAgent />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/feedback" element={<FeedbackAgent />} />
            <Route path="/profile" element={<ProfileForm />} />
            <Route path="/settings" element={<SettingsPanel />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
