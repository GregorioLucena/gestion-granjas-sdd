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
  TipoAnimal,
} from '@gestion-granjas/database/entities';
import { ReportesEngordeController } from './reportes-engorde.controller';
import { ReportesEngordeService } from './reportes-engorde.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EngordeLote,
      CierreEngorde,
      BajaEngorde,
      ControlPeso,
      ConsumoAlimento,
      Granja,
      Lote,
      TipoAnimal,
    ]),
  ],
  controllers: [ReportesEngordeController],
  providers: [ReportesEngordeService],
})
export class ReportesEngordeModule {}
