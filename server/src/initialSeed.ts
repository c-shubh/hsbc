import { PrismaClient } from "@prisma/client";
import { parse } from "csv-parse";
import fs from "fs";
import { argv, exit } from "process";

// fail safe
console.log("fail safe triggered");
exit(1);

if (argv.length != 3) {
  console.error("Invalid arguments");
  exit(1);
}

const BATCH_SIZE = 1000;

const db = new PrismaClient();

const filePath = argv[2];

async function clear() {
  try {
    const { count } = await db.transaction.deleteMany({});
    console.log(`Deleted ${count} rows`);
  } catch (err) {
    console.error("Error deleting rows:");
    console.error(err);
    exit(1);
  }
}

async function seed() {
  try {
    const parser = fs
      .createReadStream(filePath)
      .pipe(parse({ delimiter: ",", quote: "'" }));

    let first = true;
    let total = 0;
    const batch = [];

    for await (const record of parser) {
      // skip csv header
      if (first) {
        first = false;
        continue;
      }

      const [
        step,
        customer,
        age,
        gender,
        zipcodeOri,
        merchant,
        zipMerchant,
        category,
        amount,
        fraud,
      ] = record;

      const data = {
        step: parseInt(step),
        customer,
        age: isNaN(parseInt(age)) ? -1 : parseInt(age),
        gender,
        zipcodeOri,
        merchant,
        zipMerchant,
        category,
        amount: parseFloat(amount),
        fraud: Boolean(parseInt(fraud)),
      };

      batch.push(data);
      total++;

      // insert and clear the batch
      if (batch.length >= BATCH_SIZE) {
        await db.transaction.createMany({ data: batch });
        console.log(`Inserted ${batch.length} records`);
        batch.length = 0;
      }
    }

    // insert remaining records in the final batch
    if (batch.length > 0) {
      await db.transaction.createMany({ data: batch });
      console.log(`Inserted ${batch.length} remaining records`);
    }

    console.log(`Inserted a total of ${total} records`);
  } catch (err) {
    console.error(err);
    exit(1);
  }
}

async function main() {
  await clear();
  await seed();
}

void main();
