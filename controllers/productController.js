// Multer — це бібліотека для Node.js, яка використовується для обробки файлів, завантажених на сервер.
// Вона зазвичай використовується разом із фреймворком Express.js, щоб легко працювати з формами,
// які містять файли (наприклад, зображення чи документи).

import { v2 as cloudinary } from "cloudinary";
import productModel from "../models/productModel.js"; // .js то піздєц як важливо!!! інакше не розуміє що за файд, то тобі не реакт))

// func for add product
const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      bestseller,
    } = req.body;

    const images = req.files;

    let imagesData = await Promise.all(
      images.map(async (item) => {
        let result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
          folder: "productsForever", // папка де зберігаються фотки на cloudinary
        }); // item.path --  бо консоль лог мені показує об'єкт в котрому є ключ path, цей об'єкт і є наша завантажена картинка
        // cloudinary отримає шлях до картинки і закине цю картинку в хмарку

        // return (await result).secure_url; // без цього не працюватиме
        // return result.secure_url; // це шляпа, так не працює

        return {
          url: result.secure_url,
          public_id: result.public_id,
        };
      })
    );

    // Promise.all — це метод, який дозволяє обробляти кілька обіцянок одночасно.
    // Він приймає масив обіцянок і повертає новий Promise, який виконається, коли всі обіцянки у масиві завершаться.

    /////////////////////////////////////////
    // ✅ Promise.all() дозволяє завантажувати всі картинки одночасно.
    // ✅ Ми чекаємо завершення всіх завантажень і отримуємо масив URL-адрес.
    // ✅ Якби не Promise.all, то завантаження відбувалося б послідовно (повільніше).
    // ✅ Час очікування буде таким, скільки триває завантаження найдовшої картинки.

    const productData = {
      name,
      description,
      price: Number(price),
      category,
      subCategory,
      sizes: JSON.parse(sizes), // переробляє із стрінги в масив, розпарсив)
      bestseller: bestseller === "true" ? true : false,
      images: imagesData,
      date: Date.now(),
    };

    const product = new productModel(productData); // те з чим монго вміє працювати
    await product.save();

    res.json({ success: true, message: "Product added!" }); // {} -- сервер успішно обробив запит, але не має даних для передачі клієнту, тому {}.
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// update product
const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const uploadedImages = req.files; // масив з файлами (картинками)
    const updatedFields = req.body;
    const { imgForDelete } = req.query;

    if (imgForDelete && imgForDelete !== "[]") {
      const imagesToDelete = JSON.parse(imgForDelete);
      console.log(imagesToDelete, "imagesToDelete");

      // Видалити всі зображення з Cloudinary
      await Promise.all(
        imagesToDelete.map(async (id) => {
          if (id) {
            await cloudinary.uploader.destroy(id);
          }
        })
      );
    }

    if (updatedFields.images) {
      if (updatedFields.images === "[]") {
        updatedFields.images = JSON.parse(updatedFields.images);
      } else {
        updatedFields.images = JSON.parse(updatedFields.images);
      }
    }

    if (uploadedImages.length) {
      let imagesData = await Promise.all(
        uploadedImages.map(async (item) => {
          let result = await cloudinary.uploader.upload(item.path, {
            resource_type: "image",
            folder: "productsForever", // productsForever папка де зберігаються фотки на cloudinary
          }); // item.path --  бо консоль лог мені показує об'єкт в котрому є ключ path, цей об'єкт і є наша завантажена картинка
          //  cloudinary отримає шлях до картинки і закине цю картинку в хмарку
          return {
            url: result.secure_url,
            public_id: result.public_id,
          };
        })
      );

      if (updatedFields.images.length) {
        updatedFields.images = [...updatedFields.images, ...imagesData];
      } else {
        updatedFields.images = imagesData;
      }
    }

    if (updatedFields.sizes) {
      updatedFields.sizes = JSON.parse(updatedFields.sizes);
    }

    const updatedProduct = await productModel.findByIdAndUpdate(
      productId,
      updatedFields,
      { new: true }
    );
    // productId, // ID продукту
    //   updatedFields, // Оновлені дані
    //   { new: true }; // Повернути оновлений документ

    if (!updatedProduct) {
      res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: "Product Updated!" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// func for list products
const listProducts = async (req, res) => {
  try {
    // console.log(req.query, "req.query");
    // отак передавати з фронта /api/product/list?page=${currentPage}&limit=${currentLimit}
    // єбать я програміст =)

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit; // Обчислює skip — скільки товарів треба пропустити в базі

    // Загальна кількість товарів
    const totalCount = await productModel.countDocuments();

    // Отримуємо товари з пропуском та лімітом
    const products = await productModel.find().skip(skip).limit(limit);

    // const products = await productModel.find({});
    res.json({ success: true, products, totalCount });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// for get bestsellers products

const bestsellersProducts = async (req, res) => {
  try {
    const bestsellersForSection = await productModel
      .find({ bestseller: true })
      .sort({
        date: -1,
      })
      .limit(5);
    // sort({createdAt: -1} -- отримаю найновіші бестселлери, .limit(5) -- тільки 5

    if (!bestsellersForSection.length) {
      return res.status(404).json({
        success: false,
        message: "Can't Find 'Bestsellers Products!'",
      }); // так отримувати цю помилку на фронті --> error.response?.data?.message
    }

    res.json({ success: true, bestsellersForSection });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: error.message });
  }
};

// for get latest products

const latestProducts = async (req, res) => {
  try {
    const latestProductsForSection = await productModel
      .find()
      .sort({ date: -1 })
      .limit(10);

    if (!latestProductsForSection.length) {
      return res
        .status(404)
        .json({ success: false, message: "Can't Find 'Latest Products!'" });
    }

    res.json({ success: true, latestProductsForSection });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: error.message });
  }
};

// for get related products

const relatedProducts = async (req, res) => {
  try {
    const { category, subCategory, productId } = req.body;
    console.log("category:", category);
    console.log("subCategory:", subCategory);
    console.log("productId:", productId);

    const relatedProductsForSection = await productModel
      .find({
        category: category,
        subCategory: subCategory,
        _id: { $ne: productId }, // Виключити поточний продукт, типу аля "не дорівнює"
      })
      .sort({ date: -1 })
      .limit(5);

    if (!relatedProductsForSection.length) {
      return res
        .status(404)
        .json({ success: false, message: "Can't Find 'Related Products!'" });
    }

    res.json({ success: true, relatedProductsForSection });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// func for remove product

const removeProduct = async (req, res) => {
  try {
    const product = await productModel.findById(req.body.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product Not Found!" });
    }

    // Видалити всі зображення з Cloudinary
    await Promise.all(
      product.images.map(async (img) => {
        if (img.public_id) {
          await cloudinary.uploader.destroy(img.public_id);
        }
      })
    );

    await productModel.findByIdAndDelete(req.body.id);

    res.json({ success: true, message: "Product removed!" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// func for single product info

const singleProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await productModel.findById(productId);

    if (product) {
      res.json({ success: true, product });
    } else {
      res
        .status(404)
        .json({ success: false, message: "404 Product Not Found!" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  addProduct,
  listProducts,
  removeProduct,
  singleProduct,
  updateProduct,
  bestsellersProducts,
  latestProducts,
  relatedProducts,
};
