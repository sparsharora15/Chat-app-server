const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getUsersList,
  sendFriendRequest,
  handleFriendRequest,
  userDetails,
  getAllFriendRequests,
  getAllFriendsList,
  getNotifications,
} = require("../controllers/userControllers");
const { authUser } = require("../middleware/auth");
const upload = require("../middleware/profilePic");

router.post("/register", upload.single("profilePicture"), register);
router.post("/login", login);
router.post("/list", authUser, getUsersList);
router.post("/sendFriendRequest", authUser, sendFriendRequest);
router.post("/handleFriendRequest", authUser, handleFriendRequest);
router.post("/userDetails", authUser, userDetails);
router.post("/getAllFriendRequests", authUser, getAllFriendRequests);
router.post("/getAllFriendsList", authUser, getAllFriendsList);
router.post("/getNotifications", authUser, getNotifications);

module.exports = router;
