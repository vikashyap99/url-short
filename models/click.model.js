import mongoose from "mongoose";

const clickSchema = new mongoose.Schema(
  {
    urlId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "URL",
      required: true,
      index: true,
    },
    shortId: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    ip: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    referer: {
      type: String,
      default: null,
    },
  },
  { timestamps: false },
);

clickSchema.index({ urlId: 1, timestamp: -1 });
clickSchema.index({ shortId: 1, timestamp: -1 });
clickSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 86400 });

export const Click = mongoose.model("Click", clickSchema);
