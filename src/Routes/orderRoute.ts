import express from "express";
import {
  allOrders,
  deleteOrder,
  getSingleOrder,
  myOrders,
  newOrder,
  processOrder,
} from "../Controllers/orderController.js";
import { adminOnly } from "../Middleware/auth.js";
const app = express.Router();

// Route --> /api/v1/order/new;
app.post("/new", newOrder);

// Route --> api/v1/order/my;
app.get("/my", myOrders);

// Route -->  api/v1/order/all;
app.get("/all", adminOnly, allOrders);

app.route("/:id").get(getSingleOrder).delete(deleteOrder).put(processOrder);

export default app;
