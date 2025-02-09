import { catchAsync, AppError } from "../middlewares/error.middleware.js";
import User from "../models/user.model.js";
import generateToken from "../utils/generateToken.js";
import {deleteMediaFromCloudinary, uploadMedia} from '../utils/cloudinary.js'

export const createUserAccount = catchAsync(async (req, res) => {
  const { name, email, password, role = "student" } = req.body;

  const existingUser = await User.findOne({ email: email.toLowercase() });

  if (existingUser) {
    throw new AppError("User already exists", 400);
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role,
  });

  await user.updateLastActive();
  generateToken(res, user, "Account created successfully");
});

export const authenticateUser = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password"
  );

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid email or password", 401);
  }

  await user.updateLastActive();
  generateToken(res, user, `Welcome back ${user.name}`);
});

export const signOutUser = catchAsync(async (req, res) => {
  // res.cookie('token', '', {maxAge: 0})
  res.clearCookie("jwt");
  res.status(200).json({ success: true, message: "User signed out" });
});

export const getCurrentUserProfile = catchAsync(async (req, res) => {
  const user = User.findById(req.id).populate({
    path: "enrolledCourses.courseId",
    select: "title thumbnail description",
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.status(200).json({
    success: true,
    data: {
      ...user.toJSON(),
      totalEnrolledCourses: user.totalEnrolledCourses,
    },
  });
});

export const updateUserProfile = catchAsync(async (req, res) => {
  const { name, email, bio } = req.body;
  const updateData = { name, email: email?.toLowerCase(), bio }


  if(req.file){
    const avatarResult = await uploadMedia(req.file.path)
    updateData.avatar = avatarResult.secure_url

    const user = await User.findById(req.id)
    if(user.avatar && user.avatar !== "default-avatar.png"){
      await deleteMediaFromCloudinary(user.avatar)

      
    }
  }

  const updatedUser = await User.findByIdAndUpdate(req.id, updateData,
    {new: true, runValidators : true}
  )
  if(!updatedUser){
    throw new AppError("User not found", 404);
  }
  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: updatedUser,
  });
});

export const test = catchAsync(async (req, res) => {});
