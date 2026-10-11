import { describe, expect, it } from 'vitest';
import { propertySchema } from '@/components/domain/properties/PropertyForm/schema';
import { leaseSchema } from '@/components/domain/leases/LeaseForm/schema';
import { maintenanceSchema } from '@/components/domain/maintenance/MaintenanceForm/schema';

describe('propertySchema', () => {
  it('requires a name', () => {
    expect(propertySchema.safeParse({}).success).toBe(false);
    expect(propertySchema.safeParse({ name: 'Sunrise' }).success).toBe(true);
  });
});

describe('leaseSchema', () => {
  it('requires unit, resident, start and rent', () => {
    expect(leaseSchema.safeParse({}).success).toBe(false);
    expect(
      leaseSchema.safeParse({ unitId: 'u1', residentId: 'r1', startDate: '2026-11-01', rentAmount: 4500 }).success,
    ).toBe(true);
  });

  it('rejects negative rent', () => {
    const r = leaseSchema.safeParse({ unitId: 'u1', residentId: 'r1', startDate: '2026-11-01', rentAmount: -5 });
    expect(r.success).toBe(false);
  });
});

describe('maintenanceSchema', () => {
  it('requires unit and title', () => {
    expect(maintenanceSchema.safeParse({ title: 'x' }).success).toBe(false);
    expect(maintenanceSchema.safeParse({ unitId: 'u1', title: 'AC broken' }).success).toBe(true);
  });
});
