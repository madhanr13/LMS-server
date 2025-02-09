import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
dotenv.config();
const PORT = process.env.PORT;

//global rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, //15mins
  limit: 100, //limit each ip to 100 per 15mins
  message: "Too many requests, please try again later.",
});
//security middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(hpp());
app.use("/api", limiter);

//logger middlewares
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//body parser middlewares
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

//global error handler
app.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(err.status || 500).json({
    error: "error",
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

//Cors middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "device-remember-token",
      "Access-Control-Allow-Origin",
      "Origin",
      "Accept",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
  })
);

/// API routes

//404 page
app.use((req, res) => {
  res.status(404).json({
    error: "error",
    message: "Route doesn't exist",
  });
});
app.listen(PORT, () => {
  console.log(
    `Server is running on port ${PORT} in ${process.env.NODE_ENV} mode`
  );
});
