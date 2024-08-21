import bcrypt from "bcrypt";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../error";
import { HttpStatusCode } from "../HttpStatusCode";
import { signupSchema } from "../validation";
import { db } from "..";

export const authRouter = Router();

authRouter.post("/signup", async (req, res) => {
  try {
    const user = signupSchema.validateSync(req.body);
    const { password, ...userWithoutPassword } = user;
    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync(password, saltRounds);
    await db.user.create({
      data: {
        ...userWithoutPassword,
        password: hashedPassword,
      },
    });
    res.sendStatus(HttpStatusCode.Created);
  } catch (err) {
    res
      .status(HttpStatusCode.InternalServerError)
      .json({ error: (err as Error).message });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const credentials = signupSchema.validateSync(req.body);
    const user = await db.user.findUnique({
      where: { email: credentials.email },
    });
    if (!user || !bcrypt.compareSync(credentials.password, user.password)) {
      throw new ApiError(401, "Invalid credentials");
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("env JWT_SECRET not set");
    }

    const token = jwt.sign({ userId: user.id }, secret, {
      expiresIn: "7d",
    });

    // @ts-ignore
    delete user.password;
    const ret = {
      token,
      user,
    };

    res.status(HttpStatusCode.Ok).json(ret);
  } catch (err) {
    res
      .status(HttpStatusCode.InternalServerError)
      .json({ error: (err as Error).message });
  }
});
