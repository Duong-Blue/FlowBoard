import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private users = []; // Mock DB

  async findByEmail(email: string) {
    return this.users.find(u => u.email === email.toLowerCase());
  }

  async findById(id: string) {
    return this.users.find(u => u.id === id);
  }

  async create(data: { email: string; password: string }) {
    const password = await bcrypt.hash(data.password, 12);
    const user = { ...data, email: data.email.toLowerCase(), password, id: Date.now().toString() };
    this.users.push(user);
    return user;
  }

  async updateLastLogin(id: string) {
    const user = this.users.find(u => u.id === id);
    if (user) user.lastLogin = new Date();
    return user;
  }
}
