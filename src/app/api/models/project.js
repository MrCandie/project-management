import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    description: {
      type: String,
      required: false,
    },

    expiry: {
      type: Date,
    },

    owner: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "OTP must belong to a user"],
    },

    members: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: false,
      },
    ],

    status: {
      type: String,
      default: "active",
      enum: ["active", "pending", "suspended"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

const Project = mongoose.models.Project || mongoose.model("Project", schema);

export default Project;
