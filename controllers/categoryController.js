import { slugify } from "transliteration"; // slugify -- робить з любої мови транслітерацію та забирає пробіли по бокам, а в середині замінює пробіли на дефіси

import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js";

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

// get Category List

const getCategories = async (req, res) => {
  try {
    // console.log(req.query, "req.query");
    // отак передавати з фронта /api/product/list?page=${currentPage}&limit=${currentLimit}

    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const skip = (page - 1) * limit; // Обчислює skip — скільки товарів треба пропустити в базі

    const totalCount = await categoryModel.countDocuments();

    const categoriesList = await categoryModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const allCategories = await categoryModel.find();

    res.json({ success: true, categoriesList, allCategories, totalCount });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: error.message });
  }
};

// delete Category

const removeCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const oldCategoryData = await categoryModel.findById(categoryId);

    if (!oldCategoryData) {
      return res
        .status(404)
        .json({ success: false, message: "Category Not Found!" });
    }

    await productModel.updateMany(
      { category: oldCategoryData.categoryLabel },
      {
        $set: {
          category: "No Category",
          subCategory: "No SubCategory",
        },
      }
    );

    await categoryModel.findByIdAndDelete(categoryId);

    res.json({ success: true, message: "Category Removed!" });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: error.message });
  }
};

// get single category

const singleCategory = async (req, res) => {
  try {
    const { categoryId } = req.query;

    const category = await categoryModel.findById(categoryId);

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category Not Found!" });
    }

    res.json({ success: true, category });
  } catch (error) {
    console.log(error, "error");
    res.json({ success: false, message: error.message });
  }
};

// update category and subcategory

const updateCategoryAndSubCategory = async (req, res) => {
  try {
    const { updatedFields } = req.body;
    const { categoryId } = req.params;

    let isCategoryUpdated = false;

    if (!updatedFields) {
      return res
        .status(404)
        .json({ success: false, message: "Updated Fields Not Found!" });
    }

    if (!categoryId) {
      return res
        .status(404)
        .json({ success: false, message: "Category ID Not Found!" });
    }

    const oldCategoryData = await categoryModel.findById(categoryId);

    if (!oldCategoryData) {
      return res
        .status(404)
        .json({ success: false, message: "Category Not Found!" });
    }

    const oldCategoryLabel = oldCategoryData.categoryLabel;

    //  .updateMany(filter, update, options)
    // filter – об'єкт умови для пошуку документів (як у find()).

    // update – об'єкт з тим, що треба оновити (зазвичай з $set, $unset, $inc тощо).

    // options – додаткові опції (upsert, multi, timestamps тощо, не обов’язкові).

    if (updatedFields.categoryLabel) {
      updatedFields.categoryValue = slugify(updatedFields.categoryLabel);

      await productModel.updateMany(
        { category: oldCategoryLabel },
        {
          $set: {
            category: updatedFields.categoryLabel,
          },
        }
      );

      isCategoryUpdated = true;
    }

    if (updatedFields.subCategory) {
      const changedSubCategories = oldCategoryData.subCategory.filter(
        (oldItem) => {
          const newItem = updatedFields.subCategory.find(
            (item) => item.id === oldItem._id.toString()
          );
          return (
            newItem && newItem.subCategoryLabel !== oldItem.subCategoryLabel
          );
        }
      );

      const removedSubCategories = oldCategoryData.subCategory.filter(
        (oldItem) => {
          const newItem = updatedFields.subCategory.find(
            (item) => item.id !== "" && item.id === oldItem._id.toString()
          );

          return !newItem;
        }
      );

      if (changedSubCategories.length) {
        const updatePromises = changedSubCategories.map(
          (itemOldSubCategory) => {
            const updatedSubCategory = updatedFields.subCategory.find(
              (item) => item.id === itemOldSubCategory._id.toString()
            );

            if (!updatedSubCategory) {
              return null;
            }

            const updatedSubCategoryLabel = updatedSubCategory.subCategoryLabel;

            return productModel.updateMany(
              {
                subCategory: itemOldSubCategory.subCategoryLabel,
                category: isCategoryUpdated
                  ? updatedFields.categoryLabel
                  : oldCategoryLabel,
              },
              {
                $set: {
                  subCategory: updatedSubCategoryLabel,
                },
              }
            );
          }
        );
        // updatePromises -- тут ми отримуємо масив із промісами та null значеннями

        const filteredPromises = updatePromises.filter(Boolean); // відкидаємо всі фолсі значення та отримуємо масив з промісами
        await Promise.all(filteredPromises); // чекаємо поки всі проміси завершаться
      }

      if (removedSubCategories.length) {
        const removedPromises = removedSubCategories.map(
          (itemOldSubCategory) => {
            return productModel.updateMany(
              {
                category: isCategoryUpdated
                  ? updatedFields.categoryLabel
                  : oldCategoryLabel,
                subCategory: itemOldSubCategory.subCategoryLabel,
              },
              {
                $set: {
                  subCategory: "No SubCategory",
                },
              }
            );
          }
        );
        // updatePromises -- тут ми отримуємо масив із промісами та null значеннями

        await Promise.all(removedPromises); // чекаємо поки всі проміси завершаться
      }

      updatedFields.subCategory = updatedFields.subCategory.map((item) => {
        if (item.id) {
          return {
            subCategoryLabel: item.subCategoryLabel.trim(),
            subCategoryValue: slugify(item.subCategoryLabel),
            _id: item.id,
          };
        }

        return {
          subCategoryLabel: item.subCategoryLabel.trim(),
          subCategoryValue: slugify(item.subCategoryLabel),
        };
      });
    }

    const updatedCategory = await categoryModel.findByIdAndUpdate(
      categoryId,
      updatedFields,
      { new: true }
    );

    if (!updatedCategory) {
      return res
        .status(404)
        .json({ success: false, message: "Category Not Found!" });
    }

    res.json({
      success: true,
      message: "Category Successfully Updated!",
      updatedCategory,
    });
  } catch (error) {
    console.log(error, "error");
    res.json({ success: false, message: error.message });
  }
};

export {
  addCategory,
  getCategories,
  removeCategory,
  singleCategory,
  updateCategoryAndSubCategory,
};
