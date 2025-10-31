// src/middleware/authMiddleware.js
import jwt from "jsonwebtoken";

export function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const secret = process.env.JWT_SECRET || "dev_secret";
    const payload = jwt.verify(token, secret);
    req.user = payload; // id, email, etc.
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid/expired token" });
  }
}