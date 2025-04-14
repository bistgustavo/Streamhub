import { Router } from "express";
import { createTweet,
     editTweet,
     deleteTweet,
     getTweet
} from "../controllers/tweet.controllers.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/postTweet").post(verifyJwt, createTweet);

router.route("/editTweet/:id").patch(verifyJwt, editTweet);

router.route("/deleteTweet/:id").delete(verifyJwt, deleteTweet);

router.route("/getTweet/:id").get(verifyJwt, getTweet);



export default router;
