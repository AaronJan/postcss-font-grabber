export class PostcssFontGrabberError extends Error {
  constructor(message: string) {
    super(`[postcss-font-grabber] ${message}`);
  }
}
