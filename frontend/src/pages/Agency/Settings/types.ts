export interface TeamMember {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  role: 'admin' | 'manager';
  permissions?: Record<string, boolean>;
  addedAt?: string;
}

export interface Agency {
  _id: string;
  name: string;
  profile?: Record<string, unknown>;
  team?: TeamMember[];
  workingHours?: Record<string, unknown>;
  deliveryZones?: Array<Record<string, unknown>>;
  notifications?: Record<string, unknown>;
  subscription?: { plan?: string; [key: string]: unknown };
  createdAt?: string;
}

export interface TabProps {
  agency: Agency;
  onUpdate: (agency: Agency) => void;
}
