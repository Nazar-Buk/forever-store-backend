import express from "express";

import {
  addCategory,
  getCategories,
  removeCategory,
} from "../controllers/categoryController.js";

import adminAuth from "../middleware/adminAuth.js";

const categoryRouter = express.Router();

categoryRouter.post("/add", addCategory);
categoryRouter.get("/list", getCategories);
categoryRouter.delete("/remove/:categoryId", adminAuth, removeCategory);

export default categoryRouter;
