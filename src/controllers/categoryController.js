// src/controllers/categoryController.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ error: "Category name is required" });
    }

    // Avoid duplicate categories for same user
    const existing = await prisma.category.findFirst({
      where: {
        AND: [
          { name },
          { OR: [{ userId: userId }, { userId: null }] } // global or user-specific
        ]
      }
    });

    if (existing) {
      return res.status(409).json({ error: "Category already exists" });
    }

    const category = await prisma.category.create({
      data: {
        name,
        userId: userId
      }
    });
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { userId: null }, // global categories
          { userId: userId } // user-specific categories
        ]
      }
    });
    res.json({ categories });
  } catch (err) {
    next(err);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    // Only delete if category is owned by user or global
    if (category.userId && category.userId !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    await prisma.category.delete({ where: { id } });
    res.json({ message: "Category deleted" });
  } catch (err) {
    next(err);
  }
};