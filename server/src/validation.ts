import { Transaction } from "@prisma/client";
import * as Yup from "yup";

export const transactionQuerySchema = Yup.object({
  page: Yup.number().integer().min(1).default(1),
  limit: Yup.number().integer().min(1).max(100).default(10),
  step: Yup.number().integer().nullable(),
  customer: Yup.string().nullable(),
  age: Yup.number().integer().nullable(),
  gender: Yup.string().nullable(),
  zipcodeOri: Yup.string().nullable(),
  merchant: Yup.string().nullable(),
  zipMerchant: Yup.string().nullable(),
  category: Yup.string().nullable(),
  minAmount: Yup.number().min(0).nullable(),
  maxAmount: Yup.number().nullable(),
  fraud: Yup.boolean().nullable(),
});

export const createTransactionSchema: Yup.ObjectSchema<
  Omit<Transaction, "id">
> = Yup.object({
  step: Yup.number().integer().required(),
  customer: Yup.string().required(),
  age: Yup.number().integer().required(),
  gender: Yup.string().required(),
  zipcodeOri: Yup.string().required(),
  merchant: Yup.string().required(),
  zipMerchant: Yup.string().required(),
  category: Yup.string().required(),
  amount: Yup.number().min(0).required(),
  fraud: Yup.boolean().required(),
});

export const transactionIdSchema = Yup.object({
  id: Yup.number().integer().required(),
});
