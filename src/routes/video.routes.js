import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import {
  uploadVideo,
  videoDelete,
  updateTitleAndDescription,
  toggleIsPublished,
  getVideo,
  getAllVideos,
} from "../controllers/video.controllers.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/uploadVideo").post(
  upload.fields([
    {
      name: "videofile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  verifyJwt,
  uploadVideo
);

router.route("/deleteVideo/:id").delete(verifyJwt, videoDelete);

router
  .route("/updateTitleOrDescription/:id")
  .patch(verifyJwt, updateTitleAndDescription);

router.route("/toggle/publish/:id").post(verifyJwt, toggleIsPublished);

router.route("/getVideo/:id").get(verifyJwt, getVideo);

router.route("/getAllVideos").get(getAllVideos);

export default router;
