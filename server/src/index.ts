import { PrismaClient } from "@prisma/client";
import cors from "cors";
import express from "express";
import yup from "yup";
import { transactionQuerySchema } from "./validation";

const app = express();
app.use(express.json());
app.use(cors());

const db = new PrismaClient();

app.get("/", (req, res) => {
  res.send("works");
});

app.get("/transactions", async (req, res) => {
  try {
    const validatedQuery = await transactionQuerySchema.validate(req.query);
    const {
      page,
      limit,
      startDate,
      endDate,
      category,
      merchant,
      zipcodeOri,
      zipMerchant,
      minAmount,
      maxAmount,
      fraud,
    } = validatedQuery;

    // db query filters
    const filters: any = {};

    if (startDate) filters.date = { gte: new Date(startDate) };
    if (endDate) filters.date = { ...filters.date, lte: new Date(endDate) };
    if (category) filters.category = category;
    if (merchant) filters.merchant = merchant;
    if (zipcodeOri) filters.zipcodeOri = zipcodeOri;
    if (zipMerchant) filters.zipMerchant = zipMerchant;
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

if (!process.env.PORT) {
  throw new Error("env.PORT not defined");
}

app.listen(process.env.PORT, () => console.log("server started on 8080"));
