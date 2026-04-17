import * as SQLite from 'expo-sqlite';

/**
 * Script de criação das tabelas para o MVP local via SQLite.
 */
export async function initializeDatabase(db: SQLite.SQLiteDatabase) {
  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS Customer (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT,
          email TEXT UNIQUE
      );

      CREATE TABLE IF NOT EXISTS Product (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          price REAL NOT NULL,
          category TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS Orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER,
          order_number TEXT NOT NULL UNIQUE,
          status TEXT NOT NULL,
          total_amount REAL NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(customer_id) REFERENCES Customer(id)
      );

      CREATE TABLE IF NOT EXISTS OrderItem (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER,
          product_id INTEGER,
          quantity INTEGER NOT NULL,
          unit_price REAL NOT NULL,
          FOREIGN KEY(order_id) REFERENCES Orders(id),
          FOREIGN KEY(product_id) REFERENCES Product(id)
      );
    `);
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
