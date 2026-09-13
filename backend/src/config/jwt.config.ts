export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'super-secret-key',
  expiresIn: '1d',
};
