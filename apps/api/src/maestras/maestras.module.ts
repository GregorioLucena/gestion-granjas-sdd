import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  FinalidadProductiva,
  Granja,
  Lote,
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
      Granja,
      Lote,
    ]),
  ],
  controllers: [MaestrasController],
  providers: [MaestrasService],
})
export class MaestrasModule {}
