const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- API ENDPOINTS ---

// 1. Login Endpoint
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query(
            'SELECT id, username, role FROM users WHERE username = $1 AND password = $2',
            [username, password]
        );
        if (result.rows.length > 0) {
            res.json({ success: true, user: result.rows[0] });
        } else {
            res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Get All Items Endpoint
app.get('/api/items', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM items ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Add New Item Endpoint
app.post('/api/items', async (req, res) => {
    const { name, unit, cost_price, retail_price, wholesale_price, quantity } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO items (name, unit, cost_price, retail_price, wholesale_price, quantity) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, unit, cost_price, retail_price, wholesale_price, quantity]
        );
        res.json({ success: true, item: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
// 5. Get All Employees
app.get('/api/employees', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, password, role FROM users ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Update Employee Password
app.put('/api/employees/:id/password', async (req, res) => {
    const { password } = req.body;
    try {
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [password, req.params.id]);
        res.json({ success: true, message: 'Password updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. Update Product (Edit)
app.put('/api/items/:id', async (req, res) => {
    const { name, unit, cost_price, retail_price, wholesale_price, quantity } = req.body;
    try {
        await pool.query(
            `UPDATE items SET name = $1, unit = $2, cost_price = $3, retail_price = $4, wholesale_price = $5, quantity = $6 WHERE id = $7`,
            [name, unit, cost_price, retail_price, wholesale_price, quantity, req.params.id]
        );
        res.json({ success: true, message: 'Item updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8. Delete Product
app.delete('/api/items/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM items WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'Item deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 9. Get Sales History
app.get('/api/sales', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM sales ORDER BY sale_date DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 10. Delete Sale
app.delete('/api/sales/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM sales WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'Sale deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 11. Get Daily Income
app.get('/api/income/daily', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                DATE(sale_date) as date,
                SUM(total_amount) as total_money,
                SUM(quantity) as total_units,
                COUNT(*) as transaction_count
            FROM sales
            GROUP BY DATE(sale_date)
            ORDER BY date DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 12. Get Monthly Income
app.get('/api/income/monthly', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                TO_CHAR(sale_date, 'YYYY-MM') as month,
                SUM(total_amount) as total_money,
                SUM(quantity) as total_units
            FROM sales
            GROUP BY TO_CHAR(sale_date, 'YYYY-MM')
            ORDER BY month DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 13. Backup All Data
app.get('/api/backup', async (req, res) => {
    try {
        const items = await pool.query('SELECT * FROM items');
        const sales = await pool.query('SELECT * FROM sales');
        const users = await pool.query('SELECT id, username, role FROM users');
        
        res.json({
            timestamp: new Date().toISOString(),
            items: items.rows,
            sales: sales.rows,
            users: users.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// 14. Seed Database with Initial Data (Employees & Products)
app.get('/api/seed', async (req, res) => {
    try {
        // 1. Insert 13 Employees + 1 Manager
        const employees = [
            { username: 'ሰራተኛ 01', password: '1001' },
            { username: 'ሰራተኛ 02', password: '1002' },
            { username: 'ሰራተኛ 03', password: '1003' },
            { username: 'ሰራተኛ 04', password: '1004' },
            { username: 'ሰራተኛ 05', password: '1005' },
            { username: 'ሰራተኛ 06', password: '1006' },
            { username: 'ሰራተኛ 07', password: '1007' },
            { username: 'ሰራተኛ 08', password: '1008' },
            { username: 'ሰራተኛ 09', password: '1009' },
            { username: 'ሰራተኛ 10', password: '1010' },
            { username: 'ሰራተኛ 11', password: '1011' },
            { username: 'ሰራተኛ 12', password: '1012' },
            { username: 'ሰራተኛ 13', password: '1013' },
            { username: 'Manager', password: 'admin123' }
        ];
        
        for (const emp of employees) {
            await pool.query(
                "INSERT INTO users (username, password, role) VALUES ($1, $2, 'employee') ON CONFLICT (username) DO NOTHING",
                [emp.username, emp.password]
            );
        }
        // Make sure Manager has the correct role
        await pool.query("UPDATE users SET role = 'manager' WHERE username = 'Manager'");

        // 2. Insert 20 Products
        const products = [
            { name: 'ሚጥን ሽሮ', unit: 'በኪሎ', cost: 400, retail: 600, wholesale: 450, qty: 50 },
            { name: 'አልጫ ሽሮ', unit: 'በኪሎ', cost: 400, retail: 600, wholesale: 500, qty: 50 },
            { name: 'ቡላ', unit: 'በኪሎ', cost: 320, retail: 480, wholesale: 400, qty: 40 },
            { name: 'በሶ', unit: 'በኪሎ', cost: 230, retail: 345, wholesale: 300, qty: 60 },
            { name: 'የተቀመመ በሶ', unit: 'በኪሎ', cost: 210, retail: 320, wholesale: 280, qty: 60 },
            { name: 'ገን ት', unit: 'በኪሎ', cost: 245, retail: 368, wholesale: 320, qty: 50 },
            { name: 'አጥሚት', unit: 'በኪሎ', cost: 260, retail: 400, wholesale: 350, qty: 40 },
            { name: 'ገብስ ዱቃ', unit: 'በኪሎ', cost: 150, retail: 235, wholesale: 200, qty: 70 },
            { name: 'በርበሬ', unit: 'በኪሎ', cost: 1200, retail: 1800, wholesale: 1600, qty: 30 },
            { name: 'ሚጥሚጣ', unit: 'በኪሎ', cost: 650, retail: 1000, wholesale: 850, qty: 35 },
            { name: 'አዋዜ', unit: 'በ500ግ', cost: 250, retail: 400, wholesale: 300, qty: 40 },
            { name: 'ዳጥ', unit: 'በኪሎ', cost: 650, retail: 1000, wholesale: 850, qty: 30 },
            { name: 'ኮረሪማ', unit: 'በኪሎ', cost: 2500, retail: 3900, wholesale: 2200, qty: 20 },
            { name: 'አብሽ', unit: 'በኪሎ', cost: 550, retail: 850, wholesale: 700, qty: 40 },
            { name: 'ቆንዶ በርበሬ', unit: 'በኪሎ', cost: 1600, retail: 2415, wholesale: 2100, qty: 25 },
            { name: 'ዕርድ', unit: 'በኪሎ', cost: 180, retail: 290, wholesale: 200, qty: 50 },
            { name: 'ዝንጅብል', unit: 'በኪሎ', cost: 800, retail: 1200, wholesale: 1000, qty: 35 },
            { name: 'ቅረንፉድ', unit: 'በኪሎ', cost: 1600, retail: 2400, wholesale: 2000, qty: 20 },
            { name: 'ቀረፋ', unit: 'በ100ግ', cost: 300, retail: 500, wholesale: 400, qty: 50 },
            { name: 'የሻይ ቅመም', unit: 'በኪሎ', cost: 2000, retail: 3000, wholesale: 2500, qty: 25 }
        ];
        
        for (const p of products) {
            await pool.query(
                `INSERT INTO items (name, unit, cost_price, retail_price, wholesale_price, quantity) 
                 VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
                [p.name, p.unit, p.cost, p.retail, p.wholesale, p.qty]
            );
        }

        res.send('✅ Database seeded successfully with 13 employees, 1 manager, and 20 products!');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Serve the frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Show the website when visiting the main link
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// --- SALES API ENDPOINTS ---

// 1. Get All Sales
app.get('/api/sales', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM sales ORDER BY sale_date DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Record a New Sale
app.post('/api/sales', async (req, res) => {
    const { item_id, item_name, quantity, total_amount, sale_type, username } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('UPDATE items SET quantity = quantity - $1 WHERE id = $2', [quantity, item_id]);
        await client.query(
            'INSERT INTO sales (item_id, item_name, quantity, total_amount, sale_type, username) VALUES ($1, $2, $3, $4, $5, $6)', 
            [item_id, item_name, quantity, total_amount, sale_type, username]
        );
        await client.query('COMMIT');
        res.json({ success: true, message: 'Sale recorded!' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});
// 3. Delete a Sale
app.delete('/api/sales/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM sales WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'Sale deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
