import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

const verifyUser = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Не авторизовано!" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Користувача не знайдено!" });
    }

    req.user = user; // підставляємо користувача у req
    next(); // // передаємо керування контролеру
  } catch (error) {
    console.log(error, "error");
    res.status(401).json({ success: false, message: error.message });
  }
};

export default verifyUser;
