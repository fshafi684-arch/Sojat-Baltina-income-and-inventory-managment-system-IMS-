const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Test connection
pool.connect()
    .then(client => {
        console.log('✅ Successfully connected to PostgreSQL database!');
        client.release();
        return createTables();
    })
    .catch(err => {
        console.error('❌ Error connecting to the database:', err);
    });

// Create tables
async function createTables() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(100) NOT NULL,
                role VARCHAR(50) DEFAULT 'employee'
            )
        `);
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS items (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                unit VARCHAR(50),
                cost_price DECIMAL(10, 2),
                retail_price DECIMAL(10, 2),
                wholesale_price DECIMAL(10, 2),
                quantity INTEGER DEFAULT 0
            )
        `);
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sales (
                id SERIAL PRIMARY KEY,
                item_id INTEGER,
                item_name VARCHAR(200),
                quantity INTEGER,
                total_amount DECIMAL(10, 2),
                sale_type VARCHAR(50),
                username VARCHAR(100),
                sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Add new columns if they don't exist
        await pool.query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS username VARCHAR(100)`);
        await pool.query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS item_id INTEGER`);
        
        console.log('✅ Database tables are ready!');
    } catch (err) {
        console.error('❌ Error creating tables:', err);
    }
}

module.exports = pool;
