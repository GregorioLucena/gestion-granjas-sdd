import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  FinalidadProductiva,
  Granja,
  Lote,
  TipoAnimal,
  Ubicacion,
} from '@gestion-granjas/database/entities';
import { LotesController } from './lotes.controller';
import { LotesService } from './lotes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Lote, Granja, TipoAnimal, FinalidadProductiva, Ubicacion])],
  controllers: [LotesController],
  providers: [LotesService],
})
export class LotesModule {}
