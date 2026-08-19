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
import { ConsumoController } from './consumo.controller';
import { ConsumoService } from './consumo.service';
import { AsistenteModule } from '../asistente/asistente.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConsumoAlimento,
      Lote,
      Granja,
      Alimento,
      Almacen,
      TipoMovimientoInventario,
      MovimientoInventario,
    ]),
    AsistenteModule,
  ],
  controllers: [ConsumoController],
  providers: [ConsumoService],
})
export class ConsumoModule {}
