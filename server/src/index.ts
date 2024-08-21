import { PrismaClient } from "@prisma/client";
import cors from "cors";
import express from "express";

const app = express();
app.use(express.json());
app.use(cors());

const db = new PrismaClient();

app.get("/", (req, res) => {
  res.send("works");
});

if (!process.env.PORT) {
  throw new Error("env.PORT not defined");
}

app.listen(process.env.PORT, () => console.log("server started on 8080"));
