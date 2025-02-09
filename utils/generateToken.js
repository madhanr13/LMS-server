import jwt from "jsonwebtoken";

const generateToken = (res, user, message) => {
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET_KEY, {
    expiresIn: "1d",
  });
  return res
    .status(200)
    .cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hrs
    })
    .json({
      success: true,
      message,
      user,
      token,
    });
};

export default generateToken;
