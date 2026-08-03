import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MiddlewareChain } from '@/core/middleware';
import {
  TransactionContext,
  validationMiddleware,
  businessRulesMiddleware,
  authorizationMiddleware,
} from '../repositories/InventoryRepository';

// Mock the global db & repositories since we only want to test rules
vi.mock('@/features/pdr-engine/repositories/InventoryRepository', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    inventoryRepository: {
      getById: vi.fn(),
      updateStock: vi.fn(),
      recordMovement: vi.fn(),
    }
  };
});

describe('Inventory Transactions & Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Validation Middleware', () => {
    it('should reject transactions with zero or negative quantity', async () => {
      const chain = new MiddlewareChain<TransactionContext>();
      chain.use(validationMiddleware);

      const ctx: any = { quantity: 0, stockId: 'stk-123', performedBy: 'Tech 1' };
      
      await expect(chain.execute(ctx)).rejects.toThrow('Quantity must be greater than zero.');
    });

    it('should reject transactions with no stockId', async () => {
      const chain = new MiddlewareChain<TransactionContext>();
      chain.use(validationMiddleware);

      const ctx: any = { quantity: 5, stockId: '', performedBy: 'Tech 1' };
      
      await expect(chain.execute(ctx)).rejects.toThrow('No stock item selected.');
    });

    it('should reject transactions with no technician name', async () => {
      const chain = new MiddlewareChain<TransactionContext>();
      chain.use(validationMiddleware);

      const ctx: any = { quantity: 5, stockId: 'stk-123', performedBy: '   ' };
      
      await expect(chain.execute(ctx)).rejects.toThrow('Technician name is required.');
    });

    it('should pass valid data', async () => {
      const chain = new MiddlewareChain<TransactionContext>();
      chain.use(validationMiddleware);

      const ctx: any = { quantity: 5, stockId: 'stk-123', performedBy: 'Tech 1' };
      
      await expect(chain.execute(ctx)).resolves.toBeUndefined();
    });
  });

  describe('Authorization Middleware', () => {
    it('should reject if no user and no performedBy is provided', async () => {
      const chain = new MiddlewareChain<TransactionContext>();
      chain.use(authorizationMiddleware);

      const ctx: any = { user: null, performedBy: '' };
      
      await expect(chain.execute(ctx)).rejects.toThrow('Unauthorized transaction');
    });

    it('should pass if user is provided', async () => {
      const chain = new MiddlewareChain<TransactionContext>();
      chain.use(authorizationMiddleware);

      const ctx: any = { user: { id: 'usr-1' }, performedBy: '' };
      
      await expect(chain.execute(ctx)).resolves.toBeUndefined();
    });
  });
});
