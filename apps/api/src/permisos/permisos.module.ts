import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permiso } from '@gestion-granjas/database/entities';
import { PermisosController } from './permisos.controller';
import { PermisosService } from './permisos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Permiso])],
  controllers: [PermisosController],
  providers: [PermisosService],
})
export class PermisosModule {}
