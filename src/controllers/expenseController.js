import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createExpense = async (req, res, next) => {
  try {
    const { title, amount, type, categoryId, description, userId } = req.body;

    if (!title || !amount || !type || !userId) {
      const err = new Error("Title, amount, type, and userId are required");
      err.status = 400;
      throw err;
    }

    const expense = await prisma.expense.create({
      data: { title, amount, type, categoryId, description, userId }
    });

    res.status(201).json({ expense });
  } catch (error) {
    next(error);
  }
};

export const getAllExpenses = async (req, res, next) => {
  try {
    const expenses = await prisma.expense.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { date: "desc" }
    });

    res.json({ expenses });
  } catch (error) {
    next(error);
  }
};

export const getExpenseById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!expense) {
      const err = new Error("Expense not found");
      err.status = 404;
      throw err;
    }

    res.json({ expense });
  } catch (error) {
    next(error);
  }
};

export const updateExpense = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { title, amount, type, category, description } = req.body;

    const expense = await prisma.expense.update({
      where: { id },
      data: { title, amount, type, category, description }
    });

    res.json({ expense });
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await prisma.expense.delete({ where: { id } });
    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const getUserExpenses = async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) {
      const err = new Error("User ID is required");
      err.status = 400;
      throw err;
    }

    const expenses = await prisma.expense.findMany({
      where: { userId },
      include: {
        category: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    });

    res.json({ expenses });
  } catch (error) {
    next(error);
  }
};