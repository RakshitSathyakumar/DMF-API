import express from "express";
import useRoute from "./Routes/userRoute.js";
import productRoute from "./Routes/productRoute.js";
import orderRoute from "./Routes/orderRoute.js";
import paymentRoute from "./Routes/paymentRoute.js";
import dashboardRoute from "./Routes/dashboardRoute.js";
import { connectDB, connectRedis } from "./Utils/features.js";
import { errorMiddleware } from "./Middleware/error.js";
import { config } from "dotenv";
import morgan from "morgan";
import Stripe from "stripe";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";

config({
  path: "./.env",
});

const port = process.env.PORT || 4000;
const uri = process.env.MONGO_URI || "";
const stripeKey = process.env.STRIPE_KEY || "";
const redisuri = process.env.REDIS_URI || "";
export const redisTTL = process.env.redisTTL ||  60 * 60 * 4;

connectDB(uri);
export const redis = connectRedis(redisuri);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


export const stripe = new Stripe(stripeKey);
const app = express();
app.use(cors());
app.use(express.json());

app.use(morgan("dev"));

// Routes
app.use("/api/v1/user", useRoute);
// Product routes
app.use("/api/v1/product", productRoute);
// Order Routes
app.use("/api/v1/order", orderRoute);
// Payment Routes
app.use("/api/v1/payment", paymentRoute);
// Dashboard
app.use("/api/v1/dashboard", dashboardRoute);

app.use("/uploads", express.static("uploads"));
app.use(errorMiddleware);
app.listen(port, () => {
  console.log(`The Express server is working on port :${port}`);
});
