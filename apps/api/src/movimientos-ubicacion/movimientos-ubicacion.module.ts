import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Granja,
  Lote,
  MotivoMovimientoUbicacion,
  MovimientoUbicacion,
  Ubicacion,
} from '@gestion-granjas/database/entities';
import { MovimientosUbicacionController } from './movimientos-ubicacion.controller';
import { MovimientosUbicacionService } from './movimientos-ubicacion.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MovimientoUbicacion,
      Lote,
      Granja,
      Ubicacion,
      MotivoMovimientoUbicacion,
    ]),
  ],
  controllers: [MovimientosUbicacionController],
  providers: [MovimientosUbicacionService],
})
export class MovimientosUbicacionModule {}
