import express from "express";
import crypto from "crypto";

const useRouter = express.Router();

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
useRouter.post("/liqpay/embedded-pay", (req, res) => {
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

useRouter.post("/liqpay/callback", (req, res) => {
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

export default useRouter;
