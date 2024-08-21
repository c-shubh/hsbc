import { User } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { db } from ".";
import { ApiError } from "./error";
import { HttpStatusCode } from "./HttpStatusCode";

interface AuthenticatedResponse extends Response<unknown, { user: User }> {}

export const authenticate = function () {
  return function (
    req: Request,
    res: AuthenticatedResponse,
    next: NextFunction
  ) {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
      throw new ApiError(HttpStatusCode.Unauthorized, "Unauthorized");
    }
    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("env JWT_SECRET not set");
    }
    jwt.verify(token, secret, async (err, payload) => {
      if (err || !payload) {
        return res
          .status(HttpStatusCode.Unauthorized)
          .json({ error: "Unauthorized" });
      }
      const userId = (payload as jwt.JwtPayload & { userId: number }).userId;

      const foundUser = await db.user.findUnique({ where: { id: userId } });
      if (!foundUser) {
        return res
          .status(HttpStatusCode.Unauthorized)
          .json({ error: "Unauthorized" });
      }
      res.locals.user = foundUser;
      next();
    });
  };
};
