import { NextFunction, Request, Response } from "express";
import { User } from "../Models/user.js";
import { NewUserRequestBody } from "../Types/types.js";
import ErrorHandler from "../Utils/utility-class.js";
import { TryCatch } from "../Middleware/error.js";

export const newUser = TryCatch(
  async (
    req: Request<{}, {}, NewUserRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { _id, name, email, photo, role, gender, dob } = req.body;

    let user = await User.findById(_id);
    if (user) {
      return res.status(200).json({
        success: true,
        message: `Welcome ${name}`,
      });
    }

    if (!_id || !name || !email || !photo || !gender || !dob)
      return next(new ErrorHandler("Please enter all details!!", 400));

    await User.create({
      _id,
      name,
      email,
      photo,
      role,
      gender,
      dob: new Date(dob),
    });

    return res.status(200).json({
      success: true,
      message: `Welcome ${name} to Dunder miffilin`,
    });
  }
);

export const getAllUsers = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const users = await User.find({});
    return res.status(200).json({
      success: true,
      message: users,
    });
  }
);

export const getUser = TryCatch(async (req, res, next) => {
  const id = req.params.id;
  const user = await User.findById(id);
  if (!user) {
    return next(new ErrorHandler("Invalid User!", 400));
  }

  return res.status(200).json({
    success: true,
    message: user,
  });
});


export const deleteUser = TryCatch(
    async(req,res,next)=>{
        const id = req.params.id;
        const user=await User.findById(id);
        if(!user){
            return next(new ErrorHandler("Invalid User!",400));
        }
        await user.deleteOne();
        return res.status(200).json({
            success:true,
            message:"User Deleted!"
        })
    }
)
