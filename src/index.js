import express, { json } from "express";
import cors from "cors";
import chalk from "chalk";
import dotenv from "dotenv";
import dayjs from "dayjs";

import { MongoClient } from "mongodb";
import Joi from "joi";

dotenv.config();

const app = express();
app.use(cors());
app.use(json());

// Set database client
const mongoClient = new MongoClient(process.env.MONGO_URI);
let db = null;

// Set JOI validation schemas
const participants_schema = new Joi.object({
  name: Joi.string().required(),
});

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

// POST a new participant on the DB
app.post("/participants", async (req, res) => {
  try {
    const { name } = req.body;
    const time = dayjs().format("HH:mm:ss");

    // Validate name using Joi Schema
    await participants_schema.validateAsync({ name });

    db = mongoClient.db("batepapo-uol-api");
    mongoClient.connect();

    const participant = {
      name: name,
      lastStatus: Date.now(),
    };

    const message = {
      from: name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time,
    };

    // Save participant and 'enter-room message' on MongoDB
    await db.collection("participants").insertOne(participant);
    await db.collection("messages").insertOne(message);

    res.sendStatus(201);
    mongoClient.close();
  } catch (e) {
    console.error(e);
    res.sendStatus(422);
    mongoClient.close();
  }
});

//GET messages list
app.get("/messages", async (req, res) => {
  try {
    const { limit } = req.query;
    // IF limit EXISTS, RETURN LIMITED AMOUNT OF MESSAGES, ELSE, RETURN ALL MESSAGES
    const searchObject = {};

    await mongoClient.connect();
    db = mongoClient.db("batepapo-uol-api");

    const messages = await db
      .collection("messages")
      .find(searchObject)
      .toArray();
    res.status(200).send(messages);
    mongoClient.close();
  } catch (e) {
    res.send("400");
    mongoClient.close();
  }
});

app.listen(5000, () =>
  console.log(
    chalk.bold.greenBright("\n🚀 Server is running!") +
      chalk.bold.cyanBright("\n\nListening on port 5000...\n") +
      chalk.bold.magenta("http://localhost:5000\n")
  )
);
