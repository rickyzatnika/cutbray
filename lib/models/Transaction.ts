import mongoose, { Schema, Document } from "mongoose"
import type { Tier } from "@/lib/limits"

export interface ITransaction extends Document {
  user: mongoose.Types.ObjectId
  tier: Tier
  amount: number
  status: "pending" | "success" | "failed"
  paymentMethod: "midtrans" | "demo"
  paymentRef: string
  verifiedByAdmin: boolean
  verifiedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const TransactionSchema = new Schema<ITransaction>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tier: { type: String, enum: ["pro", "ultra"], required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    paymentMethod: { type: String, enum: ["midtrans", "demo"], default: "demo" },
    paymentRef: { type: String, default: "" },
    verifiedByAdmin: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

export const Transaction =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema)
