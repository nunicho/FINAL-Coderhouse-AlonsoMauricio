const mongoose = require("mongoose");
const config = require("./config.js"); // Asume que config.js contiene las configuraciones generales

const connectToDatabase = async () => {
  try {
    await mongoose.connect(config.MONGO_URL, {
      dbName: config.DB_NAME,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("DB Conectada");
  } catch (error) {
    console.error("Error al conectar a la base de datos:", error.message);
  }
};

module.exports = connectToDatabase;