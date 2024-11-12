import { Request } from "express";
import { TryCatch } from "../Middleware/error.js";
import { Coupon } from "../Models/coupoun.js";
import ErrorHandler from "../Utils/utility-class.js";
import { stripe } from "../app.js";

interface Icoupon {
  coupon: string;
  amount: Number;
}

//
export const createPaymentIntent = TryCatch(async (req, res, next) => {
  const { amount } = req.body;

  if (!amount) return next(new ErrorHandler("Please enter amount", 400));

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Number(amount) * 100,
    currency: "inr",
    description: "Dunder Miffilin Payment",
    shipping: {
      name: "Random singh",
      address: {
        line1: "510 Dunder Miffilin",
        postal_code: "98140",
        city: "San Francisco",
        state: "CA",
        country: "US",
      },
    },
  });

  return res.status(201).json({
    success: true,
    clientSecret: paymentIntent.client_secret,
  });
});

//
export const newCoupon = TryCatch(
  async (req: Request<{}, {}, Icoupon>, res, next) => {
    const { coupon, amount } = req.body;

    if (!coupon || !amount)
      return next(new ErrorHandler("Please enter both the feilds!", 400));

    await Coupon.create({
      coupon,
      amount,
    });
    return res.status(201).json({
      success: true,
      message: `Coupon is ${coupon} created!`,
    });
  }
);

export const couponDetail = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const coupon = await Coupon.findById(id);

  if (!coupon) return next(new ErrorHandler("Invalid Code!", 400));

  res.status(200).json({
    success: true,
    coupon
  });
});

//
export const applyDiscount = TryCatch(async (req, res, next) => {
  const { coupon } = req.query;

  const discount = await Coupon.findOne({ coupon: coupon });
  if (!discount) return next(new ErrorHandler("Invalid Code!", 400));

  res.status(200).json({
    success: true,
    discount:discount.amount,
  });
});
//
export const getAllCouponCode = TryCatch(async (req, res, next) => {
  const coupons = await Coupon.find({});
  return res.status(200).json({
    success: true,
    coupons,
  });
});
//
export const deleteCoupon = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) return next(new ErrorHandler("Coupon doesn't exisit", 400));

  return res.status(200).json({
    success: true,
    message: `The Coupon is deleted successfully!`,
  });
});

export const updateCoupon = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const checkCoupon = await Coupon.findById(id);
  if (!checkCoupon) return next(new ErrorHandler("Coupon doesn't exisit", 400));

  const {amount,coupon} = req.body;

  if(amount) checkCoupon.amount = amount;
  if(coupon) checkCoupon.coupon = coupon;

  await checkCoupon.save();

  return res.status(200).json({
    success: true,
    message: `The Coupon is updated successfully!`,
  });
});
