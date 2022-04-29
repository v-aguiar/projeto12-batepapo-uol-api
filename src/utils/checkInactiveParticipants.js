import { MongoClient } from "mongodb";
import dotenv from "dotenv";

import deleteInactivePaticipants from "./deleteInactivePaticipants.js";
import sendLeaveMessage from "./sendLeaveMessage.js";

dotenv.config();

export default async function checkInactiveParticipants() {
  const mongoClient = new MongoClient(process.env.MONGO_URI);

  try {
    await mongoClient.connect();
    const db = mongoClient.db("batepapo-uol-api");

    const participants = await db.collection("participants").find().toArray();
    if (!participants) {
      mongoClient.close();
      throw "⚠ No participants found!";
    }

    // Filter participants who are inactive for more than 10 seconds
    const inactivePaticipants = participants.filter(({ lastStatus }) => {
      return Date.now() / 1000 - lastStatus / 1000 > 10;
    });

    // Break function whenever there are no lazy users connected
    if (inactivePaticipants.length === 0) {
      mongoClient.close();
      return;
    }

    await deleteInactivePaticipants(inactivePaticipants);
    await sendLeaveMessage(inactivePaticipants);
  } catch (e) {
    console.error(e);
    mongoClient.close();
  }
}
