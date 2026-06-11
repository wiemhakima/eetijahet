// ============================================================
// SERVER TYPES — Express request extensions & shared types
// ============================================================
import { Request } from 'express';
import { Document, Types } from 'mongoose';

// ─── User roles ──────────────────────────────────────────────
export type UserRole =
  | 'user'
  | 'admin'
  | 'super_admin'
  | 'driver'
  | 'developer'
  | 'agency_admin'
  | 'gestionnaire_agency'
  | 'merchant';

export type DriverStatus = 'available' | 'busy' | 'offline';
export type UserTier = 'free' | 'basic' | 'premium' | 'enterprise';

// ─── Mongoose document interfaces ────────────────────────────
export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  company?: string;
  avatar?: string;
  phone?: string;
  role: UserRole;
  agency?: Types.ObjectId;
  activeApiSettings?: Types.ObjectId;
  tier: UserTier;
  driverStatus: DriverStatus;
  agreeMarketing: boolean;
  loginCode?: string;
  loginCodeExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAgency extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  email: string;
  owner: Types.ObjectId;
  subscription?: Types.ObjectId;
  status: 'active' | 'suspended' | 'trial';
  settings: {
    maxDrivers: number;
    maxDeliveries: number;
    apiAccess: boolean;
    apiRequestsLimit: number;
  };
  isActive(): boolean;
}

// ─── Extended Express Request ─────────────────────────────────
export interface AuthRequest extends Request {
  user?: IUser;
  agency?: IAgency | null;
}

// ─── API Response helpers ─────────────────────────────────────
export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
  token?: string;
}

export interface ApiError {
  success: false;
  error: string;
  stack?: string;
  path?: string;
}

// ─── JWT Payload ──────────────────────────────────────────────
export interface JwtPayload {
  id: string;
  role: UserRole;
  agencyId?: string | null;
  iat?: number;
  exp?: number;
}

// ─── Config ──────────────────────────────────────────────────
export interface AppConfig {
  port: number;
  environment: string;
  pythonPath: string;
  modelPath: string;
  logLevel: string;
  apiVersion: string;
  requestTimeout: number;
  cors: {
    origin: string;
    methods: string[];
  };
  mongodb: {
    uri: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
}
