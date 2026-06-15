import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Perfil, Permiso } from '@gestion-granjas/database/entities';
import { PerfilesController } from './perfiles.controller';
import { PerfilesService } from './perfiles.service';

@Module({
  imports: [TypeOrmModule.forFeature([Perfil, Permiso])],
  controllers: [PerfilesController],
  providers: [PerfilesService],
})
export class PerfilesModule {}
