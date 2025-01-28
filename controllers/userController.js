import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import userModel from "../models/userModel.js";

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

// Route for user login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User does not exist!" });
    }

    const isMatch = await bcrypt.compare(password, user.password); // порівнюємо паролі

    if (isMatch) {
      const token = createToken(user._id);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials!" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Route for user registration
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // перевіряємо чи користувач вже існує
    const exists = await userModel.findOne({ email });

    if (exists) {
      return res.json({ success: false, message: "User already exists!" });
    }

    //перевірка емейлу та чи пароль надійний
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please, enter a valid email!",
      });
    }

    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please, enter a strong password!",
      });
    }

    // хешуємо пароль
    const salt = await bcrypt.genSalt(10); // можна ставити від 5 до 15
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
    });

    const user = await newUser.save(); // зберігаємо користувача в базу даних

    const token = createToken(user._id); // створюємо токен для користувача

    res.json({ success: true, token });

    // Ось як працює цей код із бібліотекою bcrypt:

    // Що таке bcrypt?
    // bcrypt — це бібліотека для хешування паролів. Вона дозволяє безпечно зберігати паролі, використовуючи процеси хешування та сольового хешування (salted hashing). Її алгоритм вважається одним із найбільш надійних.

    // 1. Генерація солі
    // javascript
    // Копіювати
    // Редагувати
    // const salt = await bcrypt.genSalt(10);
    // Що таке "сіль" (salt)?
    // Сіль — це випадковий рядок, який додається до пароля перед хешуванням.
    // Мета: Захист від атак типу rainbow table. Навіть якщо два користувачі мають однакові паролі, їх хеші будуть різними завдяки солі.
    // Як це працює:
    // bcrypt.genSalt(rounds) генерує сіль.
    // rounds — це кількість "циклів обчислення" для генерації солі.
    // Чим більше число, тим надійніше, але тим довше триває процес.
    // Рекомендовано використовувати значення від 10 до 12.
    // Менше 10 — швидше, але менш безпечно.
    // Більше 12 — безпечніше, але значно повільніше.
    // Приклад:
    // Якщо rounds = 10, генерування солі займе більше часу, ніж при rounds = 5. Це створює додаткові складнощі для хакерів.
  } catch (error) {
    console.log(error, "Error in user registration");
    res.json({ success: false, message: error.message });
  }
};

// Route for admin login
const adminLogin = async (req, res) => {};

export { loginUser, registerUser, adminLogin };
