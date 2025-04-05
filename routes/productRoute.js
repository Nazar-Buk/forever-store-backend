import express from "express";
import {
  addProduct,
  listProducts,
  removeProduct,
  singleProduct,
  updateProduct,
} from "../controllers/productController.js";
import upload from "../middleware/multer.js";
import adminAuth from "../middleware/adminAuth.js";

const productRouter = express.Router();

productRouter.post(
  "/add",
  adminAuth,
  // upload.fields([
  //   { name: "image1", maxCount: 1 },
  //   { name: "image2", maxCount: 1 },
  //   { name: "image3", maxCount: 1 },
  //   { name: "image4", maxCount: 1 },
  // ]),

  upload.any(), // робить масив з файлів
  addProduct
); // upload.fields дозволяє завантажувати кілька фотографій
// // upload.any можна завантажувати будь-яку кількість фотографій
productRouter.post("/remove", adminAuth, removeProduct);
productRouter.post("/single", singleProduct);
productRouter.get("/list", listProducts);
productRouter.patch(
  "/update/:productId",
  adminAuth,
  upload.any(), // робить масив з файлів,
  updateProduct
);

export default productRouter;
