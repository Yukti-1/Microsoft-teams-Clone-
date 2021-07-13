const mongoose = require("mongoose");
const msgSchema = new mongoose.Schema({
  uid: { type: String },
  name: { type: String },
  msg: {
    type: String,
    required: true,
  },
});

const Msg = mongoose.model("msg", msgSchema);
module.exports = Msg;

var user = new mongoose.Schema({
  username: { type: String, lowercase: true, unique: true },
  email: { type: String, lowercase: true, unique: true },
  password: String,
  is_active: { type: Boolean, default: false },
});
