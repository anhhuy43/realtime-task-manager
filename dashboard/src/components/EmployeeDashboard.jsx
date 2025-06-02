import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const EmployeeDashboard = () => {
  const { user, role, logout, loadingAuth } = useAuth();
  const navigate = useNavigate();

  if (!loadingAuth && (!user || role !== "employee")) {
    console.log(
      "EmployeeDashboard: Not authenticated or not an employee. Redirecting."
    );
    navigate("/owner/login");
    return null;
  }

  if (loadingAuth) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <p className="text-xl text-gray-700">Loading Employee Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Welcome to Employee Dashboard, {user?.displayName || "Employee"}!
          </h1>
          <button
            onClick={logout}
            className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition duration-200 shadow-md"
          >
            Logout
          </button>
        </div>

        <div className="mt-8 pt-4 border-t">
          <h2 className="text-2xl font-bold text-gray-800 mb-5">Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-gray-700">
            <div className="flex items-center">
              <span className="font-semibold w-32">Email:</span>
              <span className="ml-2">{user?.email || "N/A"}</span>
            </div>
            <div className="flex items-center">
              <span className="font-semibold w-32">Role:</span>
              <span className="ml-2 capitalize">{role || "N/A"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
