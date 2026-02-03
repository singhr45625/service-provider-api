const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'service_finder.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT
    )`);

    // Providers table
    db.run(`CREATE TABLE IF NOT EXISTS providers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        specialty TEXT,
        rating REAL,
        jobs INTEGER,
        img TEXT
    )`);

    // Requests table
    db.run(`CREATE TABLE IF NOT EXISTS requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        category TEXT,
        date TEXT,
        budget INTEGER,
        status TEXT DEFAULT 'pending',
        user_name TEXT,
        provider_name TEXT,
        FOREIGN KEY(user_name) REFERENCES users(name),
        FOREIGN KEY(provider_name) REFERENCES providers(name)
    )`);

    // Seed Initial Data if empty
    db.get("SELECT count(*) as count FROM users", (err, row) => {
        if (row.count === 0) {
            db.run("INSERT INTO users (name, email, password, role) VALUES ('John Doe', 'user@example.com', 'ServiceFinder_User_2025!', 'user')");
            db.run("INSERT INTO users (name, email, password, role) VALUES ('Pro Fixer', 'pro@service.com', 'Expert_Pro_Secure_99', 'provider')");
        }
    });

    db.get("SELECT count(*) as count FROM providers", (err, row) => {
        if (row.count === 0) {
            db.run("INSERT INTO providers (name, email, specialty, rating, jobs, img) VALUES ('Pro Fixer', 'pro@service.com', 'Mechanic', 4.8, 124, 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop')");
            db.run("INSERT INTO providers (name, email, specialty, rating, jobs, img) VALUES ('Speedy Cleaners', 'clean@service.com', 'Cleaning', 4.9, 250, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop')");
            db.run("INSERT INTO providers (name, email, specialty, rating, jobs, img) VALUES ('Electro Spark', 'electro@service.com', 'Electrician', 4.7, 180, 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=100&h=100&fit=crop')");
            db.run("INSERT INTO providers (name, email, specialty, rating, jobs, img) VALUES ('Pure Water', 'water@service.com', 'Plumber', 4.6, 95, 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=100&h=100&fit=crop')");
        }
    });

    db.get("SELECT count(*) as count FROM requests", (err, row) => {
        if (row.count === 0) {
            db.run("INSERT INTO requests (title, category, date, budget, status, user_name) VALUES ('Brake Repair', 'Automotive', '2025-02-10', 150, 'pending', 'John Doe')");
        }
    });
});

module.exports = db;
