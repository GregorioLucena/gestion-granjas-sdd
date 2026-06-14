import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from '@gestion-granjas/database/entities';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities,
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
    }),
    HealthModule,
  ],
})
export class AppModule {}
