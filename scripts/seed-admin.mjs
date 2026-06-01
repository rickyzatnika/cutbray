// Seed script: node scripts/seed-admin.mjs
// Bikin user pertama jadi admin

import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI || ""

if (!MONGODB_URI) {
  console.error("MONGODB_URI not set in .env")
  process.exit(1)
}

const email = process.argv[2]
if (!email) {
  console.error("Usage: node scripts/seed-admin.mjs <email>")
  process.exit(1)
}

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    image: String,
    role: { type: String, default: "user" },
    subscription: {
      tier: { type: String, default: "free" },
      startDate: Date,
      endDate: Date,
      paymentVerified: { type: Boolean, default: false },
    },
    dailyUsage: {
      date: { type: String, default: "" },
      count: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
)

const User = mongoose.models.User || mongoose.model("User", UserSchema)

async function seed() {
  await mongoose.connect(MONGODB_URI)
  console.log("Connected to MongoDB")

  const existingAdmin = await User.findOne({ role: "admin" })
  if (existingAdmin) {
    console.log(`Admin already exists: ${existingAdmin.name} (${existingAdmin.email})`)
    await mongoose.disconnect()
    return
  }

  const user = await User.findOne({ email })
  if (!user) {
    console.log(`User ${email} not found`)
    await mongoose.disconnect()
    return
  }

  user.role = "admin"
  await user.save()
  console.log(`User ${email} is now admin`)
  await mongoose.disconnect()
}

seed().catch(console.error)
