import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId, // зберігаємо _id користувача
      ref: "user", // посилання на колекцію користувачів
    },
    // Масив товарів у замовленні
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId, // зберігаємо _id продукту
          ref: "product", // посилання на колекцію продуктів
          required: true,
        },
        quantity: {
          type: Number, // кількість одиниць товару
          required: true,
          min: 1,
        },
        size: {
          type: String, // розмір товару (якщо є)
          default: "nosize",
        },
        priceAtAdd: {
          type: Number, // ціна на момент додавання із корзини
          required: true,
        },
      },
    ],

    shippingAddress: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      phone: { type: String, required: true },
      postName: {
        optionLabel: { type: String, required: true },
        optionValue: { type: String, required: true },
      },
      region: { type: String, required: true },
      city: { type: String, required: true },
      postBranchName: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      enum: ["cash"],
      default: "cash",
    },
    totalPrice: {
      type: Number, // обчислюється на бекенді із корзини
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "shipped", "delivered", "cancelled"], // життєвий цикл замовлення]
      default: "pending",
    },
  },
  { timestamps: true }
);

const orderModel =
  mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;
