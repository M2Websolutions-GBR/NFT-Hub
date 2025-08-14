import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/user.js';

dotenv.config({path: "./config/.env"});

mongoose.set('strictQuery', true);

const checkExpiredSubscriptions = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const now = new Date();

    const result = await User.updateMany(
      {
        isSubscribed: true,
        subscriptionExpires: { $lt: now },
      },
      {
        $set: { isSubscribed: false, subscriptionExpires: null },
      }
    );

    console.log(` Updated ${result.modifiedCount} expired subscriptions.`);
    mongoose.disconnect();
  } catch (err) {
    console.error(' Error checking subscriptions:', err);
    mongoose.disconnect();
  }
};

checkExpiredSubscriptions();
