import mongoose from "mongoose";

const subCategorySchema = new mongoose.Schema(
  {
    subCategoryLabel: {
      type: String,
      required: true,
      trim: true,
    },

    subCategoryValue: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false } // не створює окремий _id для кожної підкатегорії
);

const categorySchema = new mongoose.Schema(
  {
    categoryLabel: {
      type: String,
      required: true,
      unique: true, // unique значення має бути унікальним, тобто не може бути двох категорій з однаковим label.
      trim: true, // trim прибирає зайві пробіли на початку та в кінці рядка (наприклад, " одяг " стане "одяг").
    },

    categoryValue: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    subCategory: [subCategorySchema],
  },
  { timestamps: true }
);

const categoryModel =
  mongoose.models.category || mongoose.model("category", categorySchema);

//   Що таке модель?

// Модель — це обгортка для роботи з колекцією у MongoDB.
// Наприклад, якщо у вас є модель categoryModel, вона відповідає колекції products у базі даних.
// Що відбувається тут:

// mongoose.models.category: Перевіряється, чи вже існує модель category. Це корисно, щоб уникнути повторного створення моделі (помилки).
// mongoose.model("category", productSchema): Якщо моделі ще немає, створюється нова модель з ім'ям category і схемою productSchema.

export default categoryModel;
