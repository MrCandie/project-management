import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    description: {
      type: String,
      required: [true, "Name is required"],
    },

    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },

    owner: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
    },
    project: {
      type: mongoose.Schema.ObjectId,
      ref: "Project",
      required: [true, "Project is required"],
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
      default: "pending",
      enum: ["pending", "ongoing", "completed", "overdue"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

const Task = mongoose.models.Task || mongoose.model("Task", schema);

export default Task;
