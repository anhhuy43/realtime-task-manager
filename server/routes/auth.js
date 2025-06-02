import express from "express";
const router = express.Router();
import {
  CreateNewAccessCode,
  ValidateAccessCode,
  LoginEmailEmployee,
  ValidateAccessCodeEmployee,
  verifyToken,
} from "../controllers/authController.js";

router.post("/owner/generate-access-code", CreateNewAccessCode);
router.post("/owner/validate-access-code", ValidateAccessCode);

router.post("/employee/login-email", LoginEmailEmployee);
router.post("/employee/validate-access-code", ValidateAccessCodeEmployee);

router.post("/verify-token", verifyToken);

export default router;
