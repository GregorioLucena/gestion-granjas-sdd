import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Alimento,
  Almacen,
  Granja,
  MovimientoInventario,
  PresentacionAlimento,
  Proveedor,
  TipoAlimento,
  TipoMovimientoInventario,
  Ubicacion,
  UnidadMedida,
} from '@gestion-granjas/database/entities';
import { InventarioController } from './inventario.controller';
import { InventarioService } from './inventario.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TipoAlimento,
      PresentacionAlimento,
      UnidadMedida,
      Proveedor,
      Almacen,
      Alimento,
      MovimientoInventario,
      TipoMovimientoInventario,
      Granja,
      Ubicacion,
    ]),
  ],
  controllers: [InventarioController],
  providers: [InventarioService],
})
export class InventarioModule {}
