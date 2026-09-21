import { ProjectMember } from '@prisma/client'; // Adjust import path as needed

declare global {
  namespace Express {
    interface Request {
      projectMember?: ProjectMember; // Add the property
      user?: { id: string }; // Assuming JwtAuthGuard adds user.id
    }
  }
}
