// Se ejecuta antes de cada fichero de test.
// Establece las variables de entorno requeridas ANTES de que config.ts se cargue.
process.env.RAWG_API_KEY = "test-api-key-12345";
process.env.PORT = "3001";
