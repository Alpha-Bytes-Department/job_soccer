import { model, Schema } from "mongoose";
import { CandidateRole, EmployerRole, TBaseUser } from "./user.interface";
import { Auth } from "../auth/auth.model";
const userSchema = new Schema<TBaseUser>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: [1, "First name must be at least 1 characters long"],
      maxlength: [50, "First name can't be more than 50 characters"],
      match: [
        /^[a-zA-ZÀ-ÿ\u00f1\u00d1'-\s]+$/,
        "First name contains invalid characters",
      ],
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: [1, "Last name must be at least 1 characters long"],
      maxlength: [50, "Last name can't be more than 50 characters"],
      match: [
        /^[a-zA-ZÀ-ÿ\u00f1\u00d1'-\s]+$/,
        "Last name contains invalid characters",
      ],
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (value: string) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value);
        },
        message: "Please provide a valid email",
      },
    },
    profileImage: {
      type: String,
      trim: true,
      default: null,
    },
    bannerImage: {
      type: String,
      trim: true,
      default: null,
    },
    profileId: {
      type: String,
      required: false,
      default: null,
      trim: true,
    },
    authId: { type: Schema.Types.ObjectId, ref: "Auth", required: true },
    isVerified: { type: Boolean, default: false },
    role: {
      type: String,
      enum: [...Object.values(EmployerRole), ...Object.values(CandidateRole)],
      required: function (): boolean {
        return (this as any).userType !== "admin";
      },
    },
    userType: {
      type: String,
      enum: ["candidate", "employer", "admin"],
      required: true,
    },
    stripeCustomerId: {type:String,default:null},
    activeSubscriptionId: { type: Schema.Types.ObjectId, ref: "Subscription" },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
userSchema.index({ email: 1 });
userSchema.index({ authId: 1 });
userSchema.index({ profileId: 1 });
userSchema.index({ userType: 1, role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ isVerified: 1 });
userSchema.index({ createdAt: -1 });
// this for text search in names
userSchema.index({ firstName: "text", lastName: "text" });
// Compound indexes for employer queries optimization
userSchema.index({ userType: 1, isDeleted: 1, profileId: 1, role: 1, createdAt: -1 });
userSchema.index({ isDeleted: 1 });

userSchema.pre("save", async function (next) {
  if (this.isModified("email")) {
    const auth = await Auth.findById(this.authId);
    if (auth) {
      auth.email = this.email;
      await auth.save();
    }
  }

  // Validate role matches userType
  if (this.userType === "candidate") {
    const isCandidateRole = Object.values(CandidateRole).includes(
      this.role as CandidateRole
    );
    if (!isCandidateRole) {
      return next(new Error("Invalid role for candidate userType"));
    }
  } else if (this.userType === "employer") {
    const isEmployerRole = Object.values(EmployerRole).includes(
      this.role as EmployerRole
    );
    if (!isEmployerRole) {
      return next(new Error("Invalid role for employer userType"));
    }
  }

  next();
});

//exist user check
userSchema.statics.isExistUserById = async (id: string) => {
  const isExist = await User.findById(id);
  return isExist;
};

userSchema.statics.isExistUserByEmail = async (email: string) => {
  const isExist = await User.findOne({ email });
  return isExist;
};
export const User = model<TBaseUser>("User", userSchema, "users");
