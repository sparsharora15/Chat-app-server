const userModel = require("../models/userModels");
const md5 = require("md5");
const jwt = require("jsonwebtoken");
const sercretKey= "kfkr%^&*&^%^%cuelnn%%%$$#$#%^yr7ghtigntikjf"
const notificationModel = require("../models/notificationModel");
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || email.trim() === "") {
      return res.status(200).json({ msg: "Invalid email address" });
    }
    if (!name || name.trim() === "") {
      return res.status(200).json({ msg: "Name is required" });
    }

    if (!password || password.length < 6) {
      return res
        .status(200)
        .json({ msg: "Password must be at least 6 characters long" });
    }
    const user = await userModel.findOne({ email: email });
    if (user) {
      return res.status(200).json({ msg: "email already registered" });
    }
    const encryptPassword = md5(password);
    const saveUser = new userModel({
      name: name,
      email: email,
      password: encryptPassword,
    });
    await saveUser.save();
    return res.status(200).json({ msg: "User created successfully" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ msg: "An unexpected error occurred" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const errors = [];
    if (!email || email.trim() === "") {
      return res.status(400).json({ error: "Invalid email address" });
    }

    const user = await userModel.findOne({ email: email });
    if (!user) {
      return res.status(400).json({ error: "Email not found" });
    }
    if (user.password !== md5(password)) {
      return res.status(401).json({ error: "Incorrect password" });
    }
    const token = jwt.sign(
      { email: email, _id: user._id },
      process.env.sercretKey || sercretKey
    );
    return res.status(200).json({ msg: "Logged in", token: token });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
};

const getUsersList = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const friendList = user.friendList || [];

    const userList = await userModel
      .find({
        _id: { $ne: userId, $nin: friendList },
      })
      .select("-email -password");

    return res.status(200).json(userList);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
};

const sendFriendRequest = async (req, res) => {
  try {
    const { userId, friendId } = req.body;

    const userSendingRequest = await userModel.findById(userId);
    if (!userSendingRequest) {
      return res.status(404).json({ message: "User not found." });
    }

    const friendUser = await userModel.findById(friendId);
    if (!friendUser) {
      return res.status(404).json({ message: "Friend user not found." });
    }

    if (userSendingRequest.sentRequestList.includes(friendId)) {
      return res.status(400).json({ message: "Friend request already sent." });
    }

    if (userSendingRequest._id.toString() === friendUser._id.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot send friend request to yourself." });
    }

    userSendingRequest.sentRequestList.push(friendId);
    await userSendingRequest.save();
    friendUser.receiveRequestList.push(userId);
    await friendUser.save();

    res.status(200).json({ message: "Friend request sent successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};

const handleFriendRequest = async (req, res) => {
  try {
    const { userId, friendId, action } = req.body;

    const acceptingUser = await userModel.findById(userId);
    if (!acceptingUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const friendUser = await userModel.findById(friendId);
    if (!friendUser) {
      return res.status(404).json({ message: "Friend user not found." });
    }

    if (action === "accept") {
      if (!acceptingUser.receiveRequestList.includes(friendId)) {
        return res.status(400).json({ message: "Friend request not found." });
      }

      // Accept the friend request
      await userModel.findByIdAndUpdate(userId, {
        $pull: {
          receiveRequestList: friendId,
        },
        $addToSet: {
          friendList: friendId,
        },
      });
      await userModel.findByIdAndUpdate(friendId, {
        $pull: {
          sentRequestList: userId,
        },
        $addToSet: {
          friendList: userId,
        },
      });

      const notificationTitle = "Friend Request Accepted";
      const notificationDescription = `${acceptingUser.name} accepted your friend request.`;
      await setUserNotifications(
        friendId,
        notificationTitle,
        notificationDescription
      );

      return res
        .status(200)
        .json({ message: "Friend request accepted successfully." });
    } else if (action === "reject") {
      // Reject the friend request
      if (!acceptingUser.receiveRequestList.includes(friendId)) {
        return res.status(400).json({ message: "Friend request not found." });
      }

      acceptingUser.receiveRequestList =
        acceptingUser.receiveRequestList.filter((id) => id !== friendId);
      friendUser.sentRequestList = friendUser.sentRequestList.filter(
        (id) => id !== userId
      );

      await acceptingUser.save();
      await friendUser.save();

      return res
        .status(200)
        .json({ message: "Friend request rejected successfully." });
    } else {
      return res.status(400).json({ message: "Invalid action." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};
const userDetails = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await userModel
      .findById(userId)
      .select("-email -password -receiveRequestList ");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ userDetails: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};
const getAllFriendRequests = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const friendRequestIds = user.receiveRequestList;

    const friendRequests = await userModel.find(
      { _id: { $in: friendRequestIds } },
      "name"
    );

    res.status(200).json({ friendRequests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};

const getAllFriendsList = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const friendList = await userModel.find({ _id: { $in: user.friendList } });

    res.status(200).json(friendList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};
const setUserNotifications = async (userId, title, description) => {
  try {
    const newNotification = new notificationModel({
      title: title,
      description: description,
    });
    await newNotification.save();

    const user = await userModel.findByIdAndUpdate(userId, {
      $push: {
        userNotifications: newNotification._id,
      },
    });

    if (!user) {
      throw new Error("User not found.");
    }
  } catch (error) {
    console.error(error);
    // Handle the error appropriately, you might want to log it or perform other actions.
  }
};

const getNotifications = async (req, res) => {
  try {
    const { userId } = req.body;
    const notifications = await userModel
      .findById(userId)
      .populate("userNotifications")
      .select("-_id -updatedAt -__v") // Exclude these fields from conversation
      .exec();

    if (!notifications) {
      return res.status(404).json({ error: "Notifications not found" });
    }

    return res.json(notifications);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
};
module.exports = {
  register,
  login,
  getUsersList,
  sendFriendRequest,
  handleFriendRequest,
  userDetails,
  getAllFriendsList,
  getAllFriendRequests,
  setUserNotifications,
  getNotifications,
};
