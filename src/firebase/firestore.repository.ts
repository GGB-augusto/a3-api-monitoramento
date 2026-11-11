import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { UpdateRegistroDto } from '../sustentabilidade/dto/update-registro.dto';
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
  async buscar(empresaId: string, periodo: string): Promise<Registro> {
    const snapshot = await this.db.collection('registros').doc(`${empresaId}_${periodo}`).get();
    if (!snapshot.exists) throw new NotFoundException('Registro não encontrado');
    return snapshot.data() as Registro;
  }
  async atualizar(empresaId: string, periodo: string, dto: UpdateRegistroDto): Promise<Registro> {
    const ref = this.db.collection('registros').doc(`${empresaId}_${periodo}`);
    return this.db.runTransaction(async transaction => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) throw new NotFoundException('Registro não encontrado');
      const registro = { ...(snapshot.data() as Registro), ...dto, atualizadoEm: new Date().toISOString() };
      transaction.set(ref, registro);
      return registro;
    });
  }
  async excluir(empresaId: string, periodo: string): Promise<void> {
    const ref = this.db.collection('registros').doc(`${empresaId}_${periodo}`);
    await this.db.runTransaction(async transaction => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) throw new NotFoundException('Registro não encontrado');
      transaction.delete(ref);
    });
  }
  async listar(empresaId: string): Promise<Registro[]> {
    const snapshot = await this.db.collection('registros').where('empresaId', '==', empresaId).get();
    return snapshot.docs.map(doc => doc.data() as Registro);
  }
}
