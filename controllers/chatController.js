const { conversationModel, ChatModel } = require("../models/conversationModel");


const createChat = async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;
    const errors = [];


    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const checkIfChat = await conversationModel.findOne({
      members: { $all: [senderId, receiverId] },
    });

    const createMessage = new ChatModel({
      sender: senderId,
      receiver: receiverId,
      text: message,
    });

    const messageId = await createMessage.save();

    if (checkIfChat) {
      await conversationModel.findByIdAndUpdate(checkIfChat._id, {
        $push: {
          messages: messageId._id,
        },
      });
      return res.send(messageId);
    } else {
      const createConversation = new conversationModel({
        members: [senderId, receiverId],
        messages: [messageId._id], 
      });
      const result = await createConversation.save();
      res.send(messageId);
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
};


const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.body;
    const conversation = await conversationModel
      .findById(conversationId)
      .populate("messages")
      .select("-_id -updatedAt -__v") // Exclude these fields from conversation
      .exec();

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Access the populated messages here
    console.log(conversation.messages);

    return res.json(conversation);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
};
const conversationBetweenTwoUsers = async (req, res) => {
  try {
    const senderId = req.body.senderId;
    const receiverId = req.body.receiverId;

    const conversation = await conversationModel.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      console.error("Conversation not found");
      return res.status(400).json({ message: "Conversation not found" });
    }

    const chatMessages = await ChatModel.find({
      _id: { $in: conversation.messages },
    }).sort({ createdAt: 1 });

    res.status(200).json(chatMessages);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = { createChat, getConversation, conversationBetweenTwoUsers };
