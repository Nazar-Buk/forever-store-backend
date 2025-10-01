import express from "express";

import { getMongoUsage } from "../controllers/mongoUsageController.js";

const useRouter = express.Router();

useRouter.get("/mongo-usage", getMongoUsage);

export default useRouter;
