import express from "express";
import axios from "axios";

const useRouter = express.Router();

// ЛОКАЛЬНІ ЛІНКИ не показуються на телеграмі
const BOT_TOKEN = process.env.TG_BOT_TOKEN;
const CHAT_ID = process.env.TG_CHAT_ID;

// === Ендпоінт для прийому форми ===
useRouter.post("/send-tg-form", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      street,
      city,
      state,
      zipCode,
      country,
      phone,
      orderId,
      productsData,
      price,
    } = req.body;

    const countryState = state || "Пусто";

    if (
      !firstName ||
      !lastName ||
      !email ||
      !street ||
      !city ||
      !zipCode ||
      !country ||
      !phone ||
      !orderId ||
      !productsData ||
      !price
    ) {
      return res.status(400).json({
        success: false,
        message:
          "These values are required: firstName, lastName, email, street, city, zipCode, country, phone",
      });
    }

    const productList = productsData
      .map((product, ind) => {
        console.log(product, "product");
        return `${ind + 1}. <a href="${product.link}">${product.name}</a>
        <b>Кількість:</b> ${product.quantity}
      `;
      })
      .join("\n");

    const text = `
📩 <b>Нова заявка з сайту: BUK SKLAD</b>

👤 <b>Номер замовлення :</b> №${orderId} 
👤 <b>Посилання на товар:</b> ${productList}
👤 <b>Ціна замовлення:</b> ${price}$
👤 <b>Посилання на замовлення:</b> Пізніше зроблю
👤 <b>Ім'я:</b> ${firstName} ${lastName}
📧 <b>Email:</b> ${email}
🏠 <b>Адреса:</b> 
--- Вул: ${street},
--- Місто: ${city},
--- Штат: ${countryState},
--- Поштовий Індекс: ${zipCode},
--- Країна: ${country}
📞 <b>Телефон:</b> ${phone}

`;

    console.log(text, "text");

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
      res
        .status(200)
        .json({ success: true, message: "Form was sent to Telegram" });
    } else {
      res.status(500).json({ success: false, error: "Form was not sended !" });
    }
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    res
      .status(500)
      .json({ success: false, message: error.response?.data || error.message });
  }
});

export default useRouter;
