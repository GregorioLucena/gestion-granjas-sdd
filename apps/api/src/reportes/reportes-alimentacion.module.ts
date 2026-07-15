import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Alimento,
  Almacen,
  ConsumoAlimento,
  Granja,
  Lote,
  MovimientoInventario,
  TipoMovimientoInventario,
} from '@gestion-granjas/database/entities';
import { ReportesAlimentacionController } from './reportes-alimentacion.controller';
import { ReportesAlimentacionService } from './reportes-alimentacion.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConsumoAlimento,
      MovimientoInventario,
      Granja,
      Lote,
      Alimento,
      Almacen,
      TipoMovimientoInventario,
    ]),
  ],
  controllers: [ReportesAlimentacionController],
  providers: [ReportesAlimentacionService],
})
export class ReportesAlimentacionModule {}
