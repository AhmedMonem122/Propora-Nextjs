import { z } from 'zod';

export const maintenanceSchema = z.object({
  unitId: z.string().min(1, 'Unit is required.'),
  residentId: z.string().optional().or(z.literal('')),
  title: z.string().min(1, 'Title is required.'),
  description: z.string().optional().or(z.literal('')),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export type MaintenanceValues = z.infer<typeof maintenanceSchema>;
