import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InventoryService } from '../services/InventoryService';

// Mock dependencies
const mockGetById = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/core/repositories/GenericRepository', () => {
  return {
    GenericRepository: class {
      getById = mockGetById;
      update = mockUpdate;
    }
  };
});
vi.mock('@/core/db', () => ({
  db: {
    inventory: {}
  }
}));

import { success, failure } from '@/core/types/Result';

describe('InventoryService', () => {
  let service: InventoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new InventoryService();
  });

  describe('submitRequisition', () => {
    it('should deduct stock correctly', async () => {
      // Arrange
      mockGetById.mockResolvedValue(success({
        id: 'inv-1',
        quantityCurrent: 100
      }));
      mockUpdate.mockResolvedValue(success(undefined));

      // Act
      const result = await service.submitRequisition({
        inventoryId: 'inv-1',
        quantity: 10,
        userId: 'u1'
      });

      // Assert
      expect(result.ok).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith('inv-1', {
        quantityCurrent: 90
      });
    });

    it('should prevent over-deduction', async () => {
      // Arrange
      mockGetById.mockResolvedValue(success({
        id: 'inv-1',
        quantityCurrent: 5
      }));

      // Act
      const result = await service.submitRequisition({
        inventoryId: 'inv-1',
        quantity: 10,
        userId: 'u1'
      });

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Insufficient stock available');
      }
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should reject invalid quantities', async () => {
      // Act
      const result = await service.submitRequisition({
        inventoryId: 'inv-1',
        quantity: -5,
        userId: 'u1'
      });

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Quantity must be greater than zero');
      }
      expect(mockGetById).not.toHaveBeenCalled();
    });
  });
});
