import User from "../../models/User.js";
import FriendRequest from "../../models/friendRequest.js";

export async function getRecommandedUsers(req, res) {
    try {
        const currentUserId = req.user._id;
        const currentUser = req.user;

        const recommandedUsers = await User.find({
            $and: [
                { _id: { $ne: currentUserId } },
                { $id: { $nin: currentUser.friends } },
                { isOnboarded: true }
            ]
            })
            res.status(200).json(recommandedUsers );
                
    } catch (error) {
        console.error("Error in getRecommandedUsers:");
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export async function getMyFriends(req, res) {
    try {
        const user = await User.findById(req.user.id).select('friends')
        .populate('friends', 'fullName profilePic nativeLanguage learningLanguages');
        res.status(200).json(user.friends);
    } catch (error) {
        console.error("Error in getMyFriends contriller:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}



export async function sendFriendRequest(req, res) {

    try {
        const myId = req.user.id;
        const { id: recipientId }= req.params;
        //sending req to youself
        if(myId === recipientId) {
            return res.status(400).json({ message: "You cannot send friend request to yourself." });
        }

        const recipient = await User.findById(recipientId);
        if(!recipient) {
            return res.status(404).json({ message: "Recipient  not found." });
        }
        //check if user is already friends
        if(recipient.friends.includes(myId)) {
            return res.status(400).json({ message: "You are already friends with this user." });
        }

        //check if there is already 
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: myId, recipient: recipientId },
                { sender: recipientId, recipient: myId }
            ],
        });

        if(existingRequest) {
            return res.status(400).json({ message: "There is already a pending friend request between you and this user." });
        }

        const friendRequest = await FriendRequest.create({
            sender: myId,
            recipient: recipientId,
        });
        res.status(201).json(friendRequest);
    } catch (error) {
        console.error("Error in sendFriendRequest controller:", error.message);
        res.status(500).json({ message: "Internal Server Error" }); 
    }
}

export async function acceptFriendRequest(req, res) {
   try {
    const { id: requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);
    if(!friendRequest) {
        return res.status(404).json({ message: "Friend request not found." });
    }

    //Verify that the logged-in user is the recipient of the friend request
    if(friendRequest.recipient.toString() !== req.user.id) {
        return res.status(403).json({ message: "You are not authorized to accept this friend request." });
    }
    friendRequest.status = "accepted";
    await friendRequest.save();

    //add each other to friends list
    await User.findByIdAndUpdate(friendRequest.sender, {
        $addToSet: { friends: friendRequest.recipient }
    });
    await User.findByIdAndUpdate(friendRequest.recipient, {
        $addToSet: { friends: friendRequest.sender }
    });

    res.status(200).json({ message: "Friend request accepted." });

   } catch (error) {
    console.error("Error in acceptFriendRequest controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
   }
}


export async function getFriendRequest(req, res) {
    try {
        const incomingReqs = await FriendRequest.find({
            recipient: req.user.id,
            status: "pending"
        }).populate('sender', 'fullName profilePic nativeLanguage learningLanguages');

        const acceptedReqs = await FriendRequest.find({
            recipient: req.user.id,
            status: "accepted"
        }).populate("recipient", 'fullName profilePic'); 

        res.status(200).json({ incomingReqs, acceptedReqs });
    } catch (error) {
        console.error("Error in getFriendRequest controller:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}


export async function getOutgoingFriendReqs(req, res) {
    try {
        const outgoingRequests = await FriendRequest.find({
            sender: req.user.id,
            status: "pending",
        }).populate('recipient', 'fullName profilePic nativeLanguage learningLanguages');
        res.status(200).json(outgoingRequests);
    } catch (error) {
        console.error("Error in getOutgoingFriendReqs controller:", error.message);
        res.status(500).json({ message: "Internal Server Error" });  
    }
}


