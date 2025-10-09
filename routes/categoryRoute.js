import express from "express";

import {
  addCategory,
  getCategories,
  removeCategory,
  singleCategory,
  updateCategoryAndSubCategory,
} from "../controllers/categoryController.js";

import adminAuth from "../middleware/adminAuth.js";

const categoryRouter = express.Router();

categoryRouter.post("/add", addCategory);
categoryRouter.get("/list", getCategories);
categoryRouter.delete(
  "/remove/:categoryId",
  adminAuth(["admin", "super-admin"]),
  removeCategory
);
categoryRouter.get("/single-category", singleCategory);
categoryRouter.patch(
  "/update-category/:categoryId",
  adminAuth(["admin", "super-admin"]),
  updateCategoryAndSubCategory
);

export default categoryRouter;
