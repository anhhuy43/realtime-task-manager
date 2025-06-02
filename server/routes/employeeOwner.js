import express from "express";
const router = express.Router();
import {
  CreateEmployee,
  GetEmployee,
  GetAllEmployees,
  UpdateEmployee,
  DeleteEmployee,
  SetEmployeePassword,
  getLoggedInEmployeeDetails,
} from "../controllers/employeeController.js";
import authMiddleware from "../middleware/authMiddleware.js";

router.post("/create", CreateEmployee);
router.get("/get/:employeeId", GetEmployee);
router.get("/get-all", GetAllEmployees);
router.put("/update/:employeeId", UpdateEmployee);
router.delete("/delete/:employeeId", DeleteEmployee);
router.post("/set-password", SetEmployeePassword);
router.get(
  "/me",
  authMiddleware.verifyToken,
  authMiddleware.isEmployee,
  getLoggedInEmployeeDetails
);

export default router;
