import express from "express";
import {
  loginUser,
  registerUser,
  logoutUser,
  checkAuth,
  getUsers,
  updateUserRole,
  removeUser,
} from "../controllers/userController.js";
import adminAuth from "../middleware/adminAuth.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/logout", logoutUser);
userRouter.get("/check-auth", checkAuth);

userRouter.get("/all-users", getUsers);
userRouter.patch("/:id/role", adminAuth(["super-admin"]), updateUserRole);
userRouter.delete("/:id", adminAuth(["super-admin"]), removeUser);

export default userRouter;
