import { useState, useCallback } from 'react';
import { useAuthStore } from '@/app/store/useAuthStore';
import { MiddlewareChain } from '@/core/middleware';
import { 
  TransactionContext, 
  validationMiddleware, 
  authorizationMiddleware, 
  loggingMiddleware, 
  businessRulesMiddleware, 
  persistenceMiddleware 
} from '../repositories/InventoryRepository';
import { toast } from 'sonner';

export function useStockTransaction() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuthStore();

  const executeTransaction = useCallback(async (
    stockId: string,
    type: 'IN' | 'OUT' | 'ADJUST',
    quantity: number,
    performedBy: string,
    machineId?: string,
    notes?: string
  ): Promise<boolean> => {
    setIsProcessing(true);
    setError(null);
    try {
      const chain = new MiddlewareChain<TransactionContext>();
      
      // Inject notification flow
      chain
        .use(validationMiddleware)
        .use(authorizationMiddleware)
        .use(loggingMiddleware)
        .use(businessRulesMiddleware)
        .use(persistenceMiddleware)
        .use(async (ctx, next) => {
          await next(); // Proceed with chain
          // Notification middleware logic after successful execution
          toast.success(`${type === 'IN' ? 'Restock' : type === 'OUT' ? 'Withdrawal' : 'Adjustment'} Successful. New Balance: ${ctx.newQuantity}`);
        });

      await chain.execute({
        stockId,
        type,
        quantity,
        performedBy,
        machineId,
        notes,
        user: currentUser
      });

      return true;
    } catch (err: any) {
      setError(err?.message || 'Transaction failed.');
      toast.error(err?.message || 'Transaction failed.');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [currentUser]);

  const clearError = useCallback(() => setError(null), []);

  return {
    executeTransaction,
    isProcessing,
    error,
    clearError,
  };
}

