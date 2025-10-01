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
            credits: parseFloat(GB.toFixed(2)),
          }
        : {
            value: parseFloat(MB.toFixed(3)),
            unit: "MB",
            credits: parseFloat(GB.toFixed(2)),
          };
    };

    const limitData = {
      value: 512,
      unit: "MB",
    };

    const db = mongoose.connection.db;
    const stats = await db.stats();

    const { db: dbName, dataSize, indexSize } = stats;

    const usedData = conversion(dataSize + indexSize);

    res
      .status(200)
      .json({ success: true, mongoUsage: { limitData, dbName, usedData } });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ success: false, message: error.message });
  }
};

export { getMongoUsage };
