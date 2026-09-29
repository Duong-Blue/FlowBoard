export const jwtConfig = {
  get secret(): string {
    return process.env.JWT_SECRET;
  },
  expiresIn: '15m',
};
