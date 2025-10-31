import express from "express";                // web framework: routing, middleware, handlers
import cors from "cors";                      // allow browser frontend to call this API
import dotenv from "dotenv";                  // load secrets from .env
import morgan from "morgan";                  // development request logger (optional but useful)
import { PrismaClient } from "@prisma/client";
import userRoutes from "./routes/userRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";


// Load environment variables from .env into process.env
dotenv.config();

const app = express();
const prisma = new PrismaClient();

// -------------------- Middleware --------------------
// Why: express.json parses incoming JSON bodies so req.body works
app.use(express.json());

// Why: CORS allows the browser (frontend) to call this API from a different origin.
// We scope it in dev to localhost:3000 to be secure and predictable.
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3001",
  credentials: true
}));

// Why: morgan gives concise HTTP request logs during dev — helpful for debugging requests
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// -------------------- Routes --------------------
// Mount modular route files under /api
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/categories", categoryRoutes);

// Health check — quick indicator the server is alive
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "expense-tracker-backend" });
});

// -------------------- Global error handler --------------------
// Why: Centralized error handling keeps controllers thin and provides consistent responses
app.use((err, req, res, next) => {
  console.error(err); // log to console (replace with proper logger in prod)
  const status = err.status || 500;
  res.status(status).json({
    error: {
      message: err.message || "Internal Server Error",
      code: err.code || "INTERNAL_ERROR"
    }
  });
});

// -------------------- Graceful shutdown --------------------
// Why: Close DB connections on process termination to avoid open handles
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

const shutdown = async () => {
  console.log("Shutting down server...");
  await prisma.$disconnect();
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);