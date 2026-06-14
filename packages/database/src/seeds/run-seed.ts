import 'reflect-metadata';
import { AppDataSource } from '../data-source';

async function runSeed() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  console.log('Seed pendiente: permisos, perfiles, compania demo y usuario admin.');
  console.log('Implementar en sprint 1 segun docs/07-diseno-tecnico-inicial.md');

  await AppDataSource.destroy();
}

runSeed().catch((error) => {
  console.error('Error ejecutando seed', error);
  process.exit(1);
});
