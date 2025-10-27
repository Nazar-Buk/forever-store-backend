import express from "express";
import {
  loginUser,
  registerUser,
  logoutUser,
  checkAuth,
  getUsers,
  updateUserRole,
  removeUser,
  updateUserData,
  forgotPassword,
  resetPassword,
} from "../controllers/userController.js";
import adminAuth from "../middleware/adminAuth.js";
import verifyUser from "../middleware/userAuth.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/logout", logoutUser);
userRouter.get("/check-auth", checkAuth);

userRouter.get("/all-users", getUsers);
userRouter.patch("/:id/role", adminAuth(["super-admin"]), updateUserRole);
userRouter.delete("/:id", adminAuth(["super-admin"]), removeUser);
userRouter.put("/update", verifyUser, updateUserData);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/reset-password", resetPassword);

export default userRouter;
