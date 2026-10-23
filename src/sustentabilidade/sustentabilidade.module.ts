import { Module } from '@nestjs/common';
import { FirestoreRepository } from '../firebase/firestore.repository';
import { MemoryRepository } from './memory.repository';
import { RegistroRepository } from './registro.repository';
import { SustentabilidadeController } from './sustentabilidade.controller';
import { SustentabilidadeService } from './sustentabilidade.service';
@Module({
  controllers: [SustentabilidadeController],
  providers: [SustentabilidadeService, { provide: RegistroRepository, useFactory: () => {
    const mode = process.env.STORAGE_MODE ?? 'memory';
    if (mode === 'memory') return new MemoryRepository();
    if (mode === 'firestore') return new FirestoreRepository();
    throw new Error('STORAGE_MODE deve ser memory ou firestore');
  } }],
})
export class SustentabilidadeModule {}
