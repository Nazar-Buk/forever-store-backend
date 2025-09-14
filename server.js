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
import Stripe from "stripe";

import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRoute.js";
import categoryRouter from "./routes/categoryRoute.js";

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

// Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const YOUR_DOMAIN = process.env.FRONTEND_URL;

app.post("/create-checkout-session", async (req, res) => {
  try {
    // const { cart, email } = req.body;
    const { cart } = req.body;

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      mode: "payment",
      // customer_email: email,
      line_items: cart.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : [],
          },
          unit_amount: item.price * 100, // ціна в центах
        },
        quantity: item.quantity,
      })),
      return_url: `${YOUR_DOMAIN}/return?session_id={CHECKOUT_SESSION_ID}`,
    });

    res.status(200).json({
      success: true,
      clientSecret: session.client_secret,
      url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/session-status", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(
      req.query.session_id // потім з фронта витягне із адресної строки цей session_id
    );

    res.json({
      success: true,
      status: session.status,
      email: session.customer_email,
    });
  } catch (error) {
    console.log(error, "error");
    res.json({ success: false, message: error.message });
  }
});

///// End Stripe///////

app.get("/", (req, res) => {
  res.send("API Working"); // покажеться на екрані, якщо зайти на http://localhost:4000/
});

app.listen(port, () => console.log("Server started on port : " + port));
