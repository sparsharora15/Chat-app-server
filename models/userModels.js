const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    friendList: {
      type: Array,
    },
    sentRequestList: {
      type: Array,
    },
    receiveRequestList: {
      type: Array,
    },
    password: {
      type: String,
      required: true,
    },
    userNotifications:{
      type: [mongoose.Schema.Types.ObjectId],
      ref: "notification",
      required: true,
    }
  },
  { timestamps: true, autoIndex: false }
);

const userModel = mongoose.model("Users", userSchema);
module.exports = userModel;
