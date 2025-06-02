import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

const EmployeeSetupPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const urlUid = searchParams.get("uid");
    const urlEmail = searchParams.get("email");

    if (urlUid && urlEmail) {
      setUid(urlUid);
      setEmail(urlEmail);
      setLoading(false);
    } else {
      setMessage("Invalid setup link. Missing UID or Email.");
      setLoading(false);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters long.");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/employee/set-password",
        {
          uid,
          email,
          newPassword: password,
        }
      );

      if (res.data.success) {
        setMessage("Account setup successful! You can now log in.");
        navigate("/employee/login");
      } else {
        setMessage(res.data.message || "Failed to set password.");
      }
    } catch (error) {
      console.error("Error setting password:", error);
      setMessage("Failed to set password. Please try again.");
    }
  };

  if (loading) {
    return <div>Loading setup page...</div>;
  }

  return (
    <div className="employee-setup-page">
      <h1>Set Up Your Account</h1>
      {message && <p className="message">{message}</p>}
      <form onSubmit={handleSubmit}>
        <p>
          Setting up account for: <strong>{email}</strong>
        </p>
        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit">Set Password</button>
      </form>
    </div>
  );
};

export default EmployeeSetupPage;
