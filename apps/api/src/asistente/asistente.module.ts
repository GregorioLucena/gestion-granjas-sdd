import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  BajaEngorde,
  ConsumoAlimento,
  FeedbackRecomendacion,
  Lote,
  Recomendacion,
} from '@gestion-granjas/database/entities';
import { AsistenteController } from './asistente.controller';
import { AsistenteService } from './asistente.service';
import { LlmRedaccionService } from './llm-redaccion.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Recomendacion,
      FeedbackRecomendacion,
      ConsumoAlimento,
      BajaEngorde,
      Lote,
    ]),
  ],
  controllers: [AsistenteController],
  providers: [AsistenteService, LlmRedaccionService],
  exports: [AsistenteService],
})
export class AsistenteModule {}
