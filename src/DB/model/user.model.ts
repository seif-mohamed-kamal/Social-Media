import mongoose from "mongoose";
import { IUser } from "../../common/interface";
import { GenderEnum, ProviderEnum, RoleEnum } from "../../common/enum";

const userSchema = new mongoose.Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      minLength: [2, "firstname cannot be less than 2 characters"],
      maxLength: [25, "firstname cannot exceed 25 characters"],
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      minLength: [2, "lastname cannot be less than 2 characters"],
      maxLength: [25, "lastname cannot exceed 25 characters"],
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: function (this) {
        return this.provider == ProviderEnum.SYSTEM;
      },
    },
    age: Number,
    phone: String,

    gender: {
      type: Number,
      enum: GenderEnum,
      default: GenderEnum.MALE,
    },

    role: {
      type: Number,
      enum: RoleEnum,
      default: RoleEnum.USER,
    },
    provider: {
      type: Number,
      enum: ProviderEnum,
      default: ProviderEnum.SYSTEM,
    },

    profilePicture: String,
    coverPictures: [String],

    confirmEmail: Date,
    changeCreadintialTime: Date,
  },
  {
    collection: "Route_users",
    timestamps: true,
    strict: true,
    strictQuery: true,
    optimisticConcurrency: true,
    autoIndex: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.virtual("username").set(function(value:string){
    const [firstName , lastName] = value.split(" ") || [];
    this.firstName = firstName  as string;
    this.lastName = lastName  as string;
}).get(function(){
    return `${this.firstName} ${this.lastName}`
})

export const userModel = mongoose.models.user || mongoose.model<IUser>("user" , userSchema)