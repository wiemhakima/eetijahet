// ============================================================
// ETA CONTROLLER — TypeScript
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { PythonShell } from 'python-shell';
import path from 'path';
import logger from '../../utils/logger';
import config from '../../config';

// ─── POST /api/v1/eta ────────────────────────────────────────
export const predictEta = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { distance_km, hour, day_of_week, zone } = req.body;

    if (distance_km === undefined) {
      res.status(400).json({ success: false, error: 'distance_km is required' });
      return;
    }

    const options = {
      mode: 'text' as const,
      pythonPath: config.pythonPath,
      scriptPath: path.join(__dirname, '../../../Core'),
      args: [
        String(distance_km),
        String(hour ?? new Date().getHours()),
        String(day_of_week ?? new Date().getDay()),
        String(zone ?? 'default'),
      ],
    };

    PythonShell.run('predict_eta.py', options).then((results) => {
      const eta = parseFloat(results?.[0] ?? '0');
      res.json({ success: true, data: { eta_minutes: eta } });
    }).catch((err) => {
      logger.error(`ETA python error: ${err.message}`);
      // Fallback: simple estimate
      const fallbackEta = Math.round((distance_km / 40) * 60);
      res.json({ success: true, data: { eta_minutes: fallbackEta, fallback: true } });
    });
  } catch (error) {
    logger.error(`predictEta error: ${(error as Error).message}`);
    next(error);
  }
};
