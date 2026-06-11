// ============================================================
// ROUTING CONTROLLER — TypeScript (IA routing via Python Core)
// ============================================================
import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import logger from '../../utils/logger';

const CORE_URL = process.env.ROUTING_SERVER_URL || 'http://127.0.0.1:8050';

// ─── POST /api/v1/routing/optimize ───────────────────────────
export const optimizeRoute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { stops, start } = req.body;
    if (!stops || !Array.isArray(stops) || stops.length === 0) {
      res.status(400).json({ success: false, error: 'stops array is required' });
      return;
    }

    const coreRes = await axios.post(`${CORE_URL}/optimize`, { stops, start }, { timeout: 30000 });
    res.json({ success: true, data: coreRes.data });
  } catch (error) {
    logger.error(`optimizeRoute error: ${(error as Error).message}`);
    next(error);
  }
};

// ─── POST /api/v1/routing/predict_route ──────────────────────
export const predictRoute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { start, end } = req.body;
    if (!start || !end) {
      res.status(400).json({ success: false, error: 'start and end coordinates are required' });
      return;
    }

    const coreRes = await axios.post(`${CORE_URL}/predict_route`, { start, end }, { timeout: 15000 });
    res.json({ success: true, data: coreRes.data });
  } catch (error) {
    logger.error(`predictRoute error: ${(error as Error).message}`);
    next(error);
  }
};

// ─── GET /api/v1/routing/roads ───────────────────────────────
export const getRoads = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const coreRes = await axios.get(`${CORE_URL}/roads`, { timeout: 10000 });
    res.json({ success: true, data: coreRes.data });
  } catch (error) {
    logger.error(`getRoads error: ${(error as Error).message}`);
    next(error);
  }
};

// ─── GET /api/v1/routing/graph_status ────────────────────────
export const getGraphStatus = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const coreRes = await axios.get(`${CORE_URL}/graph_status`, { timeout: 5000 });
    res.json({ success: true, data: coreRes.data });
  } catch (error) {
    logger.warn(`Graph status unavailable: ${(error as Error).message}`);
    res.json({ success: false, data: { status: 'unavailable' } });
  }
};

// ─── GET /api/v1/routing/graph/nodes ─────────────────────────
export const getGraphNodes = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const coreRes = await axios.get(`${CORE_URL}/graph/nodes`, { timeout: 10000 });
    res.json({ success: true, data: coreRes.data });
  } catch (error) { next(error); }
};

// ─── GET /api/v1/routing/graph/edges ─────────────────────────
export const getGraphEdges = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const coreRes = await axios.get(`${CORE_URL}/graph/edges`, { timeout: 10000 });
    res.json({ success: true, data: coreRes.data });
  } catch (error) { next(error); }
};
