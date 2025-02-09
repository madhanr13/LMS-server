import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { validateHeaderName } from "http";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxLength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minLength: [8, "Password must be atleast 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "student", "instructor"],
        message: "Please select a role",
      },
      default: "student",
    },
    avatar: {
      type: String,
      default: "default.png",
    },
    bio: {
      type: String,
      maxLength: [200, "Bio cannot exceed 200 characters"],
    },
    enrolledCourses: [
      {
        courseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
        },
        enrolledAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdCourses: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    resetPasswordToken: String,
    resetPasswordExpiry: Date,
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
//hash the password

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcryptjs.hash(this.password, 12);
  next();
});

//compare password

userSchema.methods.comparePassword = async function (enterPassword) {
  return await bcryptjs.compare(enterPassword, this.password);
};

//generate reset password token
userSchema.methods.generateResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

userSchema.methods.updateLastActive = function () {
  this.lastActive = Date.now();
  return this.lastActive({ validateBeforeSave: false });
};

//virtual field for enrolled courses
userSchema.virtual("totalEnrolledCourses").get(function () {
  return this.enrolledCourses.length;
});

const User = mongoose.model("User", userSchema);
export default User;
