import { describe, it, expect } from 'vitest';

/**
 * Test Suite verifying Rule 999 Slots & Industrial Nomenclature Generation
 */
function generateNextSlotCode(familyCode: string, existingSlotNumbers: number[]): string {
  const maxSlot = existingSlotNumbers.length > 0 ? Math.max(...existingSlotNumbers) : 0;
  const nextSlot = maxSlot + 1;

  if (nextSlot > 999) {
    throw new Error(`999 Slots Exceeded for family [${familyCode}]`);
  }

  const paddedSlot = String(nextSlot).padStart(3, '0');
  return `${familyCode}-${paddedSlot}`;
}

describe('Rule 999 Slots Nomenclature Engine', () => {
  it('should generate ROB-001 for first item in Roulement family', () => {
    const code = generateNextSlotCode('ROB', []);
    expect(code).toBe('ROB-001');
  });

  it('should generate ROB-050 after 49 items', () => {
    const existingSlots = Array.from({ length: 49 }, (_, i) => i + 1);
    const code = generateNextSlotCode('ROB', existingSlots);
    expect(code).toBe('ROB-050');
  });

  it('should format numbers with exactly 3 digits padding', () => {
    const code5 = generateNextSlotCode('MOT', [1, 2, 3, 4]);
    expect(code5).toBe('MOT-005');

    const code100 = generateNextSlotCode('MOT', Array.from({ length: 99 }, (_, i) => i + 1));
    expect(code100).toBe('MOT-100');
  });

  it('should throw an error when 999 slots capacity limit is exceeded', () => {
    const fullSlots = Array.from({ length: 999 }, (_, i) => i + 1);
    expect(() => generateNextSlotCode('ELM', fullSlots)).toThrow('999 Slots Exceeded for family [ELM]');
  });
});
