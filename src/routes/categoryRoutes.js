import express from "express";
import { authenticateJWT } from "../middleware/authMiddleware.js";
import {
  createCategory,
  getCategories,
  deleteCategory
} from "../controllers/categoryController.js";

const router = express.Router();

router.use(authenticateJWT);

router.post("/", createCategory);
router.get("/", getCategories);
router.delete("/:id", deleteCategory);

export default router;
