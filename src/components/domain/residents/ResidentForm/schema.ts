import { z } from 'zod';

export const residentSchema = z.object({
  userId: z.string().optional().or(z.literal('')),
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.string().email('Enter a valid email.').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  idNumber: z.string().optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional().or(z.literal('')),
  emergencyContact: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export type ResidentValues = z.infer<typeof residentSchema>;
