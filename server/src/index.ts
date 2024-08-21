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

// MARK: /analytics

app.get("/analytics/overview", async (req, res) => {
  try {
    const [
      totalAmountResult,
      totalFraudulentTransactionsResult,
      totalNonFraudulentTransactionsResult,
      averageTransactionAmountResult,
      uniqueMerchants,
      uniqueCustomers,
      transactionsByCategory,
      averageAmountByCategory,
    ] = await db.$transaction([
      // total amount processed
      db.transaction.aggregate({
        _sum: {
          amount: true,
        },
      }),

      // number of fraudulent transactions
      db.transaction.count({
        where: { fraud: true },
      }),

      // number of non-fraudulent transactions
      db.transaction.count({
        where: { fraud: false },
      }),

      // average transaction amount
      db.transaction.aggregate({
        _avg: {
          amount: true,
        },
      }),

      // number of unique merchants
      db.transaction.groupBy({
        by: "merchant",
        _count: {
          merchant: true,
        },
        orderBy: { merchant: "asc" },
      }),

      // number of unique customers
      db.transaction.groupBy({
        by: "customer",
        _count: {
          customer: true,
        },
        orderBy: { customer: "asc" },
      }),

      // number of transactions per category
      db.transaction.groupBy({
        by: "category",
        orderBy: { category: "asc" },
        _count: {
          category: true,
        },
      }),

      // average amount per category
      db.transaction.groupBy({
        by: "category",
        orderBy: { category: "asc" },
        _avg: {
          amount: true,
        },
      }),
    ]);

    const totalUniqueMerchants = uniqueMerchants.length;
    const totalUniqueCustomers = uniqueCustomers.length;
    const summary = {
      totalTransactions:
        totalFraudulentTransactionsResult +
        totalNonFraudulentTransactionsResult,
      totalAmount: totalAmountResult._sum.amount || 0,
      totalFraudulentTransactions: totalFraudulentTransactionsResult,
      totalNonFraudulentTransactions: totalNonFraudulentTransactionsResult,
      averageTransactionAmount: averageTransactionAmountResult._avg.amount || 0,
      totalUniqueMerchants,
      totalUniqueCustomers,
      transactionsByCategory: transactionsByCategory.map((txns) => ({
        category: txns.category,
        count: (txns._count! as any).category,
      })),
      averageAmountByCategory: averageAmountByCategory.map((amts) => ({
        category: amts.category,
        amount: (amts._avg! as any).amount,
      })),
    };
    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/analytics/customer-segmentation", async (req, res) => {
  try {
    const [ageSegmentation, genderSegmentation] = await db.$transaction([
      // age groups
      db.transaction.groupBy({
        by: "age",
        orderBy: { age: "asc" },
        _count: {
          customer: true,
        },
        _sum: {
          amount: true,
        },
      }),
      // by gender
      db.transaction.groupBy({
        by: "gender",
        orderBy: { gender: "asc" },
        _count: {
          customer: true,
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    // spending tiers
    const spendingSegmentation = await db.transaction
      .groupBy({
        by: ["customer"],
        _sum: {
          amount: true,
        },
      })
      .then((customerSpending) => {
        return customerSpending.reduce(
          (acc, curr) => {
            const spending = curr._sum.amount || 0;
            let tier: "Low" | "Medium" | "High";

            if (spending < 100) tier = "Low";
            else if (spending < 500) tier = "Medium";
            else tier = "High";

            if (!acc[tier]) acc[tier] = { count: 0, totalAmount: 0 };
            acc[tier].count += 1;
            acc[tier].totalAmount += spending;

            return acc;
          },
          {} as {
            Low: { count: number; totalAmount: number };
            Medium: { count: number; totalAmount: number };
            High: { count: number; totalAmount: number };
          }
        );
      });

    const segmentationSummary = {
      ageSegmentation: ageSegmentation.map((segment) => ({
        age: segment.age,
        customerCount: (segment._count! as any).customer,
        totalAmount: (segment._sum! as any).amount || 0,
      })),
      spendingSegmentation,
      genderSegmentation: genderSegmentation.map((segment) => ({
        gender: segment.gender,
        customerCount: (segment._count as any)!.customer,
        totalAmount: (segment._sum as any)!.amount || 0,
      })),
    };

    res.json(segmentationSummary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/analytics/merchant-performance", async (req, res) => {
  try {
    const merchantsPerformance = await db.transaction.groupBy({
      by: ["merchant"],
      _count: {
        id: true,
      },
      _avg: {
        amount: true,
      },
      _sum: {
        amount: true,
      },
    });
    const fraudTransactions = await db.transaction.groupBy({
      by: ["merchant"],
      _count: {
        fraud: true,
      },
      where: {
        fraud: true,
      },
    });

    const fraudMap = fraudTransactions.reduce((acc, item) => {
      acc[item.merchant] = item._count.fraud;
      return acc;
    }, {} as Record<string, number>);

    const performanceData = merchantsPerformance.map((merchant) => {
      const totalTransactionsCount = merchant._count.id;
      const totalAmount = merchant._sum.amount || 0;
      const averageAmount = merchant._avg.amount || 0;
      const fraudTransactionsCount = fraudMap[merchant.merchant] || 0;
      const fraudRate =
        totalTransactionsCount > 0
          ? (fraudTransactionsCount / totalTransactionsCount) * 100
          : 0;

      return {
        merchant: merchant.merchant,
        totalTransactionsCount,
        totalAmount,
        averageAmount,
        fraudRate,
      };
    });

    res.json(performanceData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/analytics/category-breakdown", async (req, res) => {
  try {
    const categoryBreakdown = await db.transaction.groupBy({
      by: ["category"],
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
      },
      _avg: {
        amount: true,
      },
    });

    const breakdownData = categoryBreakdown.map((category) => ({
      category: category.category,
      totalTransactions: category._count.id,
      totalAmount: category._sum.amount || 0,
      averageAmount: category._avg.amount || 0,
    }));

    res.json(breakdownData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// MARK: /transactions

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
