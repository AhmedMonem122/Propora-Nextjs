import { z } from 'zod';

export const leaseSchema = z.object({
  unitId: z.string().min(1, 'Unit is required.'),
  residentId: z.string().min(1, 'Resident is required.'),
  startDate: z.string().min(1, 'Start date is required.'),
  endDate: z.string().optional().or(z.literal('')),
  rentAmount: z.coerce.number().min(0, 'Rent must be positive.'),
  depositAmount: z.coerce.number().min(0).optional(),
  paymentFrequency: z.enum(['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL']).optional().or(z.literal('')),
  status: z.enum(['UPCOMING', 'ACTIVE', 'ENDED', 'TERMINATED']).optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export type LeaseValues = z.infer<typeof leaseSchema>;
