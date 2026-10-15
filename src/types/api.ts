/**
 * API types mirroring the frozen backend DTOs.
 * Source of truth: https://propora-nestjs-postegresql.vercel.app/docs
 */

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp?: string;
  path?: string;
  requestId?: string;
}

/** Auth */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  permissions: string[];
}

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  status?: string;
  organizationId?: string;
  roles: Role[] | string[];
  permissions: string[];
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser;
  /** Verified role this session signed in as (server-checked). */
  loginRole?: string;
  /** Where the client should land: /dashboard or /platform. */
  target?: string;
}

export interface LoginDto {
  email: string;
  password: string;
  /** Intended role — ADMIN opens the platform session, org roles are verified. */
  role?: string;
}

export interface RegisterDto {
  organizationName?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  /** Requested role (ADMIN is rejected by the API). Non-OWNER needs inviteCode. */
  role?: string;
  inviteCode?: string;
}

/** Properties */
export type PropertyType = 'RESIDENTIAL' | 'COMMERCIAL' | 'MIXED_USE' | 'INDUSTRIAL' | 'LAND';
export type ActiveStatus = 'ACTIVE' | 'INACTIVE';

export interface Property {
  id: string;
  name: string;
  type?: PropertyType | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  status?: ActiveStatus | null;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Buildings */
export interface Building {
  id: string;
  propertyId?: string;
  name: string;
  code?: string | null;
  totalFloors?: number | null;
  address?: string | null;
  description?: string | null;
  status?: ActiveStatus | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Units */
export type UnitStatus = 'VACANT' | 'OCCUPIED' | 'UNDER_MAINTENANCE' | 'INACTIVE';

export interface UnitType {
  id: string;
  name: string;
  description?: string | null;
}

export interface Unit {
  id: string;
  buildingId?: string;
  propertyId?: string;
  name: string;
  unitNumber?: string | null;
  type?: string | null;
  unitTypeId?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaSqm?: number | null;
  floor?: number | null;
  rentAmount?: number | null;
  depositAmount?: number | null;
  status?: UnitStatus | null;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Residents */
export interface Resident {
  id: string;
  userId?: string | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  idNumber?: string | null;
  status?: ActiveStatus | null;
  emergencyContact?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Leases */
export type LeaseStatus = 'UPCOMING' | 'ACTIVE' | 'ENDED' | 'TERMINATED';
export type PaymentFrequency = 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';

export interface Lease {
  id: string;
  unitId: string;
  residentId: string;
  startDate: string;
  endDate?: string | null;
  rentAmount: number;
  depositAmount?: number | null;
  paymentFrequency?: PaymentFrequency | null;
  status?: LeaseStatus | null;
  notes?: string | null;
  unit?: Unit | null;
  resident?: Resident | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Payments */
export type PaymentType = 'RENT' | 'DEPOSIT' | 'FEE' | 'OTHER';
export type PaymentMethod = 'BANK_TRANSFER' | 'CASH' | 'CARD' | 'CHECK' | 'ONLINE';
export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: string;
  leaseId?: string | null;
  amount: number;
  currency?: string | null;
  type?: PaymentType | null;
  method?: PaymentMethod | null;
  status?: PaymentStatus | null;
  dueDate: string;
  paidAt?: string | null;
  invoiceNo?: string | null;
  notes?: string | null;
  lease?: Lease | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Maintenance */
export type MaintenanceStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface MaintenanceRequest {
  id: string;
  unitId: string;
  residentId?: string | null;
  title: string;
  description?: string | null;
  priority?: MaintenancePriority | null;
  status?: MaintenanceStatus | null;
  assignedToId?: string | null;
  notes?: string | null;
  unit?: Unit | null;
  resident?: Resident | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Documents */
export type DocumentCategory = 'LEASE' | 'IDENTITY' | 'UTILITY' | 'INSPECTION' | 'FINANCIAL' | 'OTHER';

export interface Document {
  id: string;
  name: string;
  entityType?: string | null;
  entityId?: string | null;
  category?: DocumentCategory | null;
  mimeType?: string | null;
  size?: number | null;
  url?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Notifications */
export interface Notification {
  id: string;
  title: string;
  body?: string | null;
  type?: string | null;
  read?: boolean;
  readAt?: string | null;
  createdAt?: string;
}

/** Users */
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface OrgUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  status?: UserStatus | null;
  roles?: Role[] | string[];
  createdAt?: string;
  updatedAt?: string;
}

/** Webhooks */
export interface Webhook {
  id: string;
  url: string;
  events?: string[] | null;
  secret?: string | null;
  active?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  statusCode?: number | null;
  success?: boolean;
  attempts?: number;
  createdAt?: string;
}

/** Audit */
export interface AuditLog {
  id: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  userId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
}

/** Reports */
export interface FinancialReport {
  period?: { from?: string; to?: string; currency?: string };
  expectedMonthlyRent?: number;
  collectedThisMonth?: number;
  outstanding?: { amount?: number; count?: number };
  overdue?: { amount?: number; count?: number };
  byMonth?: Array<{ month: string; collected: number }>;
  occupancyRate?: number;
  units?: { total?: number; occupied?: number };
  currency?: string;
  [key: string]: unknown;
}

export interface OccupancyReport {
  totals?: {
    totalUnits?: number;
    occupied?: number;
    vacant?: number;
    underMaintenance?: number;
    occupancyRate?: number;
  };
  properties?: Array<{
    propertyId?: string;
    name?: string;
    totalUnits?: number;
    occupied?: number;
    vacant?: number;
    occupancyRate?: number;
  }>;
  [key: string]: unknown;
}

/** Organization / settings */
export interface Organization {
  id: string;
  name: string;
  language?: string | null;
  currency?: string | null;
  timezone?: string | null;
  [key: string]: unknown;
}

export interface OrgSettings {
  currency?: string;
  language?: string;
  timezone?: string;
  [key: string]: unknown;
}

/** Pagination query helper */
export interface PageQuery {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}
