/////////////////////////////////////
//////// npm init
//////// npm i cors dotenv express jsonwebtoken mongoose multer nodemon razorpay stripe validator cloudinary bcrypt
////////
/////////////////////////////////////

import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";

// App config
const app = express();
const port = process.env.PORT || 4000;
connectDB(); // підключив базу даних, код до неї є в config/mongodb.js
connectCloudinary(); // підключив cloudinary, код до неї є в config/cloudinary.js

// Middlewares
app.use(express.json());
app.use(cors());

//API Endpoints
app.get("/", (req, res) => {
  res.send("API Working");
});

app.listen(port, () => console.log("Server started on port : " + port));
