import { model, Schema } from "mongoose";
import { TEmailSubscription } from "./emailSubscription.interface";

const emailSubscriptionSchema = new Schema<TEmailSubscription>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const EmailSubscription = model<TEmailSubscription>(
  "EmailSubscription",
  emailSubscriptionSchema
);
