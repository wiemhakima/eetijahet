/**
 * Graph Routes
 *
 * GET /graph_info   — proxy to Core Flask engine: graph metadata
 * GET /graph_status — proxy to Core Flask engine: graph load status
 */
const express = require('express');
const axios   = require('axios');
const logger  = require('../../utils/logger');

const router = express.Router();

const CORE_URL = process.env.CORE_URL || 'http://127.0.0.1:3000';

// ── GET /graph_info ───────────────────────────────────────────────────────────
router.get('/graph_info', async (req, res) => {
  try {
    const coreRes = await axios.get(`${CORE_URL}/graph_info`, { timeout: 8000 });
    return res.json(coreRes.data);
  } catch (err) {
    logger.error(`GET /graph_info proxy error: ${err.message}`);
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    return res.status(502).json({ error: 'Core engine unreachable', detail: err.message });
  }
});

// ── GET /graph_status ─────────────────────────────────────────────────────────
router.get('/graph_status', async (req, res) => {
  try {
    const coreRes = await axios.get(`${CORE_URL}/graph_status`, { timeout: 8000 });
    return res.json(coreRes.data);
  } catch (err) {
    logger.error(`GET /graph_status proxy error: ${err.message}`);
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    return res.status(502).json({ error: 'Core engine unreachable', detail: err.message });
  }
});

module.exports = router;
