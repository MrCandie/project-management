import mongoose from "mongoose";
import validator from "validator";

const schema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      default: null,
      trim: true,
    },
    lastName: {
      type: String,
      default: null,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      validate: [validator.isEmail, "enter a valid email address"],
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },

    password: {
      type: String,
      trim: true,
      minlength: [7, "Password cannot be less than 7 digits"],
      required: false,
      select: false,
    },

    status: {
      type: String,
      default: "active",
      enum: ["suspended", "inactive", "active", "archived"],
    },

    projects: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Project",
        required: false,
      },
    ],
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

const User = mongoose.models.User || mongoose.model("User", schema);

export default User;
