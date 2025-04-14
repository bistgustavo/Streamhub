import { Router } from "express";
import {
  subscriberToChannel,
  getAllSubscriber,
  getChannelSubscribedTo,
} from "../controllers/subscription.controllers.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/toggleSubscribe/:id").post(verifyJwt, subscriberToChannel);

router.route("/getAllSubscribers/:id").get(verifyJwt, getAllSubscriber);

router
  .route("/getChannelSubscribedTo/:id")
  .get(verifyJwt, getChannelSubscribedTo);

export default router;
