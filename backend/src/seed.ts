// Standalone seed script for CI/CD pipeline
// Usage: MONGODB_URI="mongodb+srv://..." npx ts-node src/seed.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeedService } from './database/seed.service';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedService = app.get(SeedService);
  await seedService.seed();
  await app.close();
  console.log('✅ Database seeding complete!');
}

run().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
