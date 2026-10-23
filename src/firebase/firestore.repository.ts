import { ConflictException, Injectable } from '@nestjs/common';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { CreateRegistroDto } from '../sustentabilidade/dto/create-registro.dto';
import { Registro, RegistroRepository } from '../sustentabilidade/registro.repository';
@Injectable()
export class FirestoreRepository extends RegistroRepository {
  private readonly db;
  constructor() {
    super();
    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (!projectId) throw new Error('Configure FIREBASE_PROJECT_ID no modo firestore');
    const app = getApps()[0] ?? initializeApp({ credential: applicationDefault(), projectId });
    this.db = getFirestore(app);
  }
  async criar(dto: CreateRegistroDto): Promise<Registro> {
    const id = `${dto.empresaId}_${dto.periodo}`;
    const registro = { ...dto, id, criadoEm: new Date().toISOString() };
    try {
      await this.db.collection('registros').doc(id).create(registro);
      return registro;
    } catch (error) {
      if ((error as { code?: number }).code === 6) throw new ConflictException('Empresa já possui registro neste período');
      throw error;
    }
  }
  async listar(empresaId: string): Promise<Registro[]> {
    const snapshot = await this.db.collection('registros').where('empresaId', '==', empresaId).get();
    return snapshot.docs.map(doc => doc.data() as Registro);
  }
}
