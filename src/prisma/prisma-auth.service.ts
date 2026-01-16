import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { join } from 'path';

// Type-only import to satisfy TypeScript
import type { PrismaClient as PrismaClientType } from '../../prisma/generated/client-auth';

// Runtime import using absolute path stable for src/ and dist/

const { PrismaClient } = require(
  join(process.cwd(), 'prisma/generated/client-auth'),
);

@Injectable()
export class PrismaAuthService
  extends (PrismaClient as { new (options?: any): PrismaClientType })
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const pool = new Pool({
      connectionString: String(process.env.DATABASE_AUTH_URL),
    });

    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: ['error', 'warn'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('Connected to Auth Database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('Disconnected from Auth Database');
  }
}
