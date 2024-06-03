import express from "express";
import NodeCache from "node-cache";
import useRoute from "./Routes/userRoute.js";
import productRoute from "./Routes/productRoute.js";
import orderRoute from "./Routes/orderRoute.js";
import paymentRoute from "./Routes/paymentRoute.js";
import dashboardRoute from "./Routes/dashboardRoute.js";
import { connectDB } from "./Utils/features.js";
import { errorMiddleware } from "./Middleware/error.js";
import { config } from "dotenv";
import morgan from "morgan";
import Stripe from "stripe";
import cors from "cors";

config({
  path: "./.env",
});

const port = process.env.PORT || 4000;
const uri = process.env.MONGO_URI || "";
const stripeKey = process.env.STRIPE_KEY || "";

connectDB(uri);
export const stripe = new Stripe(stripeKey);
const app = express();
export const myCache = new NodeCache();
app.use(express.json());

app.use(morgan("dev"));
app.use(cors());

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
