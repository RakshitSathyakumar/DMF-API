import mongoose from "mongoose";

const schema = new mongoose.Schema({
  coupon: {
    type: String,
    required: [true, "Please Enter Coupon code!"],
    unique: true,
  },
  amount: {
    type: Number,
    required: [true, "Please Enter the amount!"],
  },
});

export const Coupon = mongoose.model("Coupon", schema);
