import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  FinalidadProductiva,
  Granja,
  Lote,
  MetodoPesaje,
  MotivoBajaEngorde,
  MotivoCierreEngorde,
  Raza,
  TipoAnimal,
  TipoUbicacion,
  Ubicacion,
} from '@gestion-granjas/database/entities';
import { MaestrasController } from './maestras.controller';
import { MaestrasService } from './maestras.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TipoAnimal,
      Raza,
      FinalidadProductiva,
      TipoUbicacion,
      Ubicacion,
      MotivoCierreEngorde,
      MotivoBajaEngorde,
      MetodoPesaje,
      Granja,
      Lote,
    ]),
  ],
  controllers: [MaestrasController],
  providers: [MaestrasService],
})
export class MaestrasModule {}
