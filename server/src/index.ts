import { PrismaClient } from "@prisma/client";
import cors from "cors";
import express from "express";
import analyticsRouter from "./controllers/analytics";
import { authRouter } from "./controllers/auth";
import transactionsRouter from "./controllers/transactions";

const app = express();
app.use(express.json());
app.use(cors());

export const db = new PrismaClient();

app.get("/", (req, res) => {
  res.send("works");
});

app.use("/auth", authRouter);
app.use("/analytics", analyticsRouter);
app.use("/transactions", transactionsRouter);

if (!process.env.PORT) {
  throw new Error("env.PORT not defined");
}

app.listen(process.env.PORT, () => console.log("server started on 8080"));
