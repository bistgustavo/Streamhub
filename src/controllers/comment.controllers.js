import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { asyncHanlder } from "../utils/asyncHandlers.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespnose.js";
import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";

const videoComment = asyncHanlder(async (req, res) => {
  const videoId = req.params.id;
  const Usercomment = req.body.comment;
  const user = req.user._id;

  if (!user) {
    throw new ApiError(400, "User not found");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  const comment = await Comment.create({
    content: Usercomment,
    video: videoId,
    owner: user,
  });

  if (!comment) {
    throw new ApiError(400, "Comment not created");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment created successfully"));
});

const editCommentOnVideo = asyncHanlder(async (req, res) => {
  const CommentId = req.params.id;
  const user = req.user._id;
  const newComment = req.body.comment;

  if (!user) {
    throw new ApiError(400, "User not found");
  }

  const prevComment = await Comment.findById(CommentId);

  if (!prevComment) {
    throw new ApiError(400, "Comment does not exist");
  }

  if (!newComment) {
    throw new ApiError(404, "Provide the comment to edit");
  }

  if (prevComment.owner.toString() !== user.toString()) {
    throw new ApiError(400, "Original Commentor can only edit the comment");
  }

  const comment = await Comment.findOneAndUpdate(
    { _id: CommentId },
    {
      content: newComment,
    },
    {
      new: true,
    }
  );

  if (!comment) {
    throw new ApiError(500, "Something went wrong while editing the comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, Comment.content, "Comment Edited successfully"));
});

const getCommentOnVideo = asyncHanlder(async (req, res) => {
  const user = req.user?._id;
  const videoId = req.params.id;
  const { page = 2, limit = 10 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video Id Format");
  }

  const doesVideoExist = await Video.findById(videoId);

  if (!doesVideoExist) {
    throw new ApiError(404, "Video Not found");
  }

  const pipeline = [
    {
      $match: {
        video: doesVideoExist._id,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "commentor",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "likes",
      },
    },
    {
      $addFields: {
        commentor: {
          $first: "$commentor",
        },
        likeCount: {
          $size: "$likes",
        },
        isAleardyLiked: {
          $cond: {
            if: { $in: [user, "$likes.user"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        content: 1,
        commentor: {
          username: 1,
          avatar: 1,
          fullname: 1,
        },
        likeCount: 1,
        isAleardyLiked: 1,
        createdAt: 1,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ];

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const paginateComment = await Comment.aggregatePaginate(
    Comment.aggregate(pipeline),
    options
  );

  if (!paginateComment) {
    throw new ApiError(500, "Something went wrong");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        paginateComment,
        "Comment fetched successfully for this video"
      )
    );
});

const deleteVideoComment = asyncHanlder(async (req, res) => {
  const videoId = req.params.vid;
  const CurrentUser = req.user._id;
  const commentId = req.params.id;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "comment not found");
  }

  if (comment.owner.toString() !== CurrentUser.toString()) {
    throw new ApiError(400, "Invalid User to delete the comment");
  }

  const video = await Video.findById(videoId);

  if (comment.video.toString() !== videoId.toString()) {
    throw new ApiError(404, "Not the video to delete the comment");
  }

  const deleteComment = await Comment.findByIdAndDelete(commentId);

  return res
    .status(200)
    .json(new ApiResponse(200, deleteComment, "Comment deleted successfully"));
});

const commentOnTweet = asyncHanlder(async (req, res) => {
  const tweetId = req.params.id;
  const Usercomment = req.body.comment;
  const user = req.user._id;

  if (!user) {
    throw new ApiError(400, "User not found");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(400, "Tweet not found");
  }

  const comment = await Comment.create({
    content: Usercomment,
    tweet: tweetId,
    owner: user,
  });

  if (!comment) {
    throw new ApiError(500, "Something went wrong");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment created successfully"));
});

const editCommentOnTweet = asyncHanlder(async (req, res) => {
  const user = req.user._id;
  const tweetId = req.params.id;
  const newComment = req.body.comment;

  if (newComment.trim() === "") {
    throw new ApiError(400, "Provide the comment to edit");
  }

  if (!user) {
    throw new ApiError(400, "User not found");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(400, "Tweet not found");
  }

  const editedComment = await Comment.findOneAndUpdate(
    { tweet: tweetId },
    {
      content: newComment,
    },
    {
      new: true,
    }
  );

  if (!editedComment) {
    throw new ApiError(500, "Something went wrong");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, editedComment, "Comment edited successfully"));
});

const deleteCommentOnTweet = asyncHanlder(async (req, res) => {
  const tweetId = req.params.tid;
  const CurrentUser = req.user._id;
  const commentId = req.params.id;

  if (!CurrentUser) {
    throw new ApiError(400, "User not found");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(400, "Tweet not found");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(400, "Comment not found");
  }

  const deletedComment = await Comment.findOneAndDelete(commentId);

  if (!deletedComment) {
    throw new ApiError(500, "Something went wrong");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deletedComment, "Comment deleted successfully"));
});

const getCommentOnTweet = asyncHanlder(async (req, res) => {
  const user = req.user._id;
  const tweetId = req.params.id;
  const { page = 2, limit = 10 } = req.query;

  if (!user) {
    throw new ApiError(400, "User not found");
  }

  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(400, "Tweet not found");
  }

  const pipeline = [
    {
      $match: {
        tweet: tweetId,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "commentor",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likes",
      },
    },
    {
      $addFields: {
        commentor: {
          $first: "$commentor",
        },
        likeCount: {
          $size: "$likes",
        },
        isAleardyLiked: {
          $cond: {
            if: { $in: [user, "$likes.user"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        content: 1,
        commentor: {
          username: 1,
          avatar: 1,
          fullname: 1,
        },
        likeCount: 1,
        isAleardyLiked: 1,
        createdAt: 1,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ];

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const paginateComment = await Comment.aggregatePaginate(
    Comment.aggregate(pipeline),
    options
  );

  if (!paginateComment) {
    throw new ApiError(500, "Something went wrong");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        paginateComment,
        "Comment fetched successfully for this video"
      )
    );
});

export {
  videoComment,
  editCommentOnVideo,
  getCommentOnVideo,
  deleteVideoComment,
  commentOnTweet,
  editCommentOnTweet,
  deleteCommentOnTweet,
  getCommentOnTweet,
};
