import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Compania, Granja, Lote, Ubicacion } from '@gestion-granjas/database/entities';
import { GranjasController } from './granjas.controller';
import { GranjasService } from './granjas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Granja, Compania, Ubicacion, Lote])],
  controllers: [GranjasController],
  providers: [GranjasService],
})
export class GranjasModule {}
