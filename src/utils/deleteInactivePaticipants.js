import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

export default async function deleteInactivePaticipants(inactivePaticipants) {
  const mongoClient = new MongoClient(process.env.MONGO_URI);
  await mongoClient.connect();
  const db = mongoClient.db("batepapo-uol-api");

  for (let i = 0; i < inactivePaticipants.length; i++) {
    const { _id } = inactivePaticipants[i];

    await db.collection("participants").deleteOne({ _id: _id });
  }
  mongoClient.close();
}
