import Razorpay from "razorpay";
import crypto from "crypto";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { Course } from "../models/course.model.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createPaymentIntent = async (req, res) => {
  try {
    const userId = req.id;
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const newPurchase = new CoursePurchase({
      course: courseId,
      user: userId,
      amount: course.price,
      status: "pending",
    });

    const options = {
      amount: course.price * 100, // amount in paisa
      currency: "INR",
      receipt: `course_${courseId}`,
      notes: {
        courseId: courseId,
        userId: userId,
      },
    };

    const order = await razorpay.orders.create(options);

    newPurchase.paymentId = order.id;
    await newPurchase.save();

    res.status(201).json({
      success: true,
      order,
      course: {
        name: course.title,
        description: course.description,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating payment intent" });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;
    if (!isAuthentic) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    const purchase = await CoursePurchase.findOne({
      paymentId: razorpay_order_id,
    });
    if (!purchase) {
      return res.status(404).json({ message: "Payment not found" });
    }

    purchase.status = "completed";
    await purchase.save();

    res
      .status(200)
      .json({
        success: true,
        message: "Payment successful",
        courseId: purchase.courseId,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error verifying payment" });
  }
};
