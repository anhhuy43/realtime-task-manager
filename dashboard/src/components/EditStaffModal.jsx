import React, { useState, useEffect } from "react";
import axios from "axios";

const EditStaffModal = ({ isOpen, onClose, employee, onUpdateStaff }) => {
  const [editedFields, setEditedFields] = useState({
    name: "",
    phoneNumber: "",
    email: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      console.log("EditStaffModal: Employee prop received:", employee);
      setEditedFields({
        name: employee.name || "",
        phoneNumber: employee.phoneNumber || "",
        email: employee.email || "",
      });
      setMessage("");
    }
  }, [employee]);

  const handleChange = (e) => {
    setEditedFields({ ...editedFields, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const employeeIdToUpdate = employee?._id;
    console.log(
      "EditStaffModal: Attempting to update employee with ID:",
      employeeIdToUpdate
    );

    if (!employeeIdToUpdate) {
      setMessage("Error: Employee ID is missing for update.");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `http://localhost:5000/api/owner/employees/update/${employeeIdToUpdate}`,
        editedFields,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setMessage("Employee updated successfully!");
        onUpdateStaff({ ...editedFields, _id: employeeIdToUpdate });
        setTimeout(() => {
          onClose();
          setMessage("");
        }, 1500);
      } else {
        setMessage(res.data.message || "Failed to update employee.");
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      setMessage(error.response?.data?.message || "Error updating employee.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Edit Staff
        </h3>
        {message && (
          <p
            className={`mb-4 text-center ${
              message.includes("successfully")
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-gray-700 text-sm font-semibold mb-2"
            >
              Employee Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={editedFields.name}
              onChange={handleChange}
              className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter employee name"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="phoneNumber"
              className="block text-gray-700 text-sm font-semibold mb-2"
            >
              Phone Number
            </label>
            <input
              type="text"
              id="phoneNumber"
              name="phoneNumber"
              value={editedFields.phoneNumber}
              onChange={handleChange}
              className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+84 Enter phone number"
              required
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="email"
              className="block text-gray-700 text-sm font-semibold mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={editedFields.email}
              onChange={handleChange}
              className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter email address"
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-200 ease-in-out"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-200 ease-in-out"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStaffModal;
