import mongoose, { Schema, Document } from "mongoose"

export interface IUser extends Document {
  name: string
  email: string
  password?: string
  image?: string
  role: "user" | "admin"
  emailVerified: Date | null
  subscription: {
    tier: "free" | "pro" | "ultra"
    startDate?: Date
    endDate?: Date
    paymentVerified: boolean
  }
  dailyUsage: {
    date: string
    count: number
  }
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    image: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    emailVerified: { type: Date, default: null },
    subscription: {
      tier: { type: String, enum: ["free", "pro", "ultra"], default: "free" },
      startDate: { type: Date },
      endDate: { type: Date },
      paymentVerified: { type: Boolean, default: false },
    },
    dailyUsage: {
      date: { type: String, default: "" },
      count: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
)

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema)
