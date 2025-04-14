import { Router } from "express";
import {
  videoComment,
  editCommentOnVideo,
  getCommentOnVideo,
  deleteVideoComment,
  commentOnTweet,
  editCommentOnTweet,
  deleteCommentOnTweet,
  getCommentOnTweet,
} from "../controllers/comment.controllers.js";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { get } from "mongoose";

const router = Router();

//routes for video comment
router.route("/videoComment/:id").post(verifyJwt, videoComment);

router.route("/editVideoComment/:id").patch(verifyJwt, editCommentOnVideo);

router.route("/getVideoComments/:id").get(verifyJwt, getCommentOnVideo);

router
  .route("/deletevideoComment/:id/:vid")
  .delete(verifyJwt, deleteVideoComment);

//routes for tweet comment

router.route("/tweetComment/:id").post(verifyJwt, commentOnTweet);

router.route("/editTweetComment/:id").patch(verifyJwt, editCommentOnTweet);

router.route("/getTweetComments/:id").get(verifyJwt, getCommentOnTweet);

router
  .route("/deleteTweetComment/:id/:tid")
  .delete(verifyJwt, deleteCommentOnTweet);

export default router;
