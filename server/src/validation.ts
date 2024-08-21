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
