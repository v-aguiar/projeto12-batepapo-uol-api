import express, { json } from "express";
import cors from "cors";
import chalk from "chalk";
import dotenv from "dotenv";

import { MongoClient } from "mongodb";

dotenv.config();

const app = express();
app.use(cors());
app.use(json());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db = null;

// GET all participants list
app.get("/participants", async (req, res) => {
  try {
    await mongoClient.connect();
    db = mongoClient.db("batepapo-uol-api");

    const participants = await db.collection("participants").find({}).toArray();
    res.status(200).send(participants);
    mongoClient.close();
  } catch (e) {
    console.error(e);
    res.send("400");
    mongoClient.close();
  }
});

app.listen(5000, () =>
  console.log(
    chalk.bold.greenBright("\n🚀 Server is runnin!") +
      chalk.bold.cyanBright("\n\nListening on port 5000...")
  )
);
