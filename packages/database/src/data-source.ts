import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { entities } from './entities';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities,
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});

/**
 * Obtiene un DataSource inicializado para Route Handlers y servicios.
 * En desarrollo puede reutilizar la instancia global para evitar
 * multiples conexiones durante hot reload.
 */
let dataSource: DataSource | null = null;

export async function getDataSource(): Promise<DataSource> {
  if (dataSource?.isInitialized) {
    return dataSource;
  }

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  dataSource = AppDataSource;
  return dataSource;
}
