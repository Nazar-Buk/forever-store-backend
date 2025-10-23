import express from "express";

import {
  addToCart,
  getCartData,
  updateCartItem,
  clearCart,
  editCartProduct,
  checkExistProducts,
} from "../controllers/cartController.js";
import verifyUser from "../middleware/userAuth.js";

const cartRouter = express.Router();

//verifyUser це дял того щоб ми знали що користувач є і хто він і його токен в кукісах
cartRouter.post("/add", verifyUser, addToCart);
cartRouter.get("/list", verifyUser, getCartData);
cartRouter.patch("/update", verifyUser, updateCartItem);
cartRouter.delete("/clear", verifyUser, clearCart);
cartRouter.patch("/edit", verifyUser, editCartProduct);
cartRouter.post("/check-exist", checkExistProducts);

export default cartRouter;
