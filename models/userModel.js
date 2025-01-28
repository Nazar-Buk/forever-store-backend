import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }, // unique: true -- не дозволить зробити ще один акаунт з таким же email
    password: { type: String, required: true },
    cartData: { type: Object, default: {} }, // default: {} — якщо значення не надається, за замовчуванням буде порожній об'єкт
  },
  { minimize: false }
);

// Що таке minimize?
// minimize визначає, чи видаляються порожні об'єкти з документа перед збереженням у базу даних.
// Значення:
// true (за замовчуванням):

// Порожні об'єкти ({}) видаляються з документа.
//
// Якщо minimize: true, це поле буде видалено перед збереженням у базу даних.

///////
// false:

// Порожні об'єкти залишаються в документі.
// Навіть якщо cartData порожнє, воно буде збережене як {} у базу даних.

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
