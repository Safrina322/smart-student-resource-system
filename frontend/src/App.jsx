import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./styles/App.css";
import ProtectedRoute from "./components/ProtectRoute.jsx";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute.jsx";
// Pages
import HomePage from "./pages/Homepage";
import LoginPage from "./pages/Loginpage.jsx";
import LoginChoice from "./pages/LoginChoice.jsx";
import RegisterPage from "./pages/Registerpage.jsx";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import UploadResourcePage from "./pages/UserRequestResource.jsx";
import ResourceListPage from "./pages/ResourceListPage";
import CourseLearningPage from "./pages/CourseLearningPage";
import AdminPanelPage from "./pages/Adminpanelpage";
import AboutPage from "./pages/Aboutpage";
import AdminAddCourse from "./pages/AdminAddCourse.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminRequests from "./pages/AdminRequests.jsx";
import AdminManageLessons from "./pages/AdminManageLessons.jsx";
function App() {
  return (
    <Router>
      
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
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/upload" element={<ProtectedRoute><UploadResourcePage /></ProtectedRoute>} />
          <Route path="/resources" element={<ResourceListPage />} />
          <Route path="/resources/:id" element={<CourseLearningPage />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/admin/requests" element={<AdminRequests />}/>
          <Route path="/admin/lessons" element={<ProtectedAdminRoute><AdminManageLessons /></ProtectedAdminRoute>} />
        </Routes>
      </div>

      <Footer />

      </div>


    </Router>
  );
}

export default App;
