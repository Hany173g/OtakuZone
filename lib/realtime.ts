export function emitToUser(userId: string, event: string, payload: any) {
  try {
    if (global.io) {
      global.io.to(`user:${userId}`).emit(event, payload)
    }
  } catch {
    // ignore
  }
}
