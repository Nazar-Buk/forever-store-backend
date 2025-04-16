import { slugify } from "transliteration"; // slugify -- робить з любої мови транслітерацію та забирає пробіли по бокам, а в середині замінює пробіли на дефіси

import categoryModel from "../models/categoryModel.js";

// Add Category

const addCategory = async (req, res) => {
  try {
    const { categoryLabel, subCategory } = req.body;

    // check if category exist
    const isCategoryExist = await categoryModel.findOne({ categoryLabel });

    if (isCategoryExist) {
      return res
        .status(400)
        .json({ success: false, message: "Category already exist!" });
    }

    let subCategoryData = [];

    if (subCategory.length) {
      const diffSubCategory = [
        ...new Set(subCategory.map((item) => item.trim())), // Set біжить по масиву та додає в новий об'єкт елементи що не мають дцблікатів,
        // розгорни це все в масив спредом [... arrWithSet] і буде тобі щастя, але не забувай про параметр new
      ];

      const isDuplicates = subCategory.length !== diffSubCategory.length;

      if (isDuplicates) {
        return res
          .status(400)
          .json({ success: false, message: "Duplicates sub-categories!" });
      }

      subCategoryData = subCategory.map((item) => {
        // const subCategoryValue = item.trim().toLowerCase().replace(/\s+/g, "-"); // замінюємо всі пробуіли на дифіс
        // або використовуй slugify
        //
        const subCategoryValue = slugify(item); // замінюємо всі пробуіли на дифіс

        return {
          subCategoryLabel: item.trim(),
          subCategoryValue,
        };
      });
    }

    const category = new categoryModel({
      categoryLabel,
      //   categoryValue: categoryLabel.trim().toLowerCase().replace(/\s+/g, "-"), // замінюємо всі пробуіли на дифіс
      categoryValue: slugify(categoryLabel), // slugify -- робить з любої мови транслітерацію та забирає пробіли по бокам, а в середині замінює пробіли на дефіси
      subCategory: subCategoryData,
    });

    await category.save();

    return res.json({
      success: true,
      message: "Category added successfully!",
      category,
    });
  } catch (error) {
    console.log(error, "error");
    return res.status(500).json({ success: false, message: error.message });
  }
};

export { addCategory };
