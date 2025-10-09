import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

// окрема функція перевірки
const verifyUserRole = async (req, allowedRoles) => {
  const token = req.cookies.token;

  if (!token) {
    throw { status: 401, message: "Неавторизовано!" }; // тут треба throw, бо res тут нема
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await userModel.findById(decoded.id);

  if (!user) {
    throw { status: 401, message: "Користувача не знайдено!" };
  }

  if (!allowedRoles.includes(user.role)) {
    throw { status: 403, message: "Доступ заборонено!" };
  }

  return user; // повертаємо користувача для middleware
};

// middleware, яке буде експортуватися

const adminAuth = (allowedRoles = ["admin", "super-admin"]) => {
  return async (req, res, next) => {
    try {
      const user = await verifyUserRole(req, allowedRoles);
      req.user = user; // req.user = user; записує цього користувача в req. щоб ми могли в подальшому використовувати
      // дані із req
      // Наступний middleware або маршрут у стеку (next()) може доступитися до користувача через req.user без повторної
      // перевірки токена.
      next();
      //   next(); // Виклик next() означає: "Ця middleware завершила свою роботу, передай управління наступному коду в стеку обробки".
      //   // Якщо next() не викликати, обробка запиту "зависне", і сервер не відповість клієнту.
    } catch (error) {
      console.log(error, "error");

      res.status(error.status || 401).json({
        success: false,
        message: error.message,
      });
    }
  };
};

export default adminAuth;
