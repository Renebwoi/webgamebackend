import express from 'express';
import cors from 'cors';

// Import App routes
import person from './person.js';
import openapi from './openapi.js';
import win from './win.js';

const port = process.env.PORT || 3000;

const app = express();

// Use the CORS middleware to allow all origins
app.use(cors());

// Connect App routes
app.use('/api-docs', openapi);
app.use('/persons', person);
app.use('/wins', win);
// app.use('*', (_, res) => {
//   res.redirect('/api-docs');
// });

// Start the server
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});