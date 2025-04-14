import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

//common middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//import routes
import healthCheckRoutes from "./routes/healthcheck.routes.js";
import userRouter from "./routes/users.routes.js";
import videoRouter from "./routes/video.routes.js";
import subscriptionRouter from "./routes/subscriptions.routes.js";
import likeRouter from "./routes/likes.routes.js";
import CommentRouter from "./routes/comment.routes.js";
import TweetRouter from "./routes/tweet.routes.js";

//Routes
app.use("/api/v1/healthcheck", healthCheckRoutes);

app.use("/api/v1/users", userRouter);

app.use("/api/v1/videos", videoRouter);

app.use("/api/v1/subscription", subscriptionRouter);

app.use("/api/v1/likes", likeRouter);

app.use("/api/v1/comments", CommentRouter);

app.use("/api/v1/tweets", TweetRouter);

app.use(errorHandler);

export { app };
