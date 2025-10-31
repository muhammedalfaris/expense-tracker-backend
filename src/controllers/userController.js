import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


const prisma = new PrismaClient();

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) {
      const err = new Error("Email and password are required");
      err.status = 400;
      throw err;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      const err = new Error("User with this email already exists");
      err.status = 409;
      throw err;
    }

    // 🔒 Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const { password: _p, ...safeUser } = user;
    res.status(201).json({ user: safeUser });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const err = new Error("Email and password are required");
      err.status = 400;
      throw err;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }

    // 🧠 Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const err = new Error("Invalid credentials");
      err.status = 401;
      throw err;
    }

    // 🪙 Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    );

    const { password: _p, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            select : {id: true, name: true, email: true, createdAt: true}
        });
        res.json({ users });
    } catch (error) {
        next(error);
    }
};

export const getUser = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, createdAt: true }
    });
    if (!user) {
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }
    res.json({ user });
  } catch (error) {
    next(error);
  }
};