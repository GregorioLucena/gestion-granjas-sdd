import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  BajaEngorde,
  ControlPeso,
  EngordeLote,
  Granja,
  Lote,
  MetodoPesaje,
  UnidadMedida,
} from '@gestion-granjas/database/entities';
import { PesosController } from './pesos.controller';
import { PesosService } from './pesos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ControlPeso,
      EngordeLote,
      BajaEngorde,
      Lote,
      Granja,
      MetodoPesaje,
      UnidadMedida,
    ]),
  ],
  controllers: [PesosController],
  providers: [PesosService],
})
export class PesosModule {}
