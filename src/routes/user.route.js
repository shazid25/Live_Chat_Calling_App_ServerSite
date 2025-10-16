import express from 'express';
import { protectRoute } from "../middleware/auth.middleware.js"
import { acceptFriendRequest, getFriendRequest, getMyFriends, getOutgoingFriendReqs, getRecommandedUsers, sendFriendRequest } from './controllers/user.controller.js';

const router = express.Router();

router.use(protectRoute);

router.get("/", getRecommandedUsers);
router.get("/friends",getMyFriends);

router.post("/friend-request/:id", sendFriendRequest); 
router.put("/friend-request/:id/accept", acceptFriendRequest);

router.get("/friend-request", getFriendRequest);
router.get("/outgoing-friend-requests", getOutgoingFriendReqs);


export default router;