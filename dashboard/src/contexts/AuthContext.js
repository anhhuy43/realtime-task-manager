import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const verifyAuthToken = async () => {
    setLoadingAuth(true);
    const token = localStorage.getItem("token");
    console.log(
      "AuthContext: verifyAuthToken running. Token from localStorage:",
      token
    );
    if (token) {
      try {
        const res = await axios.post("http://localhost:5000/api/verify-token", {
          token,
        });

        if (res.data.success) {
          const decodedToken = jwtDecode(token);
          console.log(
            "AuthContext: Token verified successfully. Decoded user:",
            decodedToken
          );
          setUser(decodedToken);
          setRole(decodedToken.role);
        } else {
          console.log(
            "AuthContext: Backend token verification failed, clearing token."
          );
          localStorage.removeItem("token");
          setUser(null);
          setRole(null);
        }
      } catch (error) {
        console.error(
          "AuthContext: Token verification failed (frontend error):",
          error
        );
        localStorage.removeItem("token");
        setUser(null);
        setRole(null);
      }
    }
    setLoadingAuth(false);
  };

  const login = (token, userRoleFromLogin) => {
    localStorage.setItem("token", token);
    try {
      const decodedToken = jwtDecode(token);
      console.log(
        "AuthContext: Login function called. Decoded token:",
        decodedToken
      );
      setUser(decodedToken);
      setRole(userRoleFromLogin);
    } catch (error) {
      console.error("AuthContext: Error decoding token during login:", error);
      localStorage.removeItem("token");
      setUser(null);
      setRole(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setRole(null);
  };

  useEffect(() => {
    verifyAuthToken();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loadingAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
