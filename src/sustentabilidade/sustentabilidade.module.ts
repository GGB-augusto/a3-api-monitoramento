import { Module } from '@nestjs/common';
import { FirestoreRepository } from '../firebase/firestore.repository';
import { MemoryRepository } from './memory.repository';
import { RegistroRepository } from './registro.repository';
import { SupabaseRepository } from './supabase.repository';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { SustentabilidadeController } from './sustentabilidade.controller';
import { SustentabilidadeService } from './sustentabilidade.service';
@Module({
  controllers: [SustentabilidadeController],
  providers: [SustentabilidadeService, SupabaseAuthGuard, { provide: RegistroRepository, useFactory: () => {
    const mode = process.env.STORAGE_MODE ?? 'memory';
    if (mode === 'memory') return new MemoryRepository();
    if (mode === 'firestore') return new FirestoreRepository();
    if (mode === 'supabase') return new SupabaseRepository();
    throw new Error('STORAGE_MODE deve ser memory, firestore ou supabase');
  } }],
})
export class SustentabilidadeModule {}
