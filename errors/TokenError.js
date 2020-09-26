class TokenError extends Error {
  constructor(message) {
    super(message);
    this.status = 401;
    this.message = message;
  }
}

module.exports = TokenError;
