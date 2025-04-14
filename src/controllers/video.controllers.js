import mongoose , {isValidObjectId} from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespnose.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { asyncHanlder } from "../utils/asyncHandlers.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const uploadVideo = asyncHanlder(async (req, res) => {
  const { title, description } = req.body;

  if ([title, description].some((fields) => !fields)) {
    throw new ApiError(400, "All fields are required");
  }

  const user = req.user?._id;
  if (!user) {
    throw new ApiError(401, "User is not authenticated");
  }

  const videoLocalPath = req.files?.videofile?.[0]?.path;
  const thumbnailLocalPath = req?.files?.thumbnail?.[0]?.path;

  if (!videoLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "video and thumbnail should be uploaded");
  }

  let video;
  try {
    video = await uploadOnCloudinary(videoLocalPath);
  } catch (error) {
    throw new ApiError(400, "Something went wrong while uploading the video");
  }

  let thumbnail;
  try {
    thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  } catch (error) {
    await deleteFromCloudinary(videoLocalPath.public_id);
    throw new ApiError(
      400,
      "Something went wrong while uploading the thumbnail and the video was also deleted from the cloudinary"
    );
  }

  try {
    const videoUpload = await Video.create({
      videofile: video.url,
      thumbnail: thumbnail.url,
      title,
      description,
      duration: video.duration,
      owner: user,
    });

    const uploadedVideo = await Video.findById(videoUpload._id);

    if (!uploadedVideo) {
      throw new ApiError(400, "video not fount");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, uploadedVideo, "Video uploaded successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Something went wrong");
  }
});

const videoDelete = asyncHanlder(async (req, res) => {
  const id = req.params.id;

  if (!id) {
    throw new ApiError(400, "Video id is required");
  }

  const videoExists = await Video.findById(id);

  if (!videoExists) {
    throw new ApiError(400, "Video not found");
  }

  const videoDelete = await Video.deleteOne({ _id: id });

  if (!videoDelete) {
    throw new ApiError(400, "Video not deleted");
  }

  try {
    // Delete video file from Cloudinary
    if (videoExists.videofile?.public_id) {
      const videoResult = await deleteFromCloudinary(
        videoExists.videofile.public_id
      );
      console.log("Video Deletion Result from Cloudinary:", videoResult);
    } else {
      console.warn("No public_id found for the video file");
    }
  } catch (error) {
    console.error("Error deleting video file from Cloudinary:", error);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videoDelete, "Video deleted successfully"));
});

const updateTitleAndDescription = asyncHanlder(async (req, res) => {
  const { title, description } = req.body;

  const id = req.params.id;
  const user = req.user._id;

  const checkOwner = await Video.findOne({ owner: user });

  if (!checkOwner) {
    throw new ApiError(400, "Unauthorized access");
  }

  if (!id) {
    throw new ApiError(401, "Requested id does not found");
  }

  if (!title && !description) {
    throw new ApiError(
      400,
      "Provide either the description or title to update"
    );
  }

  const updateInfo = await Video.findByIdAndUpdate(
    id,
    {
      $set: {
        title: title,
        description: description,
      },
    },
    { new: true }
  );

  if (!updateInfo) {
    throw new ApiError(400, "Video info not updated");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updateInfo, "Video info updated successfully"));
});

const toggleIsPublished = asyncHanlder(async (req, res) => {
  const id = req.params.id;
  const user = req.user._id;

  const checkOwner = await Video.findOne({ owner: user });

  if (!id || !checkOwner) {
    throw new ApiError(
      400,
      "Either the id doesn't access or Unauthorized access to toggle"
    );
  }

  const video = await Video.findById(id);

  const toggleStatus = await Video.findOneAndUpdate(
    { _id: id },
    {
      $set: {
        isPublished: !video.isPublished,
      },
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, toggleStatus, "Toggle Public Status"));
});

const getVideo = asyncHanlder(async (req, res) => {
  const id = req.params.id;

  if (!id) {
    throw new ApiError(400, "User is required ");
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid user id");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
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
        from: "subscriptions",
        localField: "owner",
        foreignField: "subscriber",
        as: "subscribers",
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
        foreignField: "video",
        as: "comments",
      },
    },
    {
      $addFields: {
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.user"] },
            then: true,
            else: false,
          },
        },
        likes: {
          $size: "$likes",
        },
      },
    },
    {
      $addFields: {
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
        subscriberCount: {
          $size: "$subscribers",
        },
      },
    },
    {
      $addFields: {
        commentCount: {
          $size: "$comments",
        },
      },
    },
    {
      $project: {
        title: 1,
        videofile: 1,
        thumbnail: 1,
        description: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        isSubscribed: 1,
        subscriberCount: 1,
        commentCount: 1,
        isLiked: 1,
        likes: 1,
        "userDetails.username": 1,
        "userDetails.avatar": 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video fetched successfully"));
});

const getAllVideos = asyncHanlder(async (req , res) => {
  try {
    const allVideos = await Video.find()

    return res
           .status(200)
           .json(new ApiResponse(200 , allVideos , "all videos fetched successfully"))
  } catch (error) {
    throw new ApiError(500, "something went wrong while fetching the videos")
  }
})

export {
  uploadVideo,
  videoDelete,
  updateTitleAndDescription,
  toggleIsPublished,
  getVideo,
  getAllVideos
};
