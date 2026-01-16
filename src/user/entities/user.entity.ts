import { User as PrismaUser } from '../../../prisma/generated/client-auth';

export class User implements PrismaUser {
  id: number;
  name: string;
  email: string;
  username: string;
  password: string;
  isActive: boolean; // 🔹 ESTE FALTABA
  createdAt: Date;
  updatedAt: Date;
}
