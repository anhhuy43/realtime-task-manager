import { db, auth } from "../firebase.js";
import twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  secure: false,
  auth: {
    user: "apikey",
    pass: process.env.SENDGRID_API_KEY,
  },
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const CreateNewAccessCode = async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res
      .status(400)
      .json({ success: false, message: "Phone number is required" });
  }

  const otp = generateOTP();
  const otpExpirationTime = Date.now() + 5 * 60 * 1000;

  try {
    await db.collection("otps").doc(phoneNumber).set({
      otp,
      createdAt: Date.now(),
      expiresAt: otpExpirationTime,
      type: "owner_phone",
    });

    // await twilioClient.messages.create({
    //   body: `Your login OTP is: ${otp}`,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phoneNumber,
    // });

    console.log(`[Owner OTP] for ${phoneNumber}: ${otp}`);

    console.log(`Access code for ${phoneNumber} saved to Firestore.`);
    return res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP to owner:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to send OTP" });
  }
};

const ValidateAccessCode = async (req, res) => {
  const { phoneNumber, accessCode } = req.body;

  if (!phoneNumber || !accessCode) {
    return res.status(400).json({
      success: false,
      message: "Phone number and access code are required",
    });
  }

  try {
    const otpDoc = await db.collection("otps").doc(phoneNumber).get();

    if (!otpDoc.exists || otpDoc.data().type !== "owner_phone") {
      console.log(`No active owner access code found for ${phoneNumber}.`);
      return res.status(404).json({
        success: false,
        message: "Invalid phone number or no owner access code generated.",
      });
    }

    const storedOtpData = otpDoc.data();
    const storedOtp = storedOtpData.otp;
    const expiresAt = storedOtpData.expiresAt;

    if (Date.now() >= expiresAt) {
      console.log(`Access code for ${phoneNumber} expired.`);
      await db.collection("otps").doc(phoneNumber).delete();
      return res.status(400).json({
        success: false,
        message: "Access code expired. Please request a new one.",
      });
    } else if (accessCode !== storedOtp) {
      console.log(`Invalid access code for ${phoneNumber}.`);
      return res
        .status(401)
        .json({ success: false, message: "Invalid access code." });
    } else {
      await db
        .collection("otps")
        .doc(phoneNumber)
        .update({ otp: "", expiresAt: null });
      console.log(`Login successful for ${phoneNumber}`);

      const token = jwt.sign(
        { phoneNumber: phoneNumber, role: "owner" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      return res.json({
        success: true,
        message: "Access code validated successfully. You are logged in.",
        token: token,
      });
    }
  } catch (error) {
    console.error("Error validating owner access code:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to validate access code",
    });
  }
};

const LoginEmailEmployee = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required." });
  }

  try {
    const employeeSnapshot = await db
      .collection("employees")
      .where("email", "==", email)
      .limit(1)
      .get();
    if (employeeSnapshot.empty) {
      return res.status(404).json({
        success: false,
        message: "Employee with this email not found.",
      });
    }
    const employeeData = employeeSnapshot.docs[0].data();

    const otp = generateOTP();
    const otpExpirationTime = Date.now() + 5 * 60 * 1000;

    await db.collection("otps").doc(email).set({
      otp,
      createdAt: Date.now(),
      expiresAt: otpExpirationTime,
      uid: employeeData.uid,
      type: "employee_email",
    });

    await transporter.sendMail({
      from: process.env.EMAIL_SERVICE_USER,
      to: email,
      subject: "Real-Time Task Manager - Your Login OTP",
      html: `
        <p>Hello ${employeeData.name || "Employee"},</p>
        <p>Your One-Time Password (OTP) for logging into Real-Time Task Manager is:</p>
        <p><strong>${otp}</strong></p>
        <p>This OTP is valid for 5 minutes. Please do not share it with anyone.</p>
        <p>If you did not request this, please ignore this email.</p>
        <p>Best regards,</p>
        <p>Your Task Manager Team</p>
      `,
    });

    console.log(`[Employee OTP] for ${email}: ${otp}`);

    return res.json({ success: true, message: "OTP sent to your email." });
  } catch (error) {
    console.error("Error sending OTP to employee email:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to send OTP." });
  }
};

const ValidateAccessCodeEmployee = async (req, res) => {
  const { email, accessCode } = req.body;

  if (!email || !accessCode) {
    return res.status(400).json({
      success: false,
      message: "Email and access code are required",
    });
  }

  try {
    const otpDoc = await db.collection("otps").doc(email).get();

    if (!otpDoc.exists || otpDoc.data().type !== "employee_email") {
      console.log(`No active employee access code found for ${email}.`);
      return res.status(404).json({
        success: false,
        message: "Invalid email or no employee access code generated.",
      });
    }

    const storedOtpData = otpDoc.data();
    const storedOtp = storedOtpData.otp;
    const expiresAt = storedOtpData.expiresAt;
    const employeeUid = storedOtpData.uid;

    if (Date.now() >= expiresAt) {
      console.log(`Access code for ${email} expired.`);
      await db.collection("otps").doc(email).delete();
      return res.status(400).json({
        success: false,
        message: "Access code expired. Please request a new one.",
      });
    } else if (accessCode !== storedOtp) {
      console.log(`Invalid access code for ${email}.`);
      return res
        .status(401)
        .json({ success: false, message: "Invalid access code." });
    } else {
      await db
        .collection("otps")
        .doc(email)
        .update({ otp: "", expiresAt: null });
      console.log(`Login successful for employee ${email}`);

      const token = jwt.sign(
        { uid: employeeUid, email: email, role: "employee" },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
      );

      return res.json({
        success: true,
        message:
          "Access code validated successfully. You are logged in as employee.",
        token: token,
      });
    }
  } catch (error) {
    console.error("Error validating employee access code:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to validate access code",
    });
  }
};

const verifyToken = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Decoded token:", decoded);

    let userDoc;
    if (decoded.role === "owner") {
    } else if (decoded.role === "employee") {
      userDoc = await db.collection("employees").doc(decoded.uid).get();
      if (!userDoc.exists) {
        return res
          .status(404)
          .json({ success: false, message: "User not found in database." });
      }
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Invalid user role in token." });
    }

    return res.json({
      success: true,
      user: decoded,
      message: "Token is valid.",
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
      error: error.message,
    });
  }
};

export {
  CreateNewAccessCode,
  ValidateAccessCode,
  LoginEmailEmployee,
  ValidateAccessCodeEmployee,
  verifyToken,
};
