import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI!

let cached = global as unknown as { mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } }

cached.mongoose = cached.mongoose || { conn: null, promise: null }

export async function connectDB() {
  if (cached.mongoose.conn) return cached.mongoose.conn

  if (!cached.mongoose.promise) {
    cached.mongoose.promise = mongoose.connect(MONGODB_URI)
  }

  cached.mongoose.conn = await cached.mongoose.promise
  return cached.mongoose.conn
}
