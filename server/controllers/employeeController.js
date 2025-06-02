import { db, auth, admin } from "../firebase.js";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  secure: false,
  auth: {
    user: "apikey",
    pass: process.env.SENDGRID_API_KEY,
  },
});

// (POST) CreateEmployee
const CreateEmployee = async (req, res) => {
  const { name, email, role, phoneNumber } = req.body;
  if (!name || !email || !role || !phoneNumber) {
    return res.status(400).json({
      success: false,
      message: "All fields (name, email, role, phoneNumber) are required.",
    });
  }

  let userRecord;
  try {
    // 1. Tạo user trong Firebase Authentication
    const temporaryPassword = Math.random().toString(36).slice(-8);
    try {
      userRecord = await auth.createUser({
        email: email,
        password: temporaryPassword,
        displayName: name,
        phoneNumber: phoneNumber,
      });
      console.log(`Firebase Auth user created: ${userRecord.uid}`);
    } catch (firebaseAuthError) {
      if (firebaseAuthError.code === "auth/email-already-in-use") {
        return res.status(409).json({
          success: false,
          message: "This email is already registered.",
        });
      }
      throw firebaseAuthError; // Re-throw other Firebase Auth errors
    }

    // 2. Lưu thông tin employee vào Firestore (collection 'employees')
    const newEmployeeData = {
      uid: userRecord.uid,
      name,
      email,
      role,
      phoneNumber,
      status: "active",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      tasks: [],
      schedule: {},
    };

    // Sử dụng userRecord.uid làm ID tài liệu Firestore
    await db.collection("employees").doc(userRecord.uid).set(newEmployeeData);
    console.log(
      `Employee document created in Firestore for UID: ${userRecord.uid}`
    );

    // 3. Gửi email với thông tin đăng nhập và link thiết lập mật khẩu
    const employeeSetupLink = `http://localhost:3000/employee-setup?uid=${
      userRecord.uid
    }&email=${encodeURIComponent(email)}`;

    await transporter.sendMail({
      from: process.env.EMAIL_SERVICE_USER,
      to: email,
      subject: "Welcome to Real-Time Task Manager - Account Setup",
      html: `
            <p>Hello ${name},</p>
            <p>Welcome to our Real-Time Task Manager!</p>
            <p>Your temporary login credentials are:</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
            <p>Please click on the link below to set up your permanent password and access your account:</p>
            <p><a href="${employeeSetupLink}">Set Up Your Account</a></p>
            <p>If you have any questions, please contact your manager.</p>
            <p>Best regards,</p>
            <p>Your Task Manager Team</p>
        `,
    });
    console.log(`Welcome email sent to ${email}`);

    // 4. Lấy lại tài liệu đã tạo để trả về frontend (bao gồm cả createdAt)
    const docSnapshot = await db
      .collection("employees")
      .doc(userRecord.uid)
      .get();
    const createdEmployee = {
      _id: docSnapshot.id, // Sử dụng _id cho ID tài liệu Firestore
      ...docSnapshot.data(),
    };

    res.status(201).json({
      success: true,
      message: "Employee created and welcome email sent successfully.",
      employee: createdEmployee, // <<<< THÊM ĐỐI TƯỢNG EMPLOYEE ĐẦY ĐỦ VÀO ĐÂY >>>>
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    if (userRecord && userRecord.uid) {
      console.log(
        `Attempting to delete partially created Firebase Auth user: ${userRecord.uid}`
      );
      try {
        await auth.deleteUser(userRecord.uid);
        console.log(
          `Successfully deleted partially created Firebase Auth user: ${userRecord.uid}`
        );
      } catch (deleteError) {
        console.error(
          `Failed to delete partially created Firebase Auth user ${userRecord.uid}:`,
          deleteError
        );
      }
    }
    res.status(500).json({
      success: false,
      message: "Failed to create employee.",
      error: error.message,
    });
  }
};

const getLoggedInEmployeeDetails = async (req, res) => {
  try {
    const uid = req.user.uid;
    console.log(`Backend: Fetching details for employee UID: ${uid}`);

    const employeeDoc = await db.collection("employees").doc(uid).get();

    if (!employeeDoc.exists) {
      console.log(`Backend: Employee document not found for UID: ${uid}`);
      return res
        .status(404)
        .json({ success: false, message: "Employee details not found." });
    }

    const employeeData = employeeDoc.data();
    const employeeDetails = {
      _id: employeeDoc.id,
      ...employeeData,
    };
    console.log(
      "Backend: Successfully fetched employee details:",
      employeeDetails
    );
    res.json({ success: true, employee: employeeDetails });
  } catch (error) {
    console.error("Backend: Error fetching logged-in employee details:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch employee details." });
  }
};
// (GET) GetEmployee
const GetEmployee = async (req, res) => {
  const { employeeId } = req.params;
  if (!employeeId) {
    return res
      .status(400)
      .json({ success: false, message: "Employee ID is required." });
  }
  try {
    const employeeDoc = await db.collection("employees").doc(employeeId).get();
    if (!employeeDoc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found." });
    }
    const userAuth = await auth.getUser(employeeDoc.data().uid);

    res.json({
      success: true,
      employee: {
        id: employeeDoc.id,
        ...employeeDoc.data(),
        authInfo: userAuth.toJSON(),
      },
    });
  } catch (error) {
    console.error("Error getting employee:", error);
    if (error.code === "auth/user-not-found") {
      return res.status(404).json({
        success: false,
        message: "Associated user account not found.",
      });
    }
    res
      .status(500)
      .json({ success: false, message: "Failed to retrieve employee." });
  }
};

// (GET) GetAllEmployees
const GetAllEmployees = async (req, res) => {
  try {
    const employeesSnapshot = await db.collection("employees").get();
    const employees = employeesSnapshot.docs.map((doc) => ({
      _id: doc.id,
      ...doc.data(),
    }));
    res.json({ success: true, employees });
  } catch (error) {
    console.error("Error getting all employees:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to retrieve employees." });
  }
};

// (PUT) UpdateEmployee
const UpdateEmployee = async (req, res) => {
  const { employeeId } = req.params;
  console.log("Employee ID from params:", employeeId);
  const updates = req.body;
  if (!employeeId || !updates || Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      message: "Employee ID and updates are required.",
    });
  }
  try {
    await db.collection("employees").doc(employeeId).update(updates);
    console.log(`Firestore document for employee ${employeeId} updated.`);

    if (updates.email || updates.phoneNumber || updates.name) {
      const employeeDoc = await db
        .collection("employees")
        .doc(employeeId)
        .get();
      if (employeeDoc.exists && employeeDoc.data().uid) {
        const authUpdates = {};
        if (updates.email) authUpdates.email = updates.email;
        if (updates.phoneNumber) authUpdates.phoneNumber = updates.phoneNumber;
        if (updates.name) authUpdates.displayName = updates.name;
        await auth.updateUser(employeeDoc.data().uid, authUpdates);
        console.log(`Firebase Auth user ${employeeDoc.data().uid} updated.`);
      }
    }

    const updatedEmployeeDoc = await db
      .collection("employees")
      .doc(employeeId)
      .get();

    if (!updatedEmployeeDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Updated employee not found.",
      });
    }

    const updatedEmployeeData = updatedEmployeeDoc.data();
    const employeeToReturn = {
      _id: updatedEmployeeDoc.id,
      ...updatedEmployeeData,
    };

    res.json({
      success: true,
      message: "Employee updated successfully.",
      employee: employeeToReturn,
    });
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update employee.",
      error: error.message,
    });
  }
};

const DeleteEmployee = async (req, res) => {
  const { employeeId } = req.params;
  if (!employeeId) {
    return res
      .status(400)
      .json({ success: false, message: "Employee ID is required." });
  }
  try {
    const employeeDoc = await db.collection("employees").doc(employeeId).get();
    if (!employeeDoc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found." });
    }
    const employeeData = employeeDoc.data();

    if (employeeData.uid) {
      try {
        await auth.deleteUser(employeeData.uid);
        console.log(`Firebase Auth user ${employeeData.uid} deleted.`);
      } catch (authDeleteError) {
        console.warn(
          `Could not delete Firebase Auth user ${employeeData.uid}:`,
          authDeleteError.message
        );
      }
    }

    await db.collection("employees").doc(employeeId).delete();
    console.log(`Employee document ${employeeId} deleted from Firestore.`);
    res.json({ success: true, message: "Employee deleted successfully." });
  } catch (error) {
    console.error("Error deleting employee:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete employee." });
  }
};

const SetEmployeePassword = async (req, res) => {
  const { uid, email, newPassword /*, token */ } = req.body;

  if (!uid || !email || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "UID, email, and new password are required.",
    });
  }

  try {
    await auth.updateUser(uid, {
      password: newPassword,
      emailVerified: true,
    });

    return res.json({ success: true, message: "Password set successfully." });
  } catch (error) {
    console.error("Error setting employee password:", error);
    if (error.code === "auth/user-not-found") {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found." });
    }
    if (error.code === "auth/weak-password") {
      return res.status(400).json({
        success: false,
        message: "Password is too weak. Must be at least 6 characters.",
      });
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to set password." });
  }
};

export {
  CreateEmployee,
  GetEmployee,
  GetAllEmployees,
  UpdateEmployee,
  DeleteEmployee,
  SetEmployeePassword,
  getLoggedInEmployeeDetails,
};
