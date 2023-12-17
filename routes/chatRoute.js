const express = require("express");
const router = express.Router();
const {
  createChat,
  getConversation,
  conversationBetweenTwoUsers,
  broadcastMesssage,
  sendMultimedia,
} = require("../controllers/chatController");
const { authUser } = require("../middleware/auth");
const upload = require("../middleware/multiMedia");

router.post("/createChat", authUser, createChat);
router.post("/broadcastMesssage", authUser, broadcastMesssage);
router.post("/getConversation", authUser, getConversation);
router.post("/sendMultimedia", authUser, upload.single("file"), sendMultimedia);
router.post("/getChats", authUser, conversationBetweenTwoUsers);

module.exports = router;
