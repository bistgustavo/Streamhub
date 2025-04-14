import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Comment } from "../models/comment.model.js";
import { User } from "../models/user.model.js";
import { asyncHanlder } from "../utils/asyncHandlers.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespnose.js";

const likeVideo = asyncHanlder(async (req, res) => {
  const videoId = req.params.id;

  const IsVedioExists = await Video.findById(videoId);

  if (!IsVedioExists) {
    throw new ApiError(400, "Video not found");
  }

  const user = req.user._id;

  if (!user) {
    throw new ApiError(400, "User not found");
  }

  const IsVedioLiked = await Like.findOne({ video: videoId, user: user });

  if (IsVedioLiked) {
    await Like.findOneAndDelete({ video: videoId, user: user });

    return res.status(200).json(new ApiResponse(200, "Video unliked"));
  } else {
    const like = await Like.create({
      video: videoId,
      user: user,
    });

    return res.status(200).json(new ApiResponse(200, "Video liked"));
  }
});

const likeComment = asyncHanlder(async (req, res) => {
  const commentId = req.params.id;

  const IsCommentExists = await Comment.findById(commentId);

  if (!IsCommentExists) {
    throw new ApiError(400, "Comment not found");
  }

  const user = req.user._id;

  if (!user) {
    throw new ApiError(400, "User not found");
  }

  const IsCommentLiked = await Like.findOne({ comment: commentId, user: user });

  if (IsCommentLiked) {
    await Like.findOneAndDelete({ comment: commentId, user: user });

    return res.status(200).json(new ApiResponse(200, "Comment unliked"));
  } else {
    const like = await Like.create({
      comment: commentId,
      user: user,
    });

    return res.status(200).json(new ApiResponse(200, "Comment liked"));
  }
});

const likeTweet = asyncHanlder(async (req, res) => {
  const tweetId = req.params.id;

  const IsTweetExists = await Tweet.findById(tweetId);

  if (!IsTweetExists) {
    throw new ApiError(400, "Tweet not found");
  }

  const user = req.user._id;

  if (!user) {
    throw new ApiError(400, "User not found");
  }

  const IsTweetLiked = await Like.findOne({ tweet: tweetId, user: user });

  if (IsTweetLiked) {
    await Like.findOneAndDelete({ tweet: tweetId, user: user });

    return res.status(200).json(new ApiResponse(200, "Tweet unliked"));
  } else {
    const like = await Like.create({
      tweet: tweetId,
      user: user,
    });

    return res.status(200).json(new ApiResponse(200, "Tweet liked"));
  }
});

export { likeVideo, likeComment, likeTweet };
