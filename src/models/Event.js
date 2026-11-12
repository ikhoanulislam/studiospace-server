const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  location: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  endDate: { type: Date, default: null },
  image: { type: String, default: "" },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  hostName: { type: String, default: "StudioSpace Host" },
}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);
