import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import HomePage from './pages/HomePage';
import JobsPage from './pages/JobsPage';
import JobDetailsPage, { NotFound } from './pages/JobDetailsPage';
import { About, Contact, Privacy, Terms } from './pages/StaticPages';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageJobsPage from './pages/admin/ManageJobsPage';
import JobFormPage from './pages/admin/JobFormPage';
import JobPreviewPage from './pages/admin/JobPreviewPage';
import CandidateAuthPage from './pages/candidate/CandidateAuthPage';
import CandidateLayout from './pages/candidate/CandidateLayout';
import CandidateDashboardPage from './pages/candidate/CandidateDashboardPage';
import CandidateProfilePage from './pages/candidate/CandidateProfilePage';
import CandidateResumePage from './pages/candidate/CandidateResumePage';
import AdminRecruitersPage from './pages/admin/AdminRecruitersPage';
import RecruiterAuthPage from './pages/recruiter/RecruiterAuthPage';
import RecruiterLayout from './pages/recruiter/RecruiterLayout';
import { RecruiterDashboardPage, RecruiterProfilePage, RecruiterJobsPage } from './pages/recruiter/RecruiterPages';
import RecruiterApplicationsPage from './pages/recruiter/RecruiterApplicationsPage';
import CareerAssistancePage from './pages/candidate/CareerAssistancePage';
import { AdminAssistanceList, AdminAssistanceDetail } from './pages/admin/AdminAssistancePages';
import { SavedJobsPage, ApplicationsPage } from './pages/candidate/TrackerPages';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/:id" element={<JobDetailsPage />} />
        <Route path="/internships" element={<JobsPage preset="internships" />} />
        <Route path="/remote-jobs" element={<JobsPage preset="remote" />} />
        <Route path="/fresher-jobs" element={<JobsPage preset="fresher" />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<AdminProtectedRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/jobs" element={<ManageJobsPage />} />
          <Route path="/admin/jobs/new" element={<JobFormPage />} />
          <Route path="/admin/jobs/:id/edit" element={<JobFormPage />} />
          <Route path="/admin/jobs/:id/preview" element={<JobPreviewPage />} />
          <Route path="/admin/recruiters" element={<AdminRecruitersPage />} />
          <Route path="/admin/assistance" element={<AdminAssistanceList />} />
          <Route path="/admin/assistance/:id" element={<AdminAssistanceDetail />} />
        </Route>
        <Route path="/candidate/login" element={<CandidateAuthPage mode="login" />} />
        <Route path="/candidate/register" element={<CandidateAuthPage mode="register" />} />
        <Route element={<CandidateLayout />}>
          <Route path="/candidate" element={<CandidateDashboardPage />} />
          <Route path="/candidate/dashboard" element={<CandidateDashboardPage />} />
          <Route path="/candidate/profile" element={<CandidateProfilePage />} />
          <Route path="/candidate/resume" element={<CandidateResumePage />} />
          <Route path="/candidate/saved-jobs" element={<SavedJobsPage />} />
          <Route path="/candidate/applications" element={<ApplicationsPage />} />
          <Route path="/candidate/career-assistance" element={<CareerAssistancePage />} />
        </Route>
        <Route path="/recruiter/login" element={<RecruiterAuthPage mode="login" />} />
        <Route path="/recruiter/register" element={<RecruiterAuthPage mode="register" />} />
        <Route element={<RecruiterLayout />}>
          <Route path="/recruiter" element={<RecruiterDashboardPage />} />
          <Route path="/recruiter/dashboard" element={<RecruiterDashboardPage />} />
          <Route path="/recruiter/profile" element={<RecruiterProfilePage />} />
          <Route path="/recruiter/jobs" element={<RecruiterJobsPage />} />
          <Route path="/recruiter/jobs/new" element={<JobFormPage scope="recruiter" />} />
          <Route path="/recruiter/jobs/:id/edit" element={<JobFormPage scope="recruiter" />} />
          <Route path="/recruiter/jobs/:id/preview" element={<JobPreviewPage scope="recruiter" />} />
          <Route path="/recruiter/applications" element={<RecruiterApplicationsPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
