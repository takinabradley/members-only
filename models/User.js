const { Schema, model } = require("mongoose")

const UserSchema = new Schema({
  username: {
    type: String, 
    minLength: 3, 
    trim: true, 
    required: true, 
    unique: true,    // The unique option is NOT a validator, it's for indexing.

    validate: {      // Actual validation of username property
      validator: async function(username) {
        // if a user with the username already exists, fail validation
        const userExists = await model("User").findOne({username})
        return userExists ? false : true
      },
      message: "username is unavailable"
    }
  },
  isMember: { type: Boolean, default: false},
  isAdmin: { type: Boolean, default: false},
  passwordHash: { type: String, required: true }
})

UserSchema.virtual('canViewMemberOnlyContent').get(function () {
  return this.isMember || this.isAdmin || false
})

const User = model("User", UserSchema)

module.exports = User
