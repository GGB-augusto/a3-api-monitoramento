import { Module } from '@nestjs/common';
import { SustentabilidadeModule } from './sustentabilidade/sustentabilidade.module';
@Module({ imports: [SustentabilidadeModule] })
export class AppModule {}
