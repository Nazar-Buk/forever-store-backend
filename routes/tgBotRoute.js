import express from "express";
import axios from "axios";

import orderModel from "../models/orderModel.js";
const frontendUrl = process.env.FRONTEND_URL;

const useRouter = express.Router();

// ЛОКАЛЬНІ ЛІНКИ не показуються на телеграмі
const BOT_TOKEN = process.env.TG_BOT_TOKEN;
const CHAT_ID = process.env.TG_CHAT_ID;

// === Ендпоінт для прийому форми ===
useRouter.post("/send-tg-form", async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res
        .status(400)
        .json({ success: false, message: "orderId required" });
    }

    const order = await orderModel
      .findById(orderId)
      .populate("items.product")
      .populate({ path: "user", select: "-password -email" }) // select: "-password -email" — виключає ці поля з результату.
      .lean();

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Замовлення не знайдено!" });
    }

    const productList = order.items
      .map((item, ind) => {
        return `${ind + 1}. <a href="${frontendUrl}/product/${
          item.product._id
        }">${item.product.name}</a>
      <b>Кількість:</b> ${item.quantity}
      <b>Розмір:</b> ${item.size === "nosize" ? "Без розміру" : item.size}
      `;
      })
      .join("\n");

    const {
      totalPrice,
      shippingAddress: {
        firstName,
        lastName,
        phone,
        city,
        region,
        postName,
        postBranchName,
      },
    } = order;

    const text = `
    📩 <b>Нова заявка з сайту: BUK SKLAD</b>

    👤 <b>Номер замовлення №:</b> ${orderId}
    👤 <b>Посилання на товар:</b> ${productList}
    👤 <b>Ціна замовлення:</b> ${totalPrice}грн
    👤 <b>Ім'я:</b> ${firstName} ${lastName}
    🏠 <b>Адреса:</b>
    --- Назва Пошти: ${postName.optionLabel},
    --- Область: ${region}
    --- Населений пункт: ${city},
    --- Відділення №: ${postBranchName},
    📞 <b>Телефон:</b> ${phone}
    `;

    // Відправка повідомлення у Telegram
    const response = await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        chat_id: CHAT_ID,
        text,
        parse_mode: "HTML",
      }
    );

    // response.data.ok === true, якщо Telegram прийняв повідомлення
    if (response.data.ok) {
      res.status(200).json({
        success: true,
        message: "Замовлення створено, наш менеджер вам зателефонує !",
      });
    } else {
      res
        .status(500)
        .json({ success: false, error: "Форму не відправлено в ТГ!" });
    }
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    res
      .status(500)
      .json({ success: false, message: error.response?.data || error.message });
  }
});

export default useRouter;
