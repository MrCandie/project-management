import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: [true, "Token is required"],
    },

    expiry: {
      type: Date,
    },

    user: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: [true, "OTP must belong to a user"],
      },
    ],
    userId: {
      type: String,
      required: [true, "OTP must belong to a user"],
    },
    status: {
      type: String,
      default: "active",
      enum: ["active", "pending", "suspended"],
    },
    usertype: {
      type: String,
      enum: ["user"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

const Token = mongoose.models.Token || mongoose.model("Token", schema);

export default Token;
