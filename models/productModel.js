import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    // images: { type: Array, required: true },
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
    category: { type: String, required: true },
    subCategory: { type: String, required: true },
    sizes: { type: Array, required: true },
    bestseller: { type: Boolean },
  },
  { timestamps: true }
);

const productModel =
  mongoose.models.product || mongoose.model("product", productSchema);
//   Що таке модель?

// Модель — це обгортка для роботи з колекцією у MongoDB.
// Наприклад, якщо у вас є модель productModel, вона відповідає колекції products у базі даних.
// Що відбувається тут:

// mongoose.models.product: Перевіряється, чи вже існує модель product. Це корисно, щоб уникнути повторного створення моделі (помилки).
// mongoose.model("product", productSchema): Якщо моделі ще немає, створюється нова модель з ім'ям product і схемою productSchema.

export default productModel;

// щоб дата створення і оновлення продукту додавалися автоматично
// const productSchema = new mongoose.Schema({
//   name: String,
//   bestseller: Boolean,
//   // інші поля
// }, { timestamps: true }); // автоматично додається createdAt і updatedAt
