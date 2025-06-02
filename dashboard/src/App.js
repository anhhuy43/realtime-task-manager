import "./App.css";
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginForm from "./components/LoginForm";
import EmployeeLoginForm from "./components/EmployeeLoginForm";
import OwnerDashboard from "./components/OwnerDashboard";
import EmployeeSetupPage from "./components/EmployeeSetupPage";
import EmployeeDashboard from "./components/EmployeeDashboard";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, role, loadingAuth } = useAuth();

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading authentication...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/owner/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppContent() {
  const { user, role } = useAuth();

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Navigate to="/owner/login" replace />} />

        <Route path="/owner/login" element={<LoginForm />} />
        <Route path="/employee/login" element={<EmployeeLoginForm />} />
        <Route path="/employee-setup" element={<EmployeeSetupPage />} />

        <Route
          path="/owner/dashboard"
          element={
            <PrivateRoute allowedRoles={["owner"]}>
              <OwnerDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/employee/dashboard"
          element={
            <PrivateRoute allowedRoles={["employee"]}>
              <EmployeeDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center text-xl font-bold text-red-600">
              404 - Page Not Found
            </div>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
