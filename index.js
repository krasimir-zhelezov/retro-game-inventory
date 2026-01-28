import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import { serve, setup } from 'swagger-ui-express';
import session from 'express-session';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = express();
const port = 3000;

let db;

(async () => {
    try {
        db = await open({
            filename: './database.sqlite',
            driver: sqlite3.Database
        });

        console.log('Connected to SQLite database.');

        // 1. Create Tables
        await db.exec(`
            CREATE TABLE IF NOT EXISTS games (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                genre TEXT
            );
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT
            );
        `);

        const gameCount = await db.get('SELECT COUNT(*) as count FROM games');
        if (gameCount.count === 0) {
            await db.run(`INSERT INTO games (title, genre) VALUES ('Super Mario Bros', 'Platformer')`);
            await db.run(`INSERT INTO games (title, genre) VALUES ('The Legend of Zelda', 'Adventure')`);
            console.log('Seeded games table.');
        }

        const userCount = await db.get('SELECT COUNT(*) as count FROM users');
        if (userCount.count === 0) {
            await db.run(`INSERT INTO users (username, password) VALUES ('admin', 'password123')`);
            await db.run(`INSERT INTO users (username, password) VALUES ('superadmin', '67secureAss69')`);
            console.log('Seeded users table.');
        }

    } catch (error) {
        console.error('Failed to initialize database:', error);
    }
})();

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Retro Game Inventory API',
            version: '1.0.0',
            description: 'Retro Game Inventory API documented with Swagger',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
        ],
    },
    apis: ['./index.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(express.json());
app.use('/api-docs', serve, setup(swaggerSpec));
app.use(session({ secret: process.env.SESSION_SECRET || 'fallback-secret-for-dev', resave: false, saveUninitialized: false, cookie: { secure: false, maxAge: 60000 * 60 } }));

let games = [
    { id: 1, title: "Super Mario Bros", genre: "Platformer" },
    { id: 2, title: "The Legend of Zelda", genre: "Adventure" }
];

const administrators = [
    {
        username: "admin",
        password: "password123"
    },
    {
        username: "superadmin",
        password: "67secureAss69"
    }
];

const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ message: "Unauthorized. Please login first." });
    }
};

/**
 * @swagger
 * /games:
 *   get:
 *     summary: Get all games
 *     description: Retrieve a list of all game objects.
 *     responses:
 *       200:
 *         description: A list of games.
 */
app.get('/games', isAuthenticated, async (req, res) => {
    try {
        const games = await db.all('SELECT * FROM games');
        res.status(200).json(games);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /games/{id}:
 *   get:
 *     summary: Get a game by ID
 *     description: Retrieve a single game object by its unique identifier.
 *     parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       description: Numeric ID of the game to retrieve.
 *       schema:
 *         type: integer
 *     responses:
 *       200:
 *         description: A single game object.
 *       404:
 *         description: Game not found.
 */
app.get('/games/:id', isAuthenticated, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const game = await db.get('SELECT * FROM games WHERE id = ?', [id]);

        if (!game) {
            return res.status(404).send('Game not found');
        }

        res.status(200).json(game);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /games:
 *   post:
 *     summary: Create a new game
 *     description: Add a new game object to the array.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               genre:
 *                 type: string
 *     responses:
 *       201:
 *         description: Game created successfully.
 */
app.post('/games', isAuthenticated, async (req, res) => {
    try {
        const { title, genre } = req.body;
        const result = await db.run(
            'INSERT INTO games (title, genre) VALUES (?, ?)',
            [title, genre]
        );
        
        const newGame = { id: result.lastID, title, genre };
        res.status(201).json(newGame);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /games/{id}:
 *   delete:
 *     summary: Delete a game
 *     description: Remove a game object by its unique identifier.
 *     parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       description: Numeric ID of the game to delete.
 *       schema:
 *         type: integer
 *     responses:
 *       200:
 *         description: Game deleted successfully.
 *       404:
 *         description: Game not found.
 */
app.delete('/games/:id', isAuthenticated, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        const game = await db.get('SELECT * FROM games WHERE id = ?', [id]);
        
        if (!game) {
            return res.status(404).send('Game not found');
        }

        await db.run('DELETE FROM games WHERE id = ?', [id]);
        res.status(200).json(game);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /login:
 *  post:
 *     summary: User Login
 *     description: Authenticate user and receive a token (simulated).
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials.
 */
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const validUser = await db.get(
            'SELECT * FROM users WHERE username = ? AND password = ?', 
            [username, password]
        );

        if (validUser) {
            req.session.user = { username: validUser.username };
            res.status(200).json({ message: "Login successful" });
        } else {
            res.status(401).json({ message: "Invalid credentials" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: User Logout
 *     description: Ends the user session (simulated).
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful.
 */
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: "Could not log out" });
        }
        res.status(200).json({ message: "Logout successful" });
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
});