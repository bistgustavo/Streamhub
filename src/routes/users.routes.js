import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccoutDetails,
  changeUserAvatar,
  changeUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
} from "../controllers/users.controllers.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router = Router();

//unsecured routes
router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
router.route("/refresh").post(refreshAccessToken);

//secured routes
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/change-password").post(verifyJwt, changeCurrentPassword);
router.route("/me").get(verifyJwt, getCurrentUser);
router.route("/c/:username").get(verifyJwt, getUserChannelProfile);
router.route("/update-account").patch(verifyJwt, updateAccoutDetails);
router
  .route("/update-avatar")
  .patch(verifyJwt, upload.single("avatar"), changeUserAvatar);
router
  .route("/update-cover")
  .patch(verifyJwt, upload.single("coverImage"), changeUserCoverImage);
router.route("/history").get(verifyJwt, getWatchHistory);

export default router;
