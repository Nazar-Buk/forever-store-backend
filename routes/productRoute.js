import express from "express";
import {
  addProduct,
  listProducts,
  removeProduct,
  singleProduct,
  updateProduct,
  bestsellersProducts,
  latestProducts,
  relatedProducts,
  getAllProducts,
  generatePriceListPdf,
  generatePriceListExcel,
} from "../controllers/productController.js";
import upload from "../middleware/multer.js";
import adminAuth from "../middleware/adminAuth.js";

const productRouter = express.Router();

productRouter.post(
  "/add",
  adminAuth(["admin", "super-admin"]),
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
productRouter.post(
  "/remove",
  adminAuth(["admin", "super-admin"]),
  removeProduct
);
productRouter.post("/single", singleProduct);
productRouter.get("/list", listProducts);
productRouter.get("/bestsellers", bestsellersProducts);
productRouter.get("/latest-products", latestProducts);
productRouter.post("/related", relatedProducts);
productRouter.patch(
  "/update/:productId",
  adminAuth(["admin", "super-admin"]),
  upload.any(), // робить масив з файлів,
  updateProduct
);
productRouter.get("/all-products", getAllProducts);
productRouter.get("/price-list/pdf", generatePriceListPdf);
productRouter.get("/price-list/excel", generatePriceListExcel);

export default productRouter;
