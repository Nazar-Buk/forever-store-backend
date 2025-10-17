import productModel from "../models/productModel.js";
import cartModel from "../models/cartModel.js";

const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity = 1, size = "nosize" } = req.body;

    const product = await productModel.findById(productId);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Товар не знайдено!" });
    }

    // Шукаємо корзину користувача
    // { userId } → скорочений запис { userId: userId }
    let cart = await cartModel.findOne({ userId: userId }); // шукаємо по полю userId, воно є в моделі cartModel

    // Якщо корзини ще немає, створюємо нову
    if (!cart) {
      cart = new cartModel({ userId, items: [] });
    }

    // Перевіряємо, чи вже є такий товар у корзині з тим самим розміром, якщо товар немає розміру то буде 'nosize' === 'nosize'
    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId && item.size === size
    );

    if (existingItem) {
      // якщо товар вже є то збільшуємо кількість
      existingItem.quantity += quantity;
    } else {
      // Інакше додаємо новий товар до масиву items
      cart.items.push({
        productId,
        quantity,
        size,
        priceAtAdd: product.price, // Ціна на момент додавання
      });
    }

    await cart.save();

    res
      .status(200)
      .json({ success: true, cart, message: "Продукт успішно доданий!" });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCartData = async (req, res) => {
  try {
    const userId = req.user._id;

    // Знаходимо корзину користувача
    let cart = await cartModel
      .findOne({ userId })
      .populate("items.productId")
      .lean(); // ← повертає вже plain-об'єкт; це мені треба
    // populate("items.productId") – (заселити туди дані із іншої колекції, як людей в будинок) щоб повернути повну інформацію про продукт (назва, ціна, фото) разом із items.
    // тобто в ключ productId я запхаю всі дані (наспраді це силка на продукт, але на фронті ми отрмаємо ці дані) про продукт в котрого ІД ==> productId

    if (!cart) {
      return res
        .status(200)
        .json({ success: true, cart: { items: [], totalPrice: 0 } });
    }

    // Підрахунок загальної суми
    let totalPrice = 0;
    cart.items.forEach((item) => {
      totalPrice += item.priceAtAdd * item.quantity;
    });

    // Оновлюємо totalPrice в документі (не обов'язково зберігати у базі)
    cart.totalPrice = totalPrice;

    // переробляю під нормальний формат, бо populate("items.productId") запхав ключ productId дані про продукт, а це плутає
    cart.items = cart.items.map((item) => {
      const { productId, ...rest } = item;

      return {
        ...rest,
        product: item.productId,
      };
    });

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, size = "nosize", quantity } = req.body;
    // quantity: якщо 0 або менше — видалити товар, інакше — оновити кількість

    const cart = await cartModel.findOne({ userId });

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Корзина не знайдена!" });
    }

    // Знаходимо індекс елемента по productId та size,  itemIndex нам треба бо може бути 2 товари з однаковим ід але розміри інші, ти то сам вшарив
    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId && item.size === size
    );

    if (itemIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Товар у корзині не знайдено!" });
    }

    if (quantity <= 0) {
      // Якщо quantity 0 або менше — видаляємо товар, а я її присилай з беку
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();

    res.status(200).json({ success: true, cart });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: error.message });
  }
};

const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await cartModel.findOne({ userId });

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Корзина не знайдена!" });
    }

    cart.items = [];
    cart.totalPrice = 0;

    await cart.save();

    res.status(200).json({ success: true, cart });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: error.message });
  }
};

const editCartProduct = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, oldSize, newSize } = req.body;

    if (!oldSize || !newSize) {
      return res.status(400).json({
        success: false,
        message: "Цей товар немає розміру або новий розмір не вказано!",
      });
    }

    const cart = await cartModel.findOne({ userId });

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Корзина не знайдена!" });
    }

    // Знаходимо індекс старого товару
    const oldItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId && item.size === oldSize
    );

    if (oldItemIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Товар у корзині не знайдено!" });
    }

    // Оновлюємо розмір
    cart.items[oldItemIndex].size = newSize;

    //  Перевіряємо, чи тепер не з’явився дублікат (інший такий самий товар)
    const allSameItems = cart.items.filter(
      (item) => item.productId.toString() === productId && item.size === newSize
    );

    if (allSameItems.length > 1) {
      // Якщо є дублікати — об'єднуємо їх у перший елемент
      const totalQty = allSameItems.reduce((acc, curr) => {
        return acc + curr.quantity;
      }, 0);

      // Беремо дані з першого товару, кількість оновлюємо
      const mergedItem = { ...allSameItems[0], quantity: totalQty };

      // Прибираємо дублікати і додаємо об'єднаний елемент
      cart.items = [
        ...cart.items.filter(
          (item) =>
            // ! (знак заперечення), тобто беремо усі елементи, які не відповідають цій умові.
            !(item.productId.toString() === productId && item.size === newSize)
        ),
        mergedItem,
      ];
    }

    await cart.save();

    res.status(200).json({ success: true, cart });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: error.message });
  }
};

export { addToCart, getCartData, updateCartItem, clearCart, editCartProduct };
