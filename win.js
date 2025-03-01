import express from 'express';
import { passwordConfig as SQLAuthentication } from './config.js';
import { createDatabaseConnection } from './database.js';

const router = express.Router();
router.use(express.json());

const database = await createDatabaseConnection(SQLAuthentication);

router.get('/', async (req, res) => {
  try {
    const wins = await database.readAllWins();
    console.log(`wins: ${JSON.stringify(wins)}`);
    res.status(200).json(wins);
  } catch (err) {
    res.status(500).json({ error: err?.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const win = req.body;
    console.log(`request win: ${JSON.stringify(win)}`);
    if (!win.personId) {
      return res.status(400).json({ error: 'personId is required' });
    }
    win.winTime = Date.now(); // Ensure winTime is a UTC timestamp
    console.log(`win: ${JSON.stringify(win)}`);
    const rowsAffected = await database.createWin(win);
    res.status(201).json({ rowsAffected });
  } catch (err) {
    res.status(500).json({ error: err?.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const winId = req.params.id;
    console.log(`winId: ${winId}`);
    if (winId) {
      const result = await database.readWin(winId);
      console.log(`win: ${JSON.stringify(result)}`);
      res.status(200).json(result);
    } else {
      res.status(404);
    }
  } catch (err) {
    res.status(500).json({ error: err?.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const winId = req.params.id;
    console.log(`winId: ${winId}`);
    const win = req.body;
    win.winTime = Date.now(); // Ensure winTime is a UTC timestamp

    if (winId && win) {
      delete win.id;
      console.log(`win: ${JSON.stringify(win)}`);
      const rowsAffected = await database.updateWin(winId, win);
      res.status(200).json({ rowsAffected });
    } else {
      res.status(404);
    }
  } catch (err) {
    res.status(500).json({ error: err?.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const winId = req.params.id;
    console.log(`winId: ${winId}`);

    if (!winId) {
      res.status(404);
    } else {
      const rowsAffected = await database.deleteWin(winId);
      res.status(204).json({ rowsAffected });
    }
  } catch (err) {
    res.status(500).json({ error: err?.message });
  }
});

// New endpoint to get all wins by personId
router.get('/person/:personId', async (req, res) => {
  try {
    const personId = req.params.personId;
    console.log(`personId: ${personId}`);
    const wins = await database.readWinsByPersonId(personId);
    console.log(`wins: ${JSON.stringify(wins)}`);
    res.status(200).json(wins);
  } catch (err) {
    res.status(500).json({ error: err?.message });
  }
});

export default router;