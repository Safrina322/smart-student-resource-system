import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop.jsx";
import "./styles/App.css";
import ProtectedRoute from "./components/ProtectRoute.jsx";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute.jsx";
// Pages
import HomePage from "./pages/Homepage";
import LoginPage from "./pages/LoginPage.jsx";
import LoginChoice from "./pages/LoginChoice.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import UploadResourcePage from "./pages/UserRequestResource.jsx";
import ResourceListPage from "./pages/ResourceListPage";
import CourseLearningPage from "./pages/CourseLearningPage";
import AdminPanelPage from "./pages/Adminpanelpage";
import AboutPage from "./pages/Aboutpage";
import ContactPage from "./pages/ContactPage.jsx";
import AdminAddCourse from "./pages/AdminAddCourse.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminRequests from "./pages/AdminRequests.jsx";
import AdminManageLessons from "./pages/AdminManageLessons.jsx";
import AdminAuditLogs from "./pages/AdminAuditLogs.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import VerifyEmailPage from "./pages/VerifyEmailPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import LecturerDashboard from "./pages/LecturerDashboard.jsx";
import ModeratorDashboard from "./pages/ModeratorDashboard.jsx";
import AdminManageUsers from "./pages/AdminManageUsers.jsx";
import ResourceDetailPage from "./pages/ResourceDetailPage.jsx";
import AchievementsPage from "./pages/AchievementsPage.jsx";
function App() {
  return (
    <AuthProvider>
    <Router>
      <ScrollToTop />
      <Navbar />
      
      <div className="app-container">
        <div className="main-content" >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginChoice />} />
          <Route path="/user/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
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
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>

      <Footer />

      </div>


    </Router>
    </AuthProvider>
  );
}

export default App;
