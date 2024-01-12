import { User } from "../Models/user.js";
import ErrorHandler from "../Utils/utility-class.js";
import { TryCatch } from "./error.js";

export const adminOnly = TryCatch(async (req, res, next) => {
  const { id } = req.query;
  if (!id) return next(new ErrorHandler("Please login", 401));
  const user = await User.findById(id);
  if (!user)
    return next(new ErrorHandler("Please enter valid credentials", 401));
  const role = user?.role;
  if (role !== "admin") {
    return next(
      new ErrorHandler("You are not authorized to use this route", 401)
    );
  }
  next();
});
