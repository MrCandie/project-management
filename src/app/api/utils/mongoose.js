import mongoose from "mongoose";

let isConnected = false;

async function connectDb() {
  const db = process.env.DATABASE;

  try {
    if (isConnected || mongoose.connection.readyState === 1) {
      return;
    }

    const mong = await mongoose.connect(db, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
    });

    isConnected = true;

    console.log("Database connection successful");
  } catch (error) {
    console.log(error);
  }
}

export default connectDb;
