const express = require("express");
const router = express.Router();
const {
  createChat,
  getConversation,
  conversationBetweenTwoUsers
} = require("../controllers/chatController");
const { authUser } = require("../middleware/auth");

router.post("/createChat",authUser, createChat);
router.post("/getConversation",authUser, getConversation);
router.post("/getChats",authUser, conversationBetweenTwoUsers);

module.exports = router;
