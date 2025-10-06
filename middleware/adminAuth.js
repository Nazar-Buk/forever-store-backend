import jwt from "jsonwebtoken";

const adminAuth = async (req, res, next) => {
  try {
    const { token } = req.headers;

    if (!token) {
      return res.json({
        success: false,
        message: "Сесію завершено, увійдіть знову!",
      });
    }

    const token_decode = jwt.verify(token, process.env.JWT_SECRET); // розкодовую токен

    if (token_decode !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
      return res.json({
        success: false,
        message: "Сесію завершено, увійдіть знову!",
      });
    }

    next(); // Виклик next() означає: "Ця middleware завершила свою роботу, передай управління наступному коду в стеку обробки".
    // Якщо next() не викликати, обробка запиту "зависне", і сервер не відповість клієнту.
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export default adminAuth;
