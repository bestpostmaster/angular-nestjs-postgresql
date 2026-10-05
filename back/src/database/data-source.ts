import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './database.config.js';

// Utilisé uniquement par le CLI TypeORM (migrations)
export default new DataSource(buildDataSourceOptions(process.env));
