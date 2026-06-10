import mongoose from "mongoose";
import { app } from "./app.js";
import { config } from "./config/index.js";
import { createDBConnection } from "./config/db.js";
import { cacheService } from "./services/cache.service.js";

async function startServer() {
  try {
    await createDBConnection();
    await cacheService.init();

    const server = app.listen(config.port, () => {
      console.log(`Server running on port ${config.port} [${config.env}]`);
    });

    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await cacheService.close();
        await mongoose.connection.close();
        console.log("All connections closed. Goodbye.");
        process.exit(0);
      });
      setTimeout(() => {
        console.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
