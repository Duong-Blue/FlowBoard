export const jwtConfig = {
  get secret(): string {
    return process.env.JWT_SECRET || 'secret';
  },
  expiresIn: '15m',
};
