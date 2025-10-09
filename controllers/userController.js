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
      return res
        .status(404)
        .json({ success: false, message: "Користувач не існує!" });
    }

    const isMatch = await bcrypt.compare(password, user.password); // порівнюємо паролі

    if (isMatch) {
      const token = createToken(user._id);

      res.cookie("token", token, {
        httpOnly: true, // Забороняє доступ до куки з JavaScript (XSS захист)
        secure: process.env.NODE_ENV === "production", // тільки по HTTPS у проді
        sameSite: "Strict", // захист від CSRF
        // maxAge: 7 * 24 * 60 * 60 * 1000, // кука буде жити 7 днів
      });
      res.status(200).json({ success: true, token });
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Неправильний логін або пароль!" });
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
      return res.json({
        success: false,
        message: "Такий користувач вже існує!",
      });
    }

    //перевірка емейлу та чи пароль надійний
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Будь ласка напишіть правильний емейл!",
      });
    }

    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Будь ласка, створіть надійний пароль!",
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

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // 🔐 лише для продакшну
      sameSite: "strict",
    }); // { httpOnly: true } — опція, яка каже браузеру: "цю куку не можна читати через JavaScript".

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

// LogOut

const logoutUser = async (req, res) => {
  try {
    res.cookie("token", "", {
      httpOnly: true, // токен доступний лише на бекенді (безпечніше)
      expires: new Date(0), // встановлюємо дату в минуле — кука автоматично видалиться
    });

    res.json({
      success: true,
      message: "Ви успішно вийшли з облікового запису",
    });
  } catch (error) {
    console.log(error, "error Logout");
    res.status(500).json({
      success: false,
      message: "Logout failed. Please try again later.",
    });
  }
};

const checkAuth = async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      isAuthenticated: false,
      message: "Неавторизовано!",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        isAuthenticated: false,
        message: "Користувача не знайдено!",
      });
    }

    return res.status(200).json({
      success: true,
      isAuthenticated: true,
      userId: decoded.id,
      role: user.role,
    });
  } catch (error) {
    console.log(error, "error");
    return res.status(401).json({
      success: false,
      isAuthenticated: false,
      message: "Не вдалося виконати вхід",
    });
  }
};

export { loginUser, registerUser, logoutUser, checkAuth };
