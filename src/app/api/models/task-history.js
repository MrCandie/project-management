import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, "Name is required"],
    },

    actor: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
    },
    task: {
      type: mongoose.Schema.ObjectId,
      ref: "Task",
      required: [true, "Task is required"],
    },
    project: {
      type: mongoose.Schema.ObjectId,
      ref: "Project",
      required: [true, "Project is required"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

const TaskHistory =
  mongoose.models.TaskHistory || mongoose.model("TaskHistory", schema);

export default TaskHistory;
