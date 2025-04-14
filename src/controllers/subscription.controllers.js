import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespnose.js";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { asyncHanlder } from "../utils/asyncHandlers.js";

const subscriberToChannel = asyncHanlder(async (req, res) => {
  const channelId = req.params.id;
  const subscriber = req.user._id;

  if (!subscriber) {
    throw new ApiError(400, "Unauthorized access to subscribe");
  }

  const exsistingSubscription = await Subscription.findOne({
    channel: channelId,
    subscriber: subscriber,
  });

  const doesChannelExists = await User.findById(channelId);

  if (!doesChannelExists) {
    throw new ApiError(400, "Channel does not exists");
  }

  if (exsistingSubscription) {
    await Subscription.findByIdAndDelete(exsistingSubscription._id);

    return res
      .status(200)
      .json(new ApiResponse(200, "Channel Unsubscribed Successfully"));
  } else {
    const subscribe = await Subscription.create({
      subscriber,
      channel: channelId,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, subscribe, "Channel Subscribed Successfully"));
  }
});

const getAllSubscriber = asyncHanlder(async (req, res) => {
  const channelId = req.params.id;

  const isChannelValid = await User.findById(channelId);

  if (!isChannelValid) {
    throw new ApiError(400, "Channel does not exists");
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberInfo",
      },
    },
    {
      $project: {
        "subscriberInfo.username": 1,
        subscriber: 1,
        "subscriberInfo.avatar": 1,
      },
    },
  ]);

  if (!subscribers || !subscribers.length) {
    throw new ApiError(400, "No Subscribers found");
  }

  return res.status(200).json(new ApiResponse(200, subscribers));
});

const getChannelSubscribedTo = asyncHanlder(async (req, res) => {
  const user = req.params.id;

  const isUserValid = await User.findById(user);

  if (!isUserValid) {
    throw new ApiError(400, "User does not exists");
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(user),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelInfo",
      },
    },
    {
      $project: {
        "channelInfo.username": 1,
        channel: 1,
        "channelInfo.avatar": 1,
      },
    },
  ]);

  if (!subscribers || !subscribers.length) {
    throw new ApiError(400, "No Subscribers found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    );
});

export { subscriberToChannel, getAllSubscriber, getChannelSubscribedTo };
