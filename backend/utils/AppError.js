// A typed error services/controllers can throw. The central error middleware
// reads statusCode off of it to respond correctly instead of always 500.
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}
