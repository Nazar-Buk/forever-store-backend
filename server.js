/////////////////////////////////////
//////// npm init
//////// npm i cors dotenv express jsonwebtoken mongoose multer nodemon razorpay stripe validator cloudinary bcrypt
////////
//////// http://localhost:4000/api/user/login
/////////////////////////////////////

import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser"; // Для роботи з cookie
import helmet from "helmet"; // Захист від базових атак
import rateLimit from "express-rate-limit"; // Захист від спаму
import crypto from "crypto";

import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRoute.js";
import categoryRouter from "./routes/categoryRoute.js";
import stripeRoute from "./routes/stripeRoute.js";

const allowOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://forever-store-mzej.onrender.com",
  "https://buk-com.pp.ua",
  "https://forever-admin-frontend.onrender.com",
  "http://localhost:3000",
];

// App config
const app = express();
const port = process.env.PORT || 4000;
connectDB(); // підключив базу даних, код до неї є в config/mongodb.js
connectCloudinary(); // підключив cloudinary, код до неї є в config/cloudinary.js

// Middlewares
app.use(express.json());

// app.use(cors()); //  так було у відео
// app.use(cors({ origin: "http://localhost:4000", credentials: true })); // Дозволяємо запити з фронтенду
app.use(
  cors({
    origin: function (origin, callback) {
      // Якщо запит не має origin (наприклад, з Postman), дозволити
      if (!origin) return callback(null, true);
      // origin: function (...) — дозволяє вручну перевіряти, чи походить запит з дозволеного джерела.

      // Увага!!!
      // credentials: 'include', // без цього куки не підуть  це треба додати на фронт,
      // СТАВ ЦЕ ТОДІ КОЛИ :
      //  Запити, що потребують аутентифікації / авторизації
      // Наприклад, login, logout, profile, orders, user/settings — будь-які, де сервер очікує куки з токеном.

      // Запити, де сервер повертає куки
      // Наприклад, реєстрація користувача, логін, або оновлення сесії.

      if (allowOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // credentials: true — потрібен, якщо ти використовуєш res.cookie(...) і хочеш, щоб куки передавалися між фронтом і бекендом.
  })
);

app.use(helmet()); // Безпека
app.use(cookieParser()); // Читання cookie
app.use(rateLimit({ windowMs: 15 * 60 * 100, max: 100 })); // Обмеження 100 запитів за 15 хв

//API Endpoints
app.use("/api/user", userRouter); // /api/user/register,   /api/user/login,  /api/user/admin
app.use("/api/product", productRouter);
app.use("/api/category", categoryRouter);
app.use("/", stripeRoute); // '/' -- поставив просто стлеш бо не хотів переробляти шляхи на фронті, хоча це не важко (щось таке можна додати сюди і на фронт /api/stripe)

/// Start LiqPay /////

const liqPayPublicKey = process.env.LIQPAY_PUBLIC_KEY;
const liqPayPrivateKey = process.env.LIQPAY_PRIVATE_KEY;
const frontendUrl = process.env.FRONTEND_URL;

// Функція для генерації payload і підпису LiqPay
const generateLiqPaySignature = (data) => {
  const json = Buffer.from(JSON.stringify(data)).toString("base64");
  const signature = crypto
    .createHash("sha1")
    .update(liqPayPrivateKey + json + liqPayPrivateKey)
    .digest("base64");
  return { data: json, signature };
};

// === Embedded Checkout === // Дозволяє відкрити форму на клієнті
app.post("/liqpay/embedded-pay", (req, res) => {
  try {
    const { amount, description, order_id } = req.body;

    if (!amount || !description || !order_id) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const paymentData = {
      public_key: liqPayPublicKey,
      version: "3",
      action: "pay",
      amount,
      currency: "UAH",
      description,
      order_id,
      sandbox: 1, // тестовий режим
      paytypes: "card,liqpay,applepay,googlepay",
      result_url: `${frontendUrl}/thank-you`,
    };

    const result = generateLiqPaySignature(paymentData);
    res.status(200).json(result);
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: error.message });
  }
});

// === Callback від LiqPay (серверна перевірка) ===
// //На фронті запит робити не треба, callback йде напряму від LiqPay на бек.

app.post("/liqpay/callback", (req, res) => {
  try {
    const { data, signature } = req.body;

    if (!data || !signature) {
      return res
        .status(400)
        .json({ success: false, message: "Missing data or signature" });
    }

    // Перевірка підпису
    const checkSignature = crypto
      .createHash("sha1")
      .update(liqPayPrivateKey + data + liqPayPrivateKey)
      .digest("base64");

    if (signature === checkSignature) {
      const decoded = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
      console.log(decoded, "LiqPay callback success");

      // Тут можна оновити статус замовлення у базі
      res.status(200).json({ success: true, message: "OK" });
    } else {
      console.log("LiqPay callback signature mismatch!");
      res.status(400).json({ success: false, message: "Bad signature" });
    }
  } catch (error) {
    console.log(error, "Callback error");
    res.status(500).json({ success: false, message: error.message });
  }
});

/// End LiqPay /////

app.get("/", (req, res) => {
  res.send("API Working"); // покажеться на екрані, якщо зайти на http://localhost:4000/
});

app.listen(port, () => console.log("Server started on port : " + port));
