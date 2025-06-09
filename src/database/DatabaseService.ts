import SQLite from 'react-native-sqlite-storage';
import {Plant, PlantSpecies, WateringRecord} from '../types/Plant';

SQLite.DEBUG(false);
SQLite.enablePromise(true);

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabase({
        name: 'PlantTracker.db',
        location: 'default',
      });
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const createPlantsTable = `
      CREATE TABLE IF NOT EXISTS plants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        species_id INTEGER,
        species_name TEXT,
        photo_uri TEXT,
        location TEXT NOT NULL,
        created_date TEXT NOT NULL,
        last_watered TEXT,
        FOREIGN KEY (species_id) REFERENCES plant_species (species_id)
      );
    `;

    const createPlantSpeciesTable = `
      CREATE TABLE IF NOT EXISTS plant_species (
        species_id INTEGER PRIMARY KEY AUTOINCREMENT,
        common_name TEXT NOT NULL,
        scientific_name TEXT,
        watering_frequency INTEGER,
        light_requirements TEXT,
        care_instructions TEXT,
        cached_date TEXT NOT NULL
      );
    `;

    const createWateringRecordsTable = `
      CREATE TABLE IF NOT EXISTS watering_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plant_id INTEGER NOT NULL,
        watered_date TEXT NOT NULL,
        notes TEXT,
        FOREIGN KEY (plant_id) REFERENCES plants (id) ON DELETE CASCADE
      );
    `;

    await this.db.executeSql(createPlantsTable);
    await this.db.executeSql(createPlantSpeciesTable);
    await this.db.executeSql(createWateringRecordsTable);
  }

  async createPlant(plant: Omit<Plant, 'id'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      INSERT INTO plants (name, species_id, species_name, photo_uri, location, created_date, last_watered)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await this.db.executeSql(query, [
      plant.name,
      plant.species_id || null,
      plant.species_name || null,
      plant.photo_uri || null,
      plant.location,
      plant.created_date,
      plant.last_watered || null,
    ]);

    return result[0].insertId;
  }

  async getAllPlants(): Promise<Plant[]> {
    if (!this.db) throw new Error('Database not initialized');

    const query = 'SELECT * FROM plants ORDER BY created_date DESC';
    const result = await this.db.executeSql(query);

    const plants: Plant[] = [];
    for (let i = 0; i < result[0].rows.length; i++) {
      plants.push(result[0].rows.item(i));
    }

    return plants;
  }

  async updatePlant(id: number, plant: Partial<Plant>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const fields = Object.keys(plant).filter(key => key !== 'id');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => plant[field as keyof Plant]);

    const query = `UPDATE plants SET ${setClause} WHERE id = ?`;
    await this.db.executeSql(query, [...values, id]);
  }

  async deletePlant(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = 'DELETE FROM plants WHERE id = ?';
    await this.db.executeSql(query, [id]);
  }

  async addWateringRecord(record: Omit<WateringRecord, 'id'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      INSERT INTO watering_records (plant_id, watered_date, notes)
      VALUES (?, ?, ?)
    `;

    const result = await this.db.executeSql(query, [
      record.plant_id,
      record.watered_date,
      record.notes || null,
    ]);

    // Update last_watered in plants table
    await this.updatePlant(record.plant_id, { last_watered: record.watered_date });

    return result[0].insertId;
  }

  async getWateringRecords(plantId: number): Promise<WateringRecord[]> {
    if (!this.db) throw new Error('Database not initialized');

    const query = 'SELECT * FROM watering_records WHERE plant_id = ? ORDER BY watered_date DESC';
    const result = await this.db.executeSql(query, [plantId]);

    const records: WateringRecord[] = [];
    for (let i = 0; i < result[0].rows.length; i++) {
      records.push(result[0].rows.item(i));
    }

    return records;
  }

  async createPlantSpecies(species: Omit<PlantSpecies, 'species_id'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      INSERT INTO plant_species (common_name, scientific_name, watering_frequency, light_requirements, care_instructions, cached_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await this.db.executeSql(query, [
      species.common_name,
      species.scientific_name || null,
      species.watering_frequency || null,
      species.light_requirements || null,
      species.care_instructions || null,
      species.cached_date,
    ]);

    return result[0].insertId;
  }

  async searchPlantSpecies(searchTerm: string): Promise<PlantSpecies[]> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      SELECT * FROM plant_species 
      WHERE common_name LIKE ? OR scientific_name LIKE ?
      ORDER BY common_name
    `;

    const result = await this.db.executeSql(query, [`%${searchTerm}%`, `%${searchTerm}%`]);

    const species: PlantSpecies[] = [];
    for (let i = 0; i < result[0].rows.length; i++) {
      species.push(result[0].rows.item(i));
    }

    return species;
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

export default new DatabaseService();
