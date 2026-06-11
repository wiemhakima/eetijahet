// ============================================================
// ADDRESS CONTROLLER — TypeScript
// ============================================================
import { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../types';

const getAddress = () => require('../../models/Address').default;

// ─── GET /api/v1/addresses ───────────────────────────────────
export const getAddresses = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const Address = getAddress();
    const addresses = await Address.find({ user: req.user!._id }).sort({ isDefault: -1, createdAt: -1 });
    res.json({ success: true, data: addresses });
  } catch (error) { next(error); }
};

// ─── POST /api/v1/addresses ──────────────────────────────────
export const createAddress = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { label, street, city, lat, lng, isDefault } = req.body;
    const Address = getAddress();

    if (isDefault) {
      await Address.updateMany({ user: req.user!._id }, { isDefault: false });
    }

    const address = await Address.create({ user: req.user!._id, label, street, city, lat, lng, isDefault: !!isDefault });
    res.status(201).json({ success: true, data: address });
  } catch (error) { next(error); }
};

// ─── PUT /api/v1/addresses/:id ───────────────────────────────
export const updateAddress = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const Address = getAddress();
    if (req.body.isDefault) {
      await Address.updateMany({ user: req.user!._id }, { isDefault: false });
    }
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user!._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!address) { res.status(404).json({ success: false, error: 'Address not found' }); return; }
    res.json({ success: true, data: address });
  } catch (error) { next(error); }
};

// ─── DELETE /api/v1/addresses/:id ────────────────────────────
export const deleteAddress = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const Address = getAddress();
    const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user!._id });
    if (!address) { res.status(404).json({ success: false, error: 'Address not found' }); return; }
    res.json({ success: true, message: 'Address deleted' });
  } catch (error) { next(error); }
};
