const { Schema, model, ObjectId} = require("mongoose")
const User = require('./User')

const MessageSchema = new Schema(
  {
    author: {
      type: ObjectId,
      ref: User,
      required: true
    },
    title: {type: String, required: true},
    text: {type: String, default: ""},
  },
  {
    timestamps: true
  }
)

const Message = model("Message", MessageSchema)

module.exports = Message
