import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private users = []; // Mock DB

  async findByEmail(email: string) {
    return this.users.find(u => u.email === email.toLowerCase());
  }

  async findByRefreshTokenHash(tokenHash: string) {
    return this.users.find(u => u.refreshTokenHash === tokenHash);
  }

  async create(data: { email: string; name: string; passwordHash: string }) {
    const user = { ...data, email: data.email.toLowerCase(), id: Date.now().toString(), isActive: true };
    this.users.push(user);
    return user;
  }

  async updateRefreshToken(email: string, tokenHash: string) {
    const user = this.users.find(u => u.email === email.toLowerCase());
    if (user) user.refreshTokenHash = tokenHash;
  }

  async clearRefreshToken(email: string) {
    const user = this.users.find(u => u.email === email.toLowerCase());
    if (user) delete user.refreshTokenHash;
  }
}
