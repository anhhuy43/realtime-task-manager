import { admin } from "../firebase.js";

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    console.log(
      "Middleware: Token verified. User UID:",
      decodedToken.uid,
      "Role:",
      decodedToken.role
    );
    next();
  } catch (error) {
    console.error("Middleware: Invalid or expired token:", error);
    return res
      .status(401)
      .json({ message: "Invalid or expired token.", error: error.message });
  }
};

const isOwner = (req, res, next) => {
  if (req.user && req.user.role === "owner") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Owner role required." });
  }
};

const isEmployee = (req, res, next) => {
  if (req.user && req.user.role === "employee") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Employee role required." });
  }
};

export default { verifyToken, isOwner, isEmployee };
