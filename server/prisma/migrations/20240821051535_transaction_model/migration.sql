-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "step" INTEGER NOT NULL,
    "customer" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "zipcodeOri" TEXT NOT NULL,
    "merchant" TEXT NOT NULL,
    "zipMerchant" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "fraud" BOOLEAN NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);
