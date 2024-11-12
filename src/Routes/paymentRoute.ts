import express from "express";
import {
  applyDiscount,
  couponDetail,
  createPaymentIntent,
  deleteCoupon,
  getAllCouponCode,
  newCoupon,
  updateCoupon,
} from "../Controllers/paymentController.js";
import { adminOnly } from "../Middleware/auth.js";
const app = express.Router();

// Route - /api/v1/payment/create
app.post("/create", createPaymentIntent);

// Route --> /api/v1/dicount
app.get("/discount", applyDiscount);

// Route --> /api/v1/payment/coupon/new;
app.post("/coupon/new", adminOnly, newCoupon);
// Route --> /api/v1/coupon/all
app.get("/coupon/all", adminOnly, getAllCouponCode);

// app.delete("/coupon/:id", adminOnly, deleteCoupon);

// app.put("/coupon/:id",adminOnly,updateCoupon);
// app.get("/coupon/:id",adminOnly,couponDetail);

app
  .route("/coupon/:id")
  .get(adminOnly, couponDetail)
  .put(adminOnly, updateCoupon)
  .delete(adminOnly, deleteCoupon);

export default app;
