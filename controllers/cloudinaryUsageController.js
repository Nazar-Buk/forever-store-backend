import { v2 as cloudinary } from "cloudinary";

// For more details visit
// https://console.cloudinary.com/app/c-723ef76f00269b6304ea2e9454383a/home/dashboard

const getCloudinaryUsage = async (req, res) => {
  try {
    const usage = await cloudinary.api.usage();

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
            credits: parseFloat(GB.toFixed(2)),
          }
        : {
            value: parseFloat(MB.toFixed(3)),
            unit: "MB",
            credits: parseFloat(GB.toFixed(2)),
          };
    };

    const storageLimitGB = 25; // 25GB // credits for free plan
    const totalUsedCredits =
      conversion(usage.storage?.usage).credits +
      conversion(usage.bandwidth?.usage).credits +
      usage.transformations?.usage / 1000;

    const percentage = (totalUsedCredits * 100) / storageLimitGB;

    const memoryData = {
      plan: usage?.plan,
      // пам’ять
      storage: {
        used: conversion(usage.storage?.usage), // використана памʼять
      },
      // трафік Скільки було віддано даних
      bandwidth: {
        used: conversion(usage.bandwidth?.usage), // використаний трафік
      },
      // Скільки зроблено (наприклад, ресайзів/оптимізацій)
      transformations: {
        used: usage.transformations?.usage,
        credits: usage.transformations?.usage / 1000, // використаний трафік; 1 кредит -- 1000 трансформацій
      },
      storageLimitGB: {
        limit: storageLimitGB,
        unit: "GB/Credits",
      },

      totalUsedCredits: parseFloat(totalUsedCredits.toFixed(2)),
      totalUsedPercentage: parseFloat(percentage.toFixed(2)),
    };

    res.status(200).json({ success: true, memoryData });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: error.message });
  }
};

export { getCloudinaryUsage };
