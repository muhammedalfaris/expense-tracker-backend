import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware.js';

import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getSummaryByCategory,
  getMonthlySummary,
  getTopCategories,
  getRecentTransactions
} from '../controllers/transactionController.js';

const router = express.Router();

router.use(authenticateJWT);

router.post("/", createTransaction);
router.get("/", getTransactions);
router.get("/summary/category", getSummaryByCategory);
router.get("/summary/monthly", getMonthlySummary);
router.get("/summary/top-categories", getTopCategories);
router.get("/recent", getRecentTransactions);
router.get("/:id", getTransactionById);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

export default router;
