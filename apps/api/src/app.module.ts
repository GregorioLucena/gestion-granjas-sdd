import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from '@gestion-granjas/database/entities';
import { HealthModule } from './health/health.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { CompaniasModule } from './companias/companias.module';
import { GranjasModule } from './granjas/granjas.module';
import { MaestrasModule } from './maestras/maestras.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { PerfilesModule } from './perfiles/perfiles.module';
import { PermisosModule } from './permisos/permisos.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities,
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
    }),
    CommonModule,
    AuthModule,
    HealthModule,
    CompaniasModule,
    GranjasModule,
    MaestrasModule,
    UsuariosModule,
    PerfilesModule,
    PermisosModule,
  ],
})
export class AppModule {}
