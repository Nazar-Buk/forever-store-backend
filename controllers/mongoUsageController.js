import mongoose from "mongoose";

const getMongoUsage = async (req, res) => {
  try {
    const convertBytesToGB = (bytes) => {
      return bytes / 1024 ** 3;
    };

    const convertBytesToMB = (bytes) => {
      return bytes / 1024 ** 2;
    };

    const conversion = (bytes) => {
      const GB = convertBytesToGB(bytes);
      const MB = convertBytesToMB(bytes);

      return GB >= 1
        ? {
            value: parseFloat(GB.toFixed(2)),
            unit: "GB",
          }
        : {
            value: parseFloat(MB.toFixed(3)),
            unit: "MB",
          };
    };

    const limitData = {
      value: 512,
      unit: "MB",
    };

    const adminDb = mongoose.connection.db.admin();
    const dataBaseList = await adminDb.listDatabases();

    if (!dataBaseList) {
      return res
        .status(500)
        .json({ success: false, message: "База даних незнайдена!" });
    }

    const { databases } = dataBaseList;
    const filteredDbs = databases.filter(
      (item) => item.name !== "admin" && item.name !== "local"
    );

    const totalDbSize = filteredDbs.reduce((accumulator, current) => {
      accumulator += current.sizeOnDisk;

      return accumulator;
    }, 0);

    const usedData = { totalDbData: conversion(totalDbSize) };

    res.status(200).json({
      success: true,
      mongoUsage: { limitData, usedData },
    });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: error.message });
  }
};

export { getMongoUsage };
