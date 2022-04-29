import express, { json } from "express";
import { MongoClient } from "mongodb";

import cors from "cors";
import chalk from "chalk";
import dotenv from "dotenv";
import dayjs from "dayjs";
import Joi from "joi";

import checkInactiveParticipants from "./utils/checkInactiveParticipants.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(json());

// Set database client
const mongoClient = new MongoClient(process.env.MONGO_URI);
mongoClient.connect();
const db = mongoClient.db("batepapo-uol-api");

// Set JOI validation schemas
const participants_schema = new Joi.object({
  name: Joi.string().required(),
});
const messages_schema = new Joi.object({
  to: Joi.string().required(),
  text: Joi.string().required(),
  type: Joi.string().valid("message", "private_message"),
  from: Joi.string(),
});

// Set interval to run 'checkInactiveParticipants()' in every 15 seconds
setInterval(() => checkInactiveParticipants(), 15000);

// GET all participants list
app.get("/participants", async (req, res) => {
  try {
    // await mongoClient.connect();
    // db = mongoClient.db("batepapo-uol-api");

    const participants = await db.collection("participants").find({}).toArray();
    res.status(200).send(participants);
    // mongoClient.close();
  } catch (e) {
    console.error(e);
    res.send("400");
    // mongoClient.close();
  }
});

// POST a new participant on database
app.post("/participants", async (req, res) => {
  try {
    const { name } = req.body;
    const time = dayjs().format("HH:mm:ss");

    // Validate name using Joi Schema
    await participants_schema.validateAsync({ name });

    // Connect with database
    // await mongoClient.connect();
    // db = mongoClient.db("batepapo-uol-api");

    // Check if name already exists in db
    const hasName = await db.collection("participants").findOne({ name: name });

    if (hasName) {
      res.status(409).send("⚠ Name already registered!");
      // mongoClient.close();
      return;
    }

    // Format data to be sent to database
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

    // Save participant and 'enter-room message' on database
    await db.collection("participants").insertOne(participant);
    await db.collection("messages").insertOne(message);

    res.sendStatus(201);
    // mongoClient.close();
  } catch (e) {
    console.error(e);

    res.sendStatus(422);
    // mongoClient.close();
  }
});

//GET messages list
app.get("/messages", async (req, res) => {
  const { user } = req.headers;
  const limit = parseInt(req.query.limit);

  try {
    // Connect to DB
    // await mongoClient.connect();
    // db = mongoClient.db("batepapo-uol-api");

    // Get messages list with limited amount of documents if 'limit' exists
    const messages = limit
      ? await db
          .collection("messages")
          .find()
          .sort({ _id: 1 })
          .limit(limit)
          .toArray()
      : await db.collection("messages").find().toArray();

    // Filter messages
    const filteredMsgs = messages.filter(({ to, from, type }) => {
      const isUserMsg = from === user || to === user;
      const privateMessage = isUserMsg && type === "private_message";
      const publicMessage = type === "message" || type === "status";

      return privateMessage || publicMessage;
    });

    res.status(200).send(filteredMsgs);
    // mongoClient.close();
  } catch (e) {
    console.error(e);
    res.send("400");
    // mongoClient.close();
  }
});

// POST a new message to database
app.post("/messages", async (req, res) => {
  const { to, text, type } = req.body;
  const from = req.headers.user;
  const time = dayjs().format("HH:mm:ss");

  try {
    // Connect to DB
    // await mongoClient.connect();
    // db = mongoClient.db("batepapo-uol-api");

    // Validate if user is registered in DB
    const isUserValid = await db
      .collection("participants")
      .findOne({ name: from });

    if (!isUserValid) {
      res.status(404).send("⚠ User must be registered!");
      // mongoClient.close();
      return;
    }

    // Validate received data using Joi
    await messages_schema.validateAsync({ to, text, type, from });

    // Save validated massage on DB
    const message = {
      time,
      from,
      to,
      text,
      type,
    };

    await db.collection("messages").insertOne(message);

    res.sendStatus(201);
    // mongoClient.close();
  } catch (e) {
    console.error(e);
    res.sendStatus(422);
    // mongoClient.close();
  }
});

// POST an update to the 'lastStatus' attribute with current Timestamp ?PUT
app.post("/status", async (req, res) => {
  const { user: name } = req.headers;

  try {
    // Connect with database
    // await mongoClient.connect();
    // db = mongoClient.db("batepapo-uol-api");

    // Validate if user is registered in database
    const isUserValid = await db
      .collection("participants")
      .findOne({ name: name });

    if (!isUserValid) {
      res.sendStatus(404);
      // mongoClient.close();
      return;
    }

    // Update 'lastStatus' attribute timestamp
    await db
      .collection("participants")
      .updateOne({ name: name }, { $set: { lastStatus: Date.now() } });

    res.sendStatus(200);
    // mongoClient.close();
  } catch (e) {
    console.error(e);
    res.sendStatus(422);
    // mongoClient.close();
  }
});

/* WARNING!!! ⚠ ⚠ ⚠ ⚠ ⚠ DELETE ALL MESSAGES STORED ON DATABASE ⚠ ⚠ ⚠ ⚠ ⚠  WARNING!!! */
app.delete("/delete-all-messages", async (req, res) => {
  await db.collection("messages").deleteMany({});

  res.send("Deleted");
});

app.listen(5000, () =>
  console.log(
    chalk.bold.greenBright("\n🚀 Server is running!") +
      chalk.bold.cyanBright("\n\nListening on port 5000...\n") +
      chalk.bold.magenta("http://localhost:5000\n")
  )
);
