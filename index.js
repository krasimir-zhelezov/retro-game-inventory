import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import { serve, setup } from 'swagger-ui-express';
import session from 'express-session';

const app = express();
const port = 3000;

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
app.use(session({ secret: 'super-secret-key', resave: false, saveUninitialized: false, cookie: { secure: false, maxAge: 60000 * 60 } }));

let games = [
    { id: 1, title: "Super Mario Bros", genre: "Platformer" },
    { id: 2, title: "The Legend of Zelda", genre: "Adventure" }
];

const adminUser = {
    username: "admin",
    password: "password123"
};

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
app.get('/games', (req, res) => {
    res.status(200).json(games);
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
app.get('/games/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const game = games.find(g => g.id === id);

    if (!game) {
        return res.status(404).send('Game not found');
    }

    res.status(200).json(game);
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
app.post('/games', isAuthenticated, (req, res) => {
    const newGame = req.body;

    newGame.id = games.length ? games[games.length - 1].id + 1 : 1;

    games.push(newGame);
    res.status(201).json(newGame);
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
app.delete('/games/:id', isAuthenticated, (req, res) => {
    const id = parseInt(req.params.id);
    const index = games.findIndex(g => g.id === id);

    if (index === -1) {
        return res.status(404).send('Game not found');
    }

    const deletedGame = games.splice(index, 1);

    res.status(200).json(deletedGame[0]);
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
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === adminUser.username && password === adminUser.password) {
        req.session.user = { username };
        res.status(200).json({ message: "Login successful" });
    } else {
        res.status(401).json({ message: "Invalid credentials" });
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