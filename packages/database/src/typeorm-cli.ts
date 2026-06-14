import 'reflect-metadata';
import { AppDataSource } from '../data-source';

AppDataSource.initialize()
  .then(() => {
    console.log('Data Source inicializado para CLI de TypeORM');
  })
  .catch((error) => {
    console.error('Error al inicializar Data Source', error);
    process.exit(1);
  });

export default AppDataSource;
