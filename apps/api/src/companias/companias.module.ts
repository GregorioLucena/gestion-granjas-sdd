import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Compania, Granja } from '@gestion-granjas/database/entities';
import { CompaniasController } from './companias.controller';
import { CompaniasService } from './companias.service';

@Module({
  imports: [TypeOrmModule.forFeature([Compania, Granja])],
  controllers: [CompaniasController],
  providers: [CompaniasService],
  exports: [CompaniasService],
})
export class CompaniasModule {}
