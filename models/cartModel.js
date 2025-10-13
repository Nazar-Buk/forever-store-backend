import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  // Ідентифікатор продукту (зв’язок із колекцією Product)
  productId: {
    type: mongoose.Schema.Types.ObjectId, // // це поле (productId) має бути ObjectId, тобто зберігати посилання на _id з іншої колекції (у нашому випадку — з products)
    ref: "product", // посилання на модель product
    required: true,
  },
  // Кількість одиниць цього товару в корзині
  quantity: {
    type: Number,
    required: true,
    min: 1, // мінімум 1 товар
    default: 1, // default — це значення, яке автоматично присвоюється полю, якщо користувач його не вказав.
  },
  size: {
    type: String,
    default: null, // якщо товар без розміру
  },
  // Ціна товару на момент додавання (щоб не залежала від майбутніх змін ціни) ТАК ТРЕБА РОБИТИ
  priceAtAdd: {
    type: Number,
    required: true,
  },
});

const cartSchema = new mongoose.Schema(
  {
    // Ідентифікатор користувача (якщо користувач залогінений)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user", // посилання на модель user
    },

    // Масив товарів у корзині
    items: [cartItemSchema],
    // Загальна сума корзини
    totalPrice: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const cartModel = mongoose.models.cart || mongoose.model("cart", cartSchema);

export default cartModel;
