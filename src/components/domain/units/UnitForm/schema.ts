import { z } from 'zod';

export const unitSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  unitNumber: z.string().optional().or(z.literal('')),
  type: z.string().optional().or(z.literal('')),
  unitTypeId: z.string().optional().or(z.literal('')),
  bedrooms: z.coerce.number().min(0).optional(),
  bathrooms: z.coerce.number().min(0).optional(),
  areaSqm: z.coerce.number().min(0).optional(),
  floor: z.coerce.number().int().optional(),
  rentAmount: z.coerce.number().min(0).optional(),
  depositAmount: z.coerce.number().min(0).optional(),
  status: z.enum(['VACANT', 'OCCUPIED', 'UNDER_MAINTENANCE', 'INACTIVE']).optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
});

export type UnitValues = z.infer<typeof unitSchema>;
