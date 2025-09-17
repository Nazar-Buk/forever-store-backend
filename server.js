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

import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRoute.js";
import categoryRouter from "./routes/categoryRoute.js";
import stripeRoute from "./routes/stripeRoute.js";
import liqpayRoute from "./routes/liqpayRoute.js";
import tgBotRoute from "./routes/tgBotRoute.js";

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
app.use("/", liqpayRoute); // '/' -- поставив просто стлеш бо не хотів переробляти шляхи на фронті, хоча це не важко (щось таке можна додати сюди і на фронт /api/liqpay)
app.use("/api/tg-bot", tgBotRoute);

app.get("/", (req, res) => {
  res.send("API Working"); // покажеться на екрані, якщо зайти на http://localhost:4000/
});

app.listen(port, () => console.log("Server started on port : " + port));
