import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
function App() {
  return (
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
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>

      <Footer />

      </div>


    </Router>
  );
}

export default App;
