import { describe, it, expect } from 'vitest';
import { generatePdrSlotId, parsePdrSlotId, MAX_PDR_SLOTS_PER_TEMPLATE } from '../config/pdrMatrix';

describe('PDR Nomenclature & 999 Slots Rule', () => {
  it('should format slot 1 as 001 with family prefix', () => {
    const slotCode = generatePdrSlotId('ROB', 1);
    expect(slotCode).toBe('PDR-ROB-001');
  });

  it('should format slot 50 as 050 with family prefix', () => {
    const slotCode = generatePdrSlotId('ROB', 50);
    expect(slotCode).toBe('PDR-ROB-050');
  });

  it('should format slot 999 as 999 with family prefix', () => {
    const slotCode = generatePdrSlotId('ROB', 999);
    expect(slotCode).toBe('PDR-ROB-999');
  });

  it('should enforce slot range limits between 1 and 999', () => {
    expect(MAX_PDR_SLOTS_PER_TEMPLATE).toBe(999);
    expect(() => generatePdrSlotId('ROB', 0)).toThrow();
    expect(() => generatePdrSlotId('ROB', 1000)).toThrow();
  });

  it('should parse valid slot code into family and numeric slot', () => {
    const parsed = parsePdrSlotId('PDR-ELE-042');
    expect(parsed).toEqual({ templateCode: 'ELE', slotNumber: 42 });
  });
});

