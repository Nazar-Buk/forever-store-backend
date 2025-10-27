import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

import userModel from "../models/userModel.js";

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
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

        ////// Start Для проду
        secure: process.env.NODE_ENV === "production", // тільки по HTTPS у проді
        sameSite: "none",
        ////// End Для проду

        ////// Start Для локалки
        // secure: false,
        // sameSite: "strict",
        ////// End Для Локалки

        // sameSite: "Strict", // захист від CSRF
        maxAge: 7 * 24 * 60 * 60 * 1000, // кука буде жити 7 днів
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
      ////// Start Для проду
      secure: process.env.NODE_ENV === "production", // 🔐 лише для продакшну
      sameSite: "none",
      ////// End Для проду

      ////// Start Для Локалки
      // secure: false,
      // sameSite: "strict",
      ////// End Для Локалки

      // sameSite: "strict",
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
      name: user.name,
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

// get users
const getUsers = async (req, res) => {
  try {
    const users = await userModel.find().select("-password");

    res.status(200).json({ success: true, users });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: error.message });
  }
};

// update user role
const updateUserRole = async (req, res) => {
  try {
    const { newRole } = req.body;
    const { id } = req.params;

    if (!newRole || !id) {
      return res
        .status(400)
        .json({ success: false, message: "'newRole' or 'id' are absent!" });
    }

    const updatedUser = await userModel
      .findByIdAndUpdate(id, { role: newRole }, { new: true })
      .select("-password");

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "Користувача не знайдено!" });
    }

    res.status(200).json({
      success: true,
      updatedUser,
      message: "Роль користувача оновлено!",
    });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: error.message });
  }
};

// delete user
const removeUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await userModel.findByIdAndDelete(id);

    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: "Користувача не знайдено!" });
    }

    res.status(200).json({
      success: true,
      deletedUserId: id,
      message: "Користувача успішно видалено!",
    });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: error.message });
  }
};

// update user
const updateUserData = async (req, res) => {
  try {
    const userId = req.user._id; // користувач підставляється з verifyUser

    const { name, oldPassword, newPassword } = req.body;

    const user = await userModel.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Користувача не знайдено!" });
    }

    //  Оновлення імені
    if (name) {
      user.name = name;
    }

    // 🟨 Зміна паролю
    if (oldPassword && newPassword) {
      const isMatch = await bcrypt.compare(oldPassword, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ success: false, message: "Старий пароль невірний!" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: "Новий пароль має бути мінімум 8 символів!",
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Дані успішно оновлено!",
      updatedUser: { name: user.name, email: user.email },
    });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(404)
        .json({ success: false, message: "Потрібен Email!" });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Користувача з таким email не знайдено!",
      });
    }

    // Генеруємо токен
    const token = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + 15 * 60 * 1000; // 15 хвилин

    // Зберігаємо токен та термін дії у користувача
    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await user.save();

    // Налаштування Nodemailer для NIC.UA SMTP
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        // це логін та пароль від поштової скриньки
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // tls: { rejectUnauthorized: false }, // <- додати сюди для тесту, не знаю чи воно треба для локалки
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: `"Buk Sklad" ${process.env.SMTP_USER} `,
      to: user.email,
      subject: "Відновлення пароля",
      html: `<p>Щоб скинути пароль, перейдіть за посиланням нижче. Посилання дійсне 15 хвилин:</p>
      <a href="${resetUrl}">${resetUrl}</a>`,
    });

    res.status(200).json({
      success: true,
      message: "Лист для відновлення пароля відправлено на вашу пошту!",
    });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Перевірка нового пароля
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Потрібен токен!",
      });
    }

    // Перевірка нового пароля
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Новий пароль обовʼязковий і має бути мінімум 8 символів",
      });
    }

    const user = await userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // токен ще дійсний
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Токен недійсний або прострочений!",
      });
    }

    // Хешування нового пароля
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Очищення токена
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ success: true, message: "Пароль успішно змінено!" });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  loginUser,
  registerUser,
  logoutUser,
  checkAuth,
  getUsers,
  updateUserRole,
  removeUser,
  updateUserData,
  forgotPassword,
  resetPassword,
};
