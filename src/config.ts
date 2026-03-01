import "dotenv/config";

export const config = {
  rawgApiKey: process.env.RAWG_API_KEY ?? "",
  port: parseInt(process.env.PORT ?? "3000", 10),
  rawgBaseUrl: "https://api.rawg.io/api",
};

if (!config.rawgApiKey) {
  console.error("ERROR: RAWG_API_KEY no definida. Crea un fichero .env con RAWG_API_KEY=tu_clave");
  console.error("Obtén tu clave en: https://rawg.io/apidocs");
  process.exit(1);
}
