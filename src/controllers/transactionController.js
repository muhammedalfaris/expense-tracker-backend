// src/controllers/transactionController.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createTransaction = async (req, res, next) => {
  try {
    const { title, amount, type, categoryId, description, date } = req.body;
    const userId = req.user.id;

    if (!title || !amount || !type || !categoryId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category || (category.userId && category.userId !== userId)) {
      return res.status(400).json({ error: "Invalid category" });
    }

    const newTransaction = await prisma.transaction.create({
      data: {
        title,
        amount,
        type,
        description,
        date: date ? new Date(date) : new Date(),
        userId,
        categoryId
      }
    });
    res.status(201).json({ newTransaction });
  } catch (err) {
    next(err);
  }
};

export const getTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, categoryId, startDate, endDate } = req.query;

    const filters = { userId };

    if (type) {
      filters.type = type; // expect enum string: INCOME or EXPENSE
    }
    if (categoryId) {
      filters.categoryId = Number(categoryId);
    }
    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.gte = new Date(startDate);
      if (endDate) filters.date.lte = new Date(endDate);
    }

    const transactions = await prisma.transaction.findMany({
      where: filters,
      include: { category: { select: { id: true, name: true } } },
      orderBy: { date: "desc" }
    });

    res.json({ transactions });
  } catch (err) {
    next(err);
  }
};

export const getTransactionById = async (req, res, next) => {
  try {
    // Debug log to see what's coming from the URL params
    console.log("Transaction ID from URL param:", req.params.id);

    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid transaction ID" });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id }
    });

    if (!transaction || transaction.userId !== req.user.id) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json({ transaction });
  } catch (err) {
    next(err);
  }
};


export const updateTransaction = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { title, amount, type, categoryId, description, date } = req.body;

    const transaction = await prisma.transaction.findUnique({ where: { id } });
    if (!transaction || transaction.userId !== req.user.id) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Verify category
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category || (category.userId && category.userId !== req.user.id)) {
      return res.status(400).json({ error: "Invalid category" });
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        title,
        amount,
        type,
        description,
        date: date ? new Date(date) : undefined,
        categoryId
      }
    });
    res.json({ updated });
  } catch (err) {
    next(err);
  }
};

export const deleteTransaction = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const transaction = await prisma.transaction.findUnique({ where: { id } });
    if (!transaction || transaction.userId !== req.user.id) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    await prisma.transaction.delete({ where: { id } });
    res.json({ message: "Transaction deleted" });
  } catch (err) {
    next(err);
  }
};

export const getSummaryByCategory = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Aggregate sum by category and type
    const summary = await prisma.transaction.groupBy({
      by: ['categoryId', 'type'],
      where: { userId },
      _sum: { amount: true },
    });

    // Fetch all categories used in summary to get their names
    const categoryIds = [...new Set(summary.map(s => s.categoryId))];
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true }
    });

    // Map categoryId to name for easy frontend display
    const categoryMap = {};
    categories.forEach(cat => { categoryMap[cat.id] = cat.name; });

    // Format the summary grouped by type
    const formatted = summary.map(item => ({
      categoryId: item.categoryId,
      categoryName: categoryMap[item.categoryId] || 'Unknown',
      type: item.type,
      totalAmount: item._sum.amount || 0
    }));

    res.json({ summary: formatted });
  } catch (err) {
    next(err);
  }
};

export const getMonthlySummary = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const summary = await prisma.$queryRaw`
      SELECT 
        YEAR(date) AS year,
        MONTH(date) AS month,
        type,
        SUM(amount) AS totalAmount
      FROM Transaction
      WHERE userId = ${userId}
      GROUP BY year, month, type
      ORDER BY year, month;
    `;

    const formatted = summary.map(row => ({
      year: Number(row.year),
      month: Number(row.month),
      type: row.type,
      totalAmount: Number(row.totalAmount),
    }));

    res.json({ summary: formatted });
  } catch (err) {
    next(err);
  }
};

export const getTopCategories = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, limit = 5 } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate required" });
    }

    const topCategories = await prisma.$queryRaw`
      SELECT 
        c.id as categoryId, c.name as categoryName,
        SUM(t.amount) as totalAmount
      FROM Transaction t
      JOIN Category c ON t.categoryId = c.id
      WHERE t.userId = ${userId}
        AND t.type = 'EXPENSE'
        AND t.date BETWEEN ${new Date(startDate)} AND ${new Date(endDate)}
      GROUP BY c.id, c.name
      ORDER BY totalAmount DESC
      LIMIT ${Number(limit)};
    `;

    res.json({ topCategories });
  } catch (err) {
    next(err);
  }
};

export const getRecentTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = Number(req.query.limit) || 10;

    const recentTransactions = await prisma.transaction.findMany({
      where: { userId },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
      take: limit,
    });

    res.json({ recentTransactions });
  } catch (err) {
    next(err);
  }
};

