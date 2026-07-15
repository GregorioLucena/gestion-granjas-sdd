import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  BajaEngorde,
  CierreEngorde,
  ConsumoAlimento,
  ControlPeso,
  EngordeLote,
  Granja,
  Lote,
  MetodoPesaje,
  MotivoBajaEngorde,
  MotivoCierreEngorde,
  UnidadMedida,
} from '@gestion-granjas/database/entities';
import { EngordeController } from './engorde.controller';
import { EngordeService } from './engorde.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EngordeLote,
      BajaEngorde,
      CierreEngorde,
      ControlPeso,
      ConsumoAlimento,
      Lote,
      Granja,
      MotivoBajaEngorde,
      MotivoCierreEngorde,
      MetodoPesaje,
      UnidadMedida,
    ]),
  ],
  controllers: [EngordeController],
  providers: [EngordeService],
  exports: [EngordeService],
})
export class EngordeModule {}
