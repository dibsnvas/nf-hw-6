const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ChatSchema = new Schema({
  participants: [{ type: Schema.Types.ObjectId, ref: "User" }], // Array of user IDs
  messages: [
    {
      author: { type: Schema.Types.ObjectId, ref: "User" },
      message: String,
      time: String,
    },
  ],
});

module.exports = mongoose.model("Chat", ChatSchema);
