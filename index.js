import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import { serve, setup } from 'swagger-ui-express';

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

let games = [
    { id: 1, title: "Super Mario Bros", genre: "Platformer" },
    { id: 2, title: "The Legend of Zelda", genre: "Adventure" }
];

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
app.post('/games', (req, res) => {
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
app.delete('/games/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = games.findIndex(g => g.id === id);

    if (index === -1) {
        return res.status(404).send('Game not found');
    }

    const deletedGame = games.splice(index, 1);
    
    res.status(200).json(deletedGame[0]);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
});

