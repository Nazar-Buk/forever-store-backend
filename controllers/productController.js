// Multer — це бібліотека для Node.js, яка використовується для обробки файлів, завантажених на сервер.
// Вона зазвичай використовується разом із фреймворком Express.js, щоб легко працювати з формами,
// які містять файли (наприклад, зображення чи документи).

import { v2 as cloudinary } from "cloudinary";
import PDFDocument from "pdfkit";
import path from "path";
import ExcelJS from "exceljs";
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
      isSizesAvailable,
      bestseller,
      code,
      inStock,
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
      // sizes: JSON.parse(sizes), // переробляє із стрінги в масив, розпарсив)
      bestseller: bestseller === "true" ? true : false,
      images: imagesData,
      code,
      inStock: inStock === "true" ? true : false,
    };

    // Додаємо sizes тільки якщо вони насправді потрібні
    if (isSizesAvailable && sizes) {
      productData.sizes = JSON.parse(sizes); // переробляє із стрінги в масив, розпарсив)
    }

    const product = new productModel(productData); // те з чим монго вміє працювати
    await product.save();

    res.json({ success: true, message: "Продукт додано!" }); // {} -- сервер успішно обробив запит, але не має даних для передачі клієнту, тому {}.
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

      // Видалити всі зображення з Cloudinary
      await Promise.all(
        imagesToDelete.map(async (id) => {
          if (id) {
            await cloudinary.uploader.destroy(id);
          }
        })
      );
    }

    let uploadedImagesData = [];

    if (updatedFields.images) {
      if (updatedFields.images === "[]") {
        updatedFields.images = JSON.parse(updatedFields.images);
      } else {
        const parsedImages = JSON.parse(updatedFields.images);

        if (uploadedImages.length) {
          let fileIndex = 0;
          // uploadedImagesData -- завантажені картинки зі слотами
          uploadedImagesData = parsedImages
            .map((img, ind) => {
              if (img.file) {
                const fileData = {
                  file: uploadedImages[fileIndex],
                  slot: ind,
                };
                fileIndex++;

                return fileData;
              }

              return;
            })
            .filter((item) => item);
        }
        // ті каритинки що були, без завантажених картинок
        updatedFields.images = parsedImages.filter((img) => !img.file);
      }
    }

    if (uploadedImagesData.length) {
      // imagesData -- завантажені картинки перетворилися на url і public_id
      let imagesData = await Promise.all(
        uploadedImagesData.map(async (item) => {
          let result = await cloudinary.uploader.upload(item.file.path, {
            resource_type: "image",
            folder: "productsForever", // productsForever папка де зберігаються фотки на cloudinary
          }); // item.file.path --  бо консоль лог мені показує об'єкт (наш файл) в котрому є ключ path, цей об'єкт і є наша завантажена картинка
          //  cloudinary отримає шлях до картинки і закине цю картинку в хмарку

          return {
            url: result.secure_url,
            public_id: result.public_id,
            slot: item.slot,
          };
        })
      );

      if (updatedFields.images.length) {
        // вставляю нові картинки в потрібні слоти
        imagesData.forEach((item) => {
          updatedFields.images.splice(item.slot, 0, {
            url: item.url,
            public_id: item.public_id,
          });
        });
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
      res.status(404).json({ success: false, message: "Продукт не знайдено" });
    }

    res.json({ success: true, message: "Продукт оновлено!" });
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

    const { search, sort, category, subCategory, priceFrom, priceTo } =
      req.query;

    // Побудова фільтра

    const filter = {};

    if (search?.trim()) {
      filter.name = { $regex: search, $options: "i" };
      // 🔹 { $regex: search, $options: "i" }
      // Це умова пошуку, де:

      // ✅ $regex: search
      // $regex — це оператор MongoDB, який означає "пошук за регулярним виразом".

      // search — це рядок, який ти хочеш знайти (наприклад, "сорочка").

      // Це працює як "містить". Тобто, якщо в назві товару є слово або частина слова, що відповідає search, воно знайдеться.

      // ✅ $options: "i"
      // "i" означає "ignore case", тобто ігноруй регістр.

      // Наприклад, "Сорочка" == "сорочка" == "СОРОЧКА".
    }

    if (category?.trim()) {
      filter.category = category;
    }

    if (subCategory?.trim()) {
      filter.subCategory = subCategory;
    }

    if (priceFrom?.trim()) {
      filter.price = { ...filter.price, $gte: Number(priceFrom) }; // $gte - більше або дорівнює
    }

    if (priceTo?.trim()) {
      filter.price = { ...filter.price, $lte: Number(priceTo) }; // $lte - менше або дорівнює
    }

    // Сортування
    const sortOptions = {};

    switch (sort) {
      case "price_asc":
        sortOptions.price = 1; // Сортує за ціною по зростанню
        break;
      case "price_desc":
        sortOptions.price = -1; // Сортує за ціною по спаданню
        break;
      case "date_new":
        sortOptions.createdAt = -1; // Сортує за датою додавання (від нових до старих)
        break;
      case "date_old":
        sortOptions.createdAt = 1; // Сортує за датою додавання (від старих до нових)
        break;
      default:
        sortOptions.createdAt = -1; // Сортує за датою додавання (від нових до старих)
    }

    // Загальна кількість товарів
    const totalCount = await productModel.countDocuments(filter);

    // Отримуємо товари з пропуском та лімітом
    const products = await productModel
      .find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

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
        createdAt: -1,
      })
      .limit(5);
    // sort({createdAt: -1} -- отримаю найновіші бестселлери, .limit(5) -- тільки 5

    if (!bestsellersForSection.length) {
      return res.status(404).json({
        success: false,
        message: "Не знайдено продукти для 'Хіт продіжів'!",
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
      .sort({ createdAt: -1 })
      .limit(10);

    if (!latestProductsForSection.length) {
      return res.status(404).json({
        success: false,
        message: "Не знайдено продукти для 'Новинки!'",
      });
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

    const relatedProductsForSection = await productModel
      .find({
        category: category,
        subCategory: subCategory,
        _id: { $ne: productId }, // Виключити поточний продукт, типу аля "не дорівнює"
      })
      .sort({ createdAt: -1 })
      .limit(5);

    if (!relatedProductsForSection.length) {
      return res.status(404).json({
        success: false,
        message: "Не знайдено товари для 'Схожі товари!'",
      });
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
        .json({ success: false, message: "Продукт не знайдено!" });
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

    res.json({ success: true, message: "Продукт видалено!" });
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
        .json({ success: false, message: "404 Продукт не знайдено!" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const products = await productModel.find({});

    if (!products.length) {
      return res
        .status(404)
        .json({ success: false, message: "Продукт не знайдено!" });
    }

    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const generatePriceListPdf = async (req, res) => {
  try {
    const products = await productModel
      .find({})
      .sort({ category: 1, subCategory: 1, name: 1 });

    // Якщо товарів немає — повертаємо 404
    if (!products.length) {
      return res.status(404).json({
        success: false,
        message: "Немає товарів для формування прайс-листа.",
      });
    }

    // 2️⃣ Встановлюємо заголовки, щоб браузер сприймав відповідь як PDF-файл
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="price-list.pdf"'
    );

    // 3️⃣ Створюємо PDF-документ (A4, з відступами)
    const doc = new PDFDocument({ margin: 40, size: "A4" });

    // Підключаємо потік документа до відповіді (щоб одразу відправляти користувачу)
    doc.pipe(res);

    // ✅ Підключаємо шрифт із підтримкою кирилиці
    const fontPath = path.join(process.cwd(), "fonts", "DejaVuSans.ttf");
    doc.font(fontPath);

    // 4️⃣ Заголовок документа
    doc.fontSize(18).text("ПРАЙС-ЛИСТ BUK SKLAD", { align: "center" });
    doc.moveDown(1); // робить відступ вниз на один рядок (по суті, вставляє порожній простір).
    // Якщо поставити moveDown(2), буде більший відступ.

    // 5️⃣ Змінні для відстеження поточної категорії та підкатегорії
    let currentCategory = "";
    let currentSubCategory = "";

    products.forEach((product) => {
      // Якщо змінилася категорія — виводимо її як заголовок
      if (product.category !== currentCategory) {
        currentCategory = product.category;
        doc.moveDown(1);
        doc
          .fontSize(12)
          .text(currentCategory.toUpperCase(), { underline: true });
      }

      // Якщо є підкатегорія і вона змінилася — показуємо її під категорією
      if (product.subCategory && product.subCategory !== currentSubCategory) {
        currentSubCategory = product.subCategory;
        doc.moveDown(1);
        doc.fontSize(12).text(`• ${currentSubCategory}`, { indent: 10 });
      }

      // Визначаємо статус наявності
      const availability = product.inStock ? "В наявності" : "На замовлення";

      // Якщо в товару є код — додаємо його в назву
      const codeText = product.code ? product.code : "";

      // Виводимо сам товар (з відступом)
      doc
        .fontSize(10)
        .moveDown(1)
        .text(
          `- Назва: ${product.name} — (Код: ${codeText}) — Ціна: ${
            product.price
          } грн — Розмір: ${
            product.sizes.length ? product.sizes : "немає"
          } — Наявність: ${availability}`,
          { indent: 20 }
        );
    });

    // 7️⃣ Завершуємо створення документа і відправляємо його
    doc.end();
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: error.message });
  }
};

const generatePriceListExcel = async (req, res) => {
  try {
    // 1️⃣ Отримуємо товари з бази
    const products = await productModel
      .find({})
      .sort({ category: 1, subCategory: 1, name: 1 });

    if (!products.length) {
      return res.status(404).json({
        success: false,
        message: "Немає товарів для формування прайс-листа.",
      });
    }

    // 2️⃣ Створюємо нову книгу Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Прайс-лист");

    // 3️⃣ Додаємо заголовок
    worksheet.mergeCells("A1:G1"); // об’єднує комірки від A1 до F1 в одну велику — тобто робить “шапку” на всю ширину таблиці.
    worksheet.getCell("A1").value = "ПРАЙС-ЛИСТ BUK SKLAD"; // у цю об’єднану комірку вставляє текст — це назва документа
    worksheet.getCell("A1").font = { size: 18, bold: true }; // робить шрифт 16 розміру і жирним.
    worksheet.getCell("A1").alignment = { horizontal: "center" }; // вирівнює текст по центру горизонтально, щоб він красиво виглядав у верхній частині таблиці.

    // 4️⃣ Додаємо шапку таблиці
    worksheet.addRow([
      "Назва товару",
      "Код",
      "Ціна (грн)",
      "Категорія",
      "Підкатегорія",
      "Розмір",
      "Наявність",
    ]);

    // Стилі для шапки
    const headerRow = worksheet.getRow(2);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 16 };
      cell.alignment = { horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // 5️⃣ Додаємо товари
    products.forEach((product) => {
      const availability = product.inStock ? "В наявності" : "На замовлення";
      worksheet.addRow([
        product.name,
        product.code || "-",
        product.price,
        product.category,
        product.subCategory || "-",
        product.sizes.length ? product.sizes.join(", ") : "-", // нове поле
        availability,
      ]);
    });

    // Стиль звичайних рядків
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 2) {
        row.eachCell((cell) => {
          cell.font = { size: 14 };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          cell.alignment = { vertical: "middle", wrapText: true };
        });
      }
    });

    // 6️⃣ Автоматичне вирівнювання ширини колонок
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) maxLength = columnLength;
      });
      column.width = maxLength + 2;
    });

    // 7️⃣ Встановлюємо заголовки для відповіді (щоб файл завантажувався)
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="price-list.xlsx"'
    );

    // 8️⃣ Записуємо книгу у відповідь (стрімом)
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: error.message });
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
  getAllProducts,
  generatePriceListPdf,
  generatePriceListExcel,
};
