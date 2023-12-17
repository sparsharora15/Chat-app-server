const { conversationModel, ChatModel } = require("../models/conversationModel");
const mongoose = require("mongoose");

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

const broadcastMesssage = async (req, res) => {
  try {
    // Validate required keys
    const { sender, text, receivers } = req.body;

    if (
      !sender ||
      !text ||
      !receivers ||
      !Array.isArray(receivers) ||
      receivers.length === 0
    ) {
      return res.status(400).json({
        error: "Invalid request. Please provide sender, text, and receivers.",
      });
    }

    // Convert receiver array to ObjectId array
    const receiverIds = receivers.map((receiver) => receiver);

    // Create a new chat message for each receiver
    const chatPromises = receiverIds.map(async (receiverId) => {
      const newChat = new ChatModel({ sender, text, receiver: receiverId });
      return newChat.save();
    });

    // Wait for all chat messages to be saved
    const savedChats = await Promise.all(chatPromises);

    // Create a conversation for each receiver if it doesn't exist
    const conversationPromises = receiverIds.map(async (receiverId) => {
      const conversation = await conversationModel.findOne({
        members: { $all: [sender, receiverId] },
      });

      if (!conversation) {
        const newConversation = new conversationModel({
          members: [sender, receiverId],
          messages: [
            savedChats.find((chat) => chat.receiver.equals(receiverId))._id,
          ],
        });
        return newConversation.save();
      } else {
        // Add the message to the existing conversation
        conversation.messages.push(
          savedChats.find((chat) => chat.receiver.equals(receiverId))._id
        );
        return conversation.save();
      }
    });

    // Wait for all conversations to be saved
    await Promise.all(conversationPromises);

    res.status(200).json({ message: "Messages broadcasted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.body;
    const conversation = await conversationModel
      .findById(conversationId)
      .populate("messages")
      .select("-_id -updatedAt -__v")
      .exec();

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Access the populated messages here

    return res.json(conversation);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
};

const sendMultimedia = async (req, res) => {
  try {
    const { sender, receiver } = req.body;
    let mediaUrl = null; // Default to null

    if (req.file && req.file.buffer) {
      // Upload media to Cloudinary
      const cloudinaryResponse = await cloudinary.uploader
        .upload_stream({ resource_type: "auto" }, (error, result) => {
          if (error) {
            console.error(error);
            return res
              .status(500)
              .json({ error: "Error uploading media to Cloudinary" });
          }
          mediaUrl = result.secure_url;
        })
        .end(req.file.buffer);
    }

    // Create a new chat message
    const newChat = new ChatModel({ sender, receiver, media: mediaUrl });
    const savedChat = await newChat.save();

    // Add the message to the existing conversation or create a new one
    const conversation = await conversationModel.findOne({
      members: [sender, receiver], // Array with only two members
    });

    if (!conversation) {
      const newConversation = new conversationModel({
        members: [sender, receiver],
        messages: [savedChat._id],
      });
      await newConversation.save();
    } else {
      conversation.messages.push(savedChat._id);
      await conversation.save();
    }

    res.status(200).json({ message: "Multimedia message sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

const conversationBetweenTwoUsers = async (req, res) => {
  try {
    const senderId = req.body.senderId;
    const receiverId = req.body.receiverId;

    const conversation = await conversationModel.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
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
module.exports = {
  sendMultimedia,
  createChat,
  getConversation,
  conversationBetweenTwoUsers,
  broadcastMesssage,
};
