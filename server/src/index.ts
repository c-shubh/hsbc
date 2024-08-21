import { Prisma, PrismaClient } from "@prisma/client";
import cors from "cors";
import express from "express";
import * as yup from "yup";
import {
  createTransactionSchema,
  transactionIdSchema,
  transactionQuerySchema,
} from "./validation";

const app = express();
app.use(express.json());
app.use(cors());

const db = new PrismaClient();

app.get("/", (req, res) => {
  res.send("works");
});

// get transactions based on filters
app.get("/transactions", async (req, res) => {
  try {
    const validatedQuery = await transactionQuerySchema.validate(req.query);
    const {
      page,
      limit,
      step,
      customer,
      age,
      gender,
      zipcodeOri,
      merchant,
      zipMerchant,
      category,
      minAmount,
      maxAmount,
      fraud,
    } = validatedQuery;

    // db query filters
    const filters: any = {};

    if (step !== undefined) filters.step = step;
    if (customer) filters.customer = customer;
    if (age !== undefined) filters.age = age;
    if (gender !== undefined) filters.gender = gender;
    if (zipcodeOri) filters.zipcodeOri = zipcodeOri;
    if (merchant) filters.merchant = merchant;
    if (zipMerchant) filters.zipMerchant = zipMerchant;
    if (category) filters.category = category;
    if (minAmount !== undefined) filters.amount = { gte: minAmount };
    if (maxAmount !== undefined)
      filters.amount = { ...filters.amount, lte: maxAmount };
    if (fraud !== undefined) filters.fraud = fraud;

    // fetch from db
    const transactions = await db.transaction.findMany({
      where: filters,
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json({ page, limit, total: transactions.length, transactions });
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      return res.status(400).json({ error: err.errors });
    }

    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// create new transaction
app.post("/transactions", async (req, res) => {
  try {
    const validatedBody = await createTransactionSchema.validate(req.body);
    const newTransaction = await db.transaction.create({
      data: validatedBody,
    });
    res.status(201).json(newTransaction);
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      return res.status(400).json({ error: err.errors });
    }

    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// delete transaction
app.delete("/transactions/:id", async (req, res) => {
  try {
    const { id } = await transactionIdSchema.validate({
      id: Number(req.params.id),
    });
    const deletedTransaction = await db.transaction.delete({
      where: { id: Number(id) },
    });
    res.json(deletedTransaction);
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      return res.status(400).json({ error: err.errors });
    }

    // transaction was not found
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

if (!process.env.PORT) {
  throw new Error("env.PORT not defined");
}

app.listen(process.env.PORT, () => console.log("server started on 8080"));
