require('dotenv').config();
const { Pool } = require('pg');

// Connect to the database using the .env file
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Test the connection
pool.connect((err, client, release) => {
    if (err) {
        return console.error('❌ Error connecting to the database:', err.stack);
    }
    console.log('✅ Successfully connected to PostgreSQL database!');
    release();
});

// Create Tables for your App
const createTables = async () => {
    try {
        // 1. Users Table (For Manager and Employees)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'employee'
            )
        `);
        
        // 2. Items Table (For your inventory/እቃዎች)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS items (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                unit VARCHAR(50),
                cost_price DECIMAL(10, 2) DEFAULT 0,
                retail_price DECIMAL(10, 2) DEFAULT 0,
                wholesale_price DECIMAL(10, 2) DEFAULT 0,
                quantity INTEGER DEFAULT 0
            )
        `);
        
        // 3. Sales Table (For your sales history/የሽያጩ መዝገብ)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sales (
                id SERIAL PRIMARY KEY,
                item_name VARCHAR(100),
                quantity INTEGER,
                total_amount DECIMAL(10, 2),
                sale_type VARCHAR(20),
                sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Database tables are ready!');
    } catch (err) {
        console.error('❌ Error creating tables:', err);
    }
};

createTables();
await pool.query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS username VARCHAR(100)`);
await pool.query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS item_id INTEGER`);
module.exports = pool;
