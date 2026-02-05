import connectDB from './mongodb'

// Helper function to ensure DB connection before operations
export async function withDB<T>(fn: () => Promise<T>): Promise<T> {
  await connectDB()
  return fn()
}

