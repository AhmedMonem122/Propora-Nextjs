import { z } from 'zod';

export const buildingSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  code: z.string().optional().or(z.literal('')),
  totalFloors: z.coerce.number().int().min(0).optional(),
  address: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional().or(z.literal('')),
});

export type BuildingValues = z.infer<typeof buildingSchema>;
