import express from "express";
import {
  authenticateUser,
  createUserAccount,
  getCurrentUserProfile,
  signOutUser,
  updateUserProfile,
} from "../controllers/user.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import upload from "../utils/multer.js";

const router = express.Router();

router.post("/signup", createUserAccount);
router.post("/signin", authenticateUser);
router.post("/signout", signOutUser);

router.post("/profile", isAuthenticated, getCurrentUserProfile);
router.patch(
  "/profile",
  isAuthenticated,
  upload.single("avatar"),
  updateUserProfile
);
export default router;
