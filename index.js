import mongoose from "mongoose";
import { dbName } from "./constants.js";
import dotenv from "dotenv";
import {app} from './app.js'

dotenv.config({ path: "./.env" });  // ✅ Correct path

// Catch server errors early
app.on("error", (error) => {
  console.log("Server Error:", error);
});

(async () => {
  try {
    if (!process.env.MONGOURI || !process.env.PORT) {
      throw new Error("Missing ENV variables");
    }

    await mongoose.connect(`${process.env.MONGOURI}${dbName}`);
    console.log("✅ MongoDB connected");

    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server is listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.log("❌ Startup Error:", error);
    process.exit(1); // Exit app cleanly
  }
})();
