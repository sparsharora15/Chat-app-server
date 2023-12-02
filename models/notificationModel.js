const mongoose = require("mongoose");
const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, autoIndex: false }
);

const notificationModel = mongoose.model("notification", notificationSchema);
module.exports = notificationModel;
