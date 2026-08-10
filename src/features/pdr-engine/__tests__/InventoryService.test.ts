import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InventoryService } from '../services/InventoryService';

// Mock dependencies
const mockDbGet = vi.fn();
const mockDbUpdate = vi.fn();
const mockDbAdd = vi.fn();

vi.mock('@/core/db', () => ({
  db: {
    inventory: {
      get: (...args: any[]) => mockDbGet(...args),
      update: (...args: any[]) => mockDbUpdate(...args),
      add: (...args: any[]) => mockDbAdd(...args)
    },
    transactions: {
      add: vi.fn()
    }
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
      mockDbGet.mockResolvedValue({
        id: 'inv-1',
        quantityCurrent: 100
      });
      mockDbUpdate.mockResolvedValue(1);

      // Act
      const result = await service.submitRequisition({
        inventoryId: 'inv-1',
        quantity: 10,
        userId: 'u1'
      });

      // Assert
      expect(result.ok).toBe(true);
      expect(mockDbUpdate).toHaveBeenCalledWith('inv-1', expect.objectContaining({
        quantityCurrent: 90,
        quantity: 90
      }));
    });

    it('should prevent over-deduction', async () => {
      // Arrange
      mockDbGet.mockResolvedValue({
        id: 'inv-1',
        quantityCurrent: 5
      });

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
      expect(mockDbUpdate).not.toHaveBeenCalled();
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
      expect(mockDbGet).not.toHaveBeenCalled();
    });
  });
});
