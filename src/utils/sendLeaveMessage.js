import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import dayjs from "dayjs";

dotenv.config();

export default async function sendLeaveMessage(inactivePaticipants) {
  const mongoClient = new MongoClient(process.env.MONGO_URI);
  await mongoClient.connect();
  const db = mongoClient.db("batepapo-uol-api");

  for (let i = 0; i < inactivePaticipants.length; i++) {
    const { name } = inactivePaticipants[i];

    const leaveMessage = {
      from: name,
      to: "Todos",
      text: "sai da sala...",
      type: "status",
      time: dayjs().format("HH:mm:ss"),
    };

    await db.collection("messages").insertOne(leaveMessage);
  }
  mongoClient.close();
}
