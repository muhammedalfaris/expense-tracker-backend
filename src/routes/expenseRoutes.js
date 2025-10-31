import express from "express";
import {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getUserExpenses
} from "../controllers/expenseController.js";

const router = express.Router();

router.post("/", createExpense);         
router.get("/", getAllExpenses);         
router.get("/:id", getExpenseById);   
router.get("/user/:userId", getUserExpenses);   
router.put("/:id", updateExpense);       
router.delete("/:id", deleteExpense);    

export default router;
