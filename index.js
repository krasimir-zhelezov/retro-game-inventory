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

app.use('/api-docs', serve, setup(swaggerSpec));

/**
 * @swagger
 * /hello:
 *   get:
 *     summary: Returns a Hello World greeting
 *     description: A simple endpoint to verify the API is working.
 *     responses:
 *       200:
 *         description: A successful response
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Hello World
 */
app.get('/hello', (req, res) => {
  res.send('Hello World');
});

console.log(JSON.stringify(swaggerSpec, null, 2));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
});

