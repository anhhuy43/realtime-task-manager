// src/components/OwnerDashboard.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import AddStaffModal from "./AddStaffModal"; // Import modal Add
import EditStaffModal from "./EditStaffModal"; // Import modal Edit
import { useNavigate } from "react-router-dom"; // Import useNavigate để logout

const OwnerDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:5000/api/owner/employees/get-all",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data.success) {
        setEmployees(res.data.employees);
      } else {
        setError(res.data.message || "Failed to fetch employees.");
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
      setError(err.response?.data?.message || "Error fetching employees.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/owner/login", { replace: true });
  };

  const handleAddStaffClick = () => {
    setIsAddModalOpen(true);
  };

  const handleEditStaffClick = (employee) => {
    console.log("OwnerDashboard: Editing employee:", employee);
    setSelectedEmployee(employee);
    setIsEditModalOpen(true);
  };

  const handleDeleteStaff = async (employeeId) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.delete(
          `http://localhost:5000/api/owner/employees/delete/${employeeId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          setEmployees(employees.filter((emp) => emp._id !== employeeId));
          alert("Employee deleted successfully!");
        } else {
          alert(res.data.message || "Failed to delete employee.");
        }
      } catch (error) {
        console.error("Error deleting employee:", error);
        alert(error.response?.data?.message || "Error deleting employee.");
      }
    }
  };

  const handleStaffAdded = (newEmployee) => {
    setEmployees([...employees, newEmployee]);
    setIsAddModalOpen(false);
  };

  const handleStaffUpdated = (updatedEmployee) => {
    setEmployees(
      employees.map((emp) =>
        emp._id === updatedEmployee._id ? updatedEmployee : emp
      )
    );
    setIsEditModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">
          Staff Management
        </h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleAddStaffClick}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 ease-in-out transform hover:scale-105"
          >
            + Add Staff
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition duration-200 ease-in-out"
          >
            Logout
          </button>
        </div>
      </header>

      {loading ? (
        <div className="text-center py-10 text-lg text-gray-600">
          Loading staff data...
        </div>
      ) : error ? (
        <div className="text-center py-10 text-lg text-red-600">
          Error: {error}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Employee Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Phone Number
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email Address
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-8 text-center text-gray-500 text-lg"
                  >
                    No staff found. Click "Add Staff" to add one.
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr
                    key={employee._id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {employee.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {employee.phoneNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {employee.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button
                        onClick={() => handleEditStaffClick(employee)}
                        className="text-indigo-600 hover:text-indigo-900 px-3 py-1 rounded-md border border-indigo-200 hover:border-indigo-400 transition-colors duration-150"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(employee._id)}
                        className="ml-4 text-red-600 hover:text-red-900 px-3 py-1 rounded-md border border-red-200 hover:border-red-400 transition-colors duration-150"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <AddStaffModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddStaff={handleStaffAdded}
      />
      {selectedEmployee && (
        <EditStaffModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          employee={selectedEmployee}
          onUpdateStaff={handleStaffUpdated}
        />
      )}
    </div>
  );
};

export default OwnerDashboard;
