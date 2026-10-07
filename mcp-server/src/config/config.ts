import { config } from "dotenv";

config();

export const ENV = {
  FLOWBOARD_API_URL: process.env.FLOWBOARD_API_URL || "http://localhost:3000/api",
  FLOWBOARD_API_TOKEN: process.env.FLOWBOARD_API_TOKEN || "",
};
