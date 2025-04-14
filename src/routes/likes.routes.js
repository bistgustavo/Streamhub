import { Router } from "express";
import {
  likeVideo,
  likeComment,
  likeTweet,
} from "../controllers/like.controllers.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/likeVideo/:id").post(verifyJwt, likeVideo);

router.route("/likeTweet/:id").post(verifyJwt, likeTweet);

router.route("/likeComment/:id").post(verifyJwt, likeComment);

export default router;
