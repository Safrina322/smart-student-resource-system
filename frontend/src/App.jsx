import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { queryClient } from "./queryClient.js";
import { AuthProvider } from "./context/AuthContext.jsx";
import AppShell from "./components/AppShell.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import PageLoader from "./components/PageLoader.jsx";
import "./styles/App.css";
import ProtectedRoute from "./components/ProtectRoute.jsx";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute.jsx";
// Pages - lazy-loaded per route so the initial bundle only ships the shell
// (Navbar/Footer/routing) instead of every page in the app up front.
const HomePage = lazy(() => import("./pages/Homepage"));
const LoginPage = lazy(() => import("./pages/LoginPage.jsx"));
const LoginChoice = lazy(() => import("./pages/LoginChoice.jsx"));
const RegisterPage = lazy(() => import("./pages/RegisterPage.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.jsx"));
const UploadResourcePage = lazy(() => import("./pages/UserRequestResource.jsx"));
const ResourceListPage = lazy(() => import("./pages/ResourceListPage"));
const CourseLearningPage = lazy(() => import("./pages/CourseLearningPage"));
const AboutPage = lazy(() => import("./pages/Aboutpage"));
const ContactPage = lazy(() => import("./pages/ContactPage.jsx"));
const AdminAddCourse = lazy(() => import("./pages/AdminAddCourse.jsx"));
const AdminLogin = lazy(() => import("./pages/AdminLogin.jsx"));
const AdminRequests = lazy(() => import("./pages/AdminRequests.jsx"));
const AdminManageLessons = lazy(() => import("./pages/AdminManageLessons.jsx"));
const AdminAuditLogs = lazy(() => import("./pages/AdminAuditLogs.jsx"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage.jsx"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage.jsx"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage.jsx"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage.jsx"));
const ProfilePage = lazy(() => import("./pages/ProfilePage.jsx"));
const SettingsPage = lazy(() => import("./pages/SettingsPage.jsx"));
const LecturerDashboard = lazy(() => import("./pages/LecturerDashboard.jsx"));
const ModeratorDashboard = lazy(() => import("./pages/ModeratorDashboard.jsx"));
const AdminManageUsers = lazy(() => import("./pages/AdminManageUsers.jsx"));
const ResourceDetailPage = lazy(() => import("./pages/ResourceDetailPage.jsx"));
const AchievementsPage = lazy(() => import("./pages/AchievementsPage.jsx"));
const StudyPlannerPage = lazy(() => import("./pages/StudyPlannerPage.jsx"));
function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <Router>
      <ScrollToTop />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--color-surface-strong)",
            color: "var(--color-text)",
            border: "1px solid var(--color-border)",
          },
          success: { iconTheme: { primary: "#10b981", secondary: "#0b0f0e" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#0b0f0e" } },
        }}
      />
      <AppShell>
        <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginChoice />} />
          <Route path="/user/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route
            path="/lecturer/dashboard"
            element={<ProtectedRoute allowRoles={["lecturer"]}><LecturerDashboard /></ProtectedRoute>}
          />
          <Route
            path="/moderator/dashboard"
            element={<ProtectedRoute allowRoles={["moderator"]}><ModeratorDashboard /></ProtectedRoute>}
          />
          <Route path="/admin/add-course" element={<ProtectedAdminRoute><AdminAddCourse /></ProtectedAdminRoute>} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/dashboard"element={<ProtectedRoute><Dashboard /></ProtectedRoute>}/>
          <Route path="/admin/dashboard" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
          <Route path="/upload" element={<ProtectedRoute><UploadResourcePage /></ProtectedRoute>} />
          <Route path="/resources" element={<ProtectedRoute allowAdmin={true}><ResourceListPage /></ProtectedRoute>} />
          <Route path="/resources/:id" element={<ProtectedRoute allowAdmin={true}><CourseLearningPage /></ProtectedRoute>} />
          <Route path="/course/:id" element={<CourseLearningPage />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/admin/requests" element={<ProtectedAdminRoute><AdminRequests /></ProtectedAdminRoute>} />
          <Route path="/admin/lessons" element={<ProtectedAdminRoute><AdminManageLessons /></ProtectedAdminRoute>} />
          <Route path="/admin/audit-logs" element={<ProtectedAdminRoute><AdminAuditLogs /></ProtectedAdminRoute>} />
          <Route path="/admin/users" element={<ProtectedAdminRoute><AdminManageUsers /></ProtectedAdminRoute>} />
          <Route path="/resource-hub/:id" element={<ResourceDetailPage />} />
          <Route path="/achievements" element={<ProtectedRoute><AchievementsPage /></ProtectedRoute>} />
          <Route path="/study-planner" element={<ProtectedRoute><StudyPlannerPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
      </AppShell>
    </Router>
    </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
