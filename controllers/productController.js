// Multer — це бібліотека для Node.js, яка використовується для обробки файлів, завантажених на сервер.
// Вона зазвичай використовується разом із фреймворком Express.js, щоб легко працювати з формами,
// які містять файли (наприклад, зображення чи документи).

import { v2 as cloudinary } from "cloudinary";

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

    const image1 = req.files.image1 && req.files.image1[0];
    const image2 = req.files.image2 && req.files.image2[0];
    const image3 = req.files.image3 && req.files.image3[0];
    const image4 = req.files.image4 && req.files.image4[0];

    const images = [image1, image2, image3, image4].filter(
      (item) => item !== undefined
    ); // у випадку коли я хочу відправити лише 2 картинки замість 4ох (а я поставив максимум 4 картинки), то ті що не відправляються будуть undefined, тепер ми їх відсіяли)

    let imagesUrl = await Promise.all(
      images.map(async (item) => {
        let result = cloudinary.uploader.upload(item.path, {
          resource_type: "image",
        }); // item.path --  бо консоль лог мені показує об'єкт в котрому є ключ path, цей об'єкт і є наша завантажена картинка
        // cloudinary отримає шлях до картинки і закине цю картинку в хмарку

        return (await result).secure_url; // без цього не працюватиме
        // return result.secure_url; // це шляпа, так не працює
      })
    );

    console.log(
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      bestseller,
      "description"
    );
    // console.log(image1, image2, image3, image4, "images");
    console.log(images, "images");
    console.log(imagesUrl, "imagesUrl");

    res.json({}); //  сервер успішно обробив запит, але не має даних для передачі клієнту, тому {}.
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// func for list products
const listProducts = async (req, res) => {};

// func for remove product

const removeProduct = async (req, res) => {};

// func for single product info

const singleProduct = (req, res) => {};

export { addProduct, listProducts, removeProduct, singleProduct };
