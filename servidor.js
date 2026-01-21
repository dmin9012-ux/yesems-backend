require("dotenv").config();
require("./services/firebase");
const app = require("./app");
const conectarDB = require("./config/db");

const PORT = process.env.PORT || 5000;

// Conectar a MongoDB
conectarDB();

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});