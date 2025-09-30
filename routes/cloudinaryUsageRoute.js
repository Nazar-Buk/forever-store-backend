import express from "express";

import { getCloudinaryUsage } from "../controllers/cloudinaryUsageController.js";

const useRouter = express.Router();

useRouter.get("/cloudinary-usage", getCloudinaryUsage);

export default useRouter;
