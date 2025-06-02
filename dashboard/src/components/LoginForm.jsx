import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { parsePhoneNumberFromString } from "libphonenumber-js";

const LoginForm = () => {
  const [localPhoneNumber, setLocalPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [isOTPSent, setIsOTPSent] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const getFullPhoneNumber = (num) => {
    try {
      const phoneNumber = parsePhoneNumberFromString(num, "VN");
      if (phoneNumber && phoneNumber.isValid()) {
        return phoneNumber.format("E.164");
      }
    } catch (error) {
      console.error("Invalid phone number format:", error);
    }
    return null;
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setMessage("");
    const fullPhoneNumber = getFullPhoneNumber(localPhoneNumber);
    if (!fullPhoneNumber) {
      setMessage("Phone number is required and must be valid.");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/owner/generate-access-code",
        { phoneNumber: fullPhoneNumber }
      );
      if (res.data.success) {
        setMessage(
          "OTP sent successfully! Please enter the 6-digit access code."
        );
        setIsOTPSent(true);
      } else {
        setMessage(res.data.message || "Failed to send OTP.");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      setMessage(error.response?.data?.message || "Error sending OTP.");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    const fullPhoneNumber = getFullPhoneNumber(localPhoneNumber);
    if (!fullPhoneNumber || !otp) {
      setMessage("Phone number and Access Code are required.");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/owner/validate-access-code",
        { phoneNumber: fullPhoneNumber, accessCode: otp }
      );

      if (res.data.success) {
        setMessage("Login successful!");
        login(res.data.token, "owner");
        navigate("/owner/dashboard", { replace: true });
      } else {
        setMessage(
          res.data.message || "Login failed. Please check your access code."
        );
      }
    } catch (error) {
      console.error("Error during login:", error);
      setMessage(
        error.response?.data?.message || "Login failed. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-200 to-indigo-300">
      <div className="bg-white p-10 rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 tracking-wide">
          Phone Verification
        </h2>
        <form onSubmit={isOTPSent ? handleLogin : handleSendOTP}>
          {message && (
            <p
              className={`mb-6 text-sm font-medium ${
                message.includes("successful")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}

          <div className="mb-6">
            <label
              htmlFor="phoneNumber"
              className="block text-gray-700 text-left text-sm font-semibold mb-2"
            >
              Phone Number
            </label>
            <input
              type="text"
              id="phoneNumber"
              className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              placeholder="+84 Enter your phone number"
              value={localPhoneNumber}
              onChange={(e) => setLocalPhoneNumber(e.target.value)}
              disabled={isOTPSent}
            />
          </div>

          {!isOTPSent && (
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full transition duration-200 ease-in-out transform hover:scale-105 text-lg"
            >
              Send Access Code
            </button>
          )}

          {isOTPSent && (
            <div className="mb-6">
              <label
                htmlFor="otp"
                className="block text-gray-700 text-left text-sm font-semibold mb-2"
              >
                6-digit Access Code
              </label>
              <input
                type="text"
                id="otp"
                className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength="6"
              />
            </div>
          )}

          {isOTPSent && (
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 w-full transition duration-200 ease-in-out transform hover:scale-105 text-lg"
            >
              Sign In
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
