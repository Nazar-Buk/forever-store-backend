import express from "express";

import { addCategory } from "../controllers/categoryController.js";

const categoryRouter = express.Router();

categoryRouter.post("/add", addCategory);

export default categoryRouter;
