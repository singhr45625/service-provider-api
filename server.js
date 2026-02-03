const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('./')); // Serve frontend files

// AUTH ENDPOINTS
app.post('/api/login', (req, res) => {
    const { email, password, role } = req.body;
    db.get("SELECT * FROM users WHERE email = ? AND password = ? AND role = ?", [email, password, role], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        res.json({ name: user.name, role: user.role });
    });
});

app.post('/api/signup', (req, res) => {
    const { name, email, password } = req.body;
    db.run(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')",
        [name, email, password],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Email already exists' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, name, role: 'user' });
        }
    );
});


// REQUESTS ENDPOINTS
app.get('/api/requests', (req, res) => {
    const { role, name } = req.query;
    let query = "SELECT * FROM requests";
    let params = [];

    if (role === 'user') {
        query += " WHERE user_name = ?";
        params.push(name);
    } else if (role === 'provider') {
        query += " WHERE status = 'pending' OR provider_name = ?";
        params.push(name);
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/requests', (req, res) => {
    const { title, category, date, budget, status, user_name } = req.body;
    db.run(
        "INSERT INTO requests (title, category, date, budget, status, user_name) VALUES (?, ?, ?, ?, ?, ?)",
        [title, category, date, budget, status, user_name],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

app.patch('/api/requests/:id/confirm', (req, res) => {
    const { id } = req.params;
    const { provider_name } = req.body;
    db.run(
        "UPDATE requests SET status = 'confirmed', provider_name = ? WHERE id = ?",
        [provider_name, id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// PROVIDER DETAILS
app.get('/api/providers', (req, res) => {
    db.all("SELECT * FROM providers", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
