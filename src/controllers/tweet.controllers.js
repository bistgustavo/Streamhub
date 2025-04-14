import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import { asyncHanlder } from "../utils/asyncHandlers.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespnose.js";

const createTweet = asyncHanlder(async (req, res) => {
  const user = req.user._id;
  const tweet = req.body.post;

  if (!user) {
    throw new ApiError(400, "User not found");
  }

  if (tweet.trim() === "") {
    throw new ApiError(400, "Text is required to tweet");
  }

  const tweetCreate = await Tweet.create({
    content: tweet,
    owner: user,
  });

  if (!tweetCreate) {
    throw new ApiError(400, "Something went wrong while creating the tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweetCreate, "Tweet Created Sucessfully"));
});

const editTweet = asyncHanlder(async (req, res) => {
  const user = req.user._id;
  const tweetId = req.params.id;
  const newTweet = req.body.post;

  if (!user) {
    throw new ApiError(400, "User not found");
  }

  if (newTweet.trim() === "") {
    throw new ApiError(400, "Text is required to edit tweet");
  }

  const tweet = await Tweet.findByIdAndUpdate(
    { _id: tweetId },
    {
      content: newTweet,
    },
    {
      new: true,
    }
  );

  if (!tweet) {
    throw new ApiError(400, "Something went wrong while editing the tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet edited successfully"));
});

const deleteTweet = asyncHanlder(async (req, res) => {
  const tweetId = req.params.id;
  const user = req.user._id;

  if (!user) {
    throw new ApiError(400, "User not found");
  }

  const deleteTweet = await Tweet.findByIdAndDelete({
    _id: tweetId,
  });

  if (!deleteTweet) {
    throw new ApiError(400, "Something went wrong while deleting the tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deleteTweet, "Tweet deleted successfully"));
});

const getTweet = asyncHanlder(async (req, res) => {
  const tweetId = req.params.id;
  const user = req.user._id;

  const post = await Tweet.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(tweetId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "tweet",
        as: "comments",
      },
    },
    {
      $addFields: {
        poster: {
          $first: "$poster",
        },
        likeCount: {
          $size: "$likes",
        },
        isAlreadyLiked: {
          $cond: {
            if: {
              $in: [user, "$likes.user"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        content: 1,
        poster: {
          username: 1,
          fullname: 1,
          avatar: 1,
        },
        likeCount: 1,
        isAlreadyLiked: 1,
        createdAt: 1,
      },
    },
  ]);

  if (!post) {
    throw new ApiError(400, "Something went wrong while getting the tweet");
  }

  return res.status(200).json(new ApiResponse(200, post));
});

export { createTweet, editTweet, deleteTweet, getTweet };
