import cartModel from "../models/cartModel.js";
import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";

const createOrder = async (req, res) => {
  try {
    const userId = req.user._id; // беремо користувача із токена або гість
    const { shippingAddress } = req.body;

    if (!shippingAddress) {
      return res
        .status(400)
        .json({ success: false, message: "Адреса доставки обов’язкова" });
    }

    const cart = await cartModel
      .findOne({ userId })
      .populate("items.productId");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Корзина порожня, додайте товари перед оформленням замовлення",
      });
    }

    const orderItems = cart.items.map((item) => ({
      product: item.productId._id,
      quantity: item.quantity,
      size: item.size,
      priceAtAdd: item.productId.price,
    }));

    // Розрахунок загальної суми
    const totalPrice = orderItems.reduce(
      (acc, item) => acc + item.quantity * item.priceAtAdd,
      0
    );

    const newOrder = await orderModel.create({
      user: userId,
      items: orderItems,
      shippingAddress,
      paymentMethod: "cash",
      totalPrice,
      status: "pending",
    });

    // очищаємо корзину після оформлення
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    res.status(201).json({
      success: true,
      order: newOrder,
      message: "Замовлення успішно створене",
    });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: error.message });
  }
};

const createGuestOrder = async (req, res) => {
  try {
    const { shippingAddress, items } = req.body;

    // Так, у полі items ордера повинні зберігатися:
    // product → _id продукту (ObjectId з колекції product)
    // quantity → кількість одиниць товару
    // size → розмір товару (якщо є)
    // priceAtAdd → ціна на момент додавання

    if (!shippingAddress) {
      return res
        .status(400)
        .json({ success: false, message: "Адреса доставки обов’язкова" });
    }

    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Корзина порожня" });
    }

    const orderItems = await Promise.all(
      items.map(async (item) => {
        const product = await productModel.findById(item.productId);

        if (!product) {
          throw new Error(`Товар з id ${item.productId} не знайдено`);
        }

        return {
          product: product._id,
          quantity: item.quantity,
          size: item.size || "nosize",
          priceAtAdd: product.price,
        };
      })
    );

    const totalPrice = orderItems.reduce(
      (acc, item) => acc + item.quantity * item.priceAtAdd,
      0
    );

    const newOrder = await orderModel.create({
      user: null, // гість
      items: orderItems,
      shippingAddress,
      paymentMethod: "cash",
      totalPrice,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      order: newOrder,
      message: "Замовлення успішно створене !",
    });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id; // беремо користувача із токена

    const orders = await orderModel
      .find({ user: userId })
      .populate("items.product") // підтягуємо дані продуктів
      .sort({ createdAt: -1 }) // новіші замовлення зверху
      .lean();

    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: error.message });
  }
};

//Отримуємо всі ордери
const getAllOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find()
      .populate("user") // підтягуємо дані користувача, якщо він є
      .populate("items.product") // підтягуємо дані продуктів
      .sort({ createdAt: -1 }) // новіші зверху
      .lean();

    res.status(200).json({ success: false, orders });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: error.message });
  }
};

// оновлюємо статус
const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    if (!orderId || !status) {
      return res
        .status(400)
        .json({ success: false, message: "Необхідні поля: orderId і status" });
    }

    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Замовлення не знайдено" });
    }

    res.status(200).json({
      success: true,
      message: "Статус замовлення оновлено",
      order: updatedOrder,
    });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res
        .status(400)
        .json({ success: false, message: "Не вказано id замовлення" });
    }

    const deletedOrder = await orderModel.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Замовлення не знайдено" });
    }

    res.status(200).json({ success: true, message: "Замовлення видалено" });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  createOrder,
  createGuestOrder,
  getUserOrders,
  getAllOrders,
  updateStatus,
  deleteOrder,
};
