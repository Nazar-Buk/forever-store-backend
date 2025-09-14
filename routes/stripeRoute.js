import express from "express";
import Stripe from "stripe";

const useRouter = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const YOUR_DOMAIN = process.env.FRONTEND_URL;

useRouter.post("/create-checkout-session", async (req, res) => {
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

useRouter.get("/session-status", async (req, res) => {
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

export default useRouter;
