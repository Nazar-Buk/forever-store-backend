import express from "express";

import {
  createOrder,
  createGuestOrder,
  getUserOrders,
  getAllOrders,
  updateStatus,
  deleteOrder,
} from "../controllers/orderController.js";

import verifyUser from "../middleware/userAuth.js";
import adminAuth from "../middleware/adminAuth.js";

const orderRouter = express.Router();

orderRouter.post("/add", verifyUser, createOrder);
orderRouter.post("/guest-add", createGuestOrder);
orderRouter.get("/get-user-orders", verifyUser, getUserOrders);
orderRouter.get(
  "/get-all-orders",
  adminAuth(["admin", "super-admin"]),
  getAllOrders
);
orderRouter.patch("/update", adminAuth(["admin", "super-admin"]), updateStatus);
orderRouter.delete("/delete", adminAuth(["admin", "super-admin"]), deleteOrder);

export default orderRouter;
