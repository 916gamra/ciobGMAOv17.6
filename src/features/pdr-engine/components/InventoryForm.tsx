// src/features/pdr-engine/components/InventoryForm.tsx
import { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import { Validator, CreateInventorySchema } from '@/core/validation/schemas';
import { createLogger } from '@/core/logging/Logger';

const logger = createLogger('InventoryForm');

export function InventoryForm({ userId }: { userId: string }) {
  const { addItem, loading, error } = useInventory();
  const [formData, setFormData] = useState({
    partId: '',
    quantity: 0,
    location: '',
    minStock: 0,
    maxStock: 100,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(false);

    try {
      logger.info('Submitting inventory form', { formData });

      // Validate
      const validated = Validator.validate(CreateInventorySchema, formData);

      // Add item
      const result = await addItem(validated, userId);

      if (result.ok) {
        logger.info('Inventory item added successfully', { id: result.value });
        setSuccess(true);
        setFormData({
          partId: '',
          quantity: 0,
          location: '',
          minStock: 0,
          maxStock: 100,
        });
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setFormError(result.error.message);
        logger.error('Failed to add inventory item', new Error(result.error.message));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setFormError(message);
      logger.error('Form submission error', err instanceof Error ? err : new Error(message));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
      <h2 className="text-xl font-bold text-white mb-6">إضافة مخزون جديد</h2>

      {/* Error Messages */}
      {(error || formError) && (
        <div className="p-4 bg-rose-900/30 border border-rose-500/50 rounded-lg">
          <p className="text-rose-400 font-semibold">خطأ</p>
          <p className="text-rose-300 text-sm mt-1">
            {error?.message || formError}
          </p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-emerald-900/30 border border-emerald-500/50 rounded-lg">
          <p className="text-emerald-400 font-semibold">تم بنجاح</p>
          <p className="text-emerald-300 text-sm mt-1">
            تم إضافة المخزون بنجاح
          </p>
        </div>
      )}

      {/* Form Fields */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          معرف الجزء *
        </label>
        <input
          type="text"
          value={formData.partId}
          onChange={(e) =>
            setFormData({ ...formData, partId: e.target.value })
          }
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            الكمية *
          </label>
          <input
            type="number"
            value={formData.quantity}
            onChange={(e) =>
              setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
            }
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            الموقع *
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            الحد الأدنى
          </label>
          <input
            type="number"
            value={formData.minStock}
            onChange={(e) =>
              setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })
            }
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            الحد الأقصى
          </label>
          <input
            type="number"
            value={formData.maxStock}
            onChange={(e) =>
              setFormData({ ...formData, maxStock: parseInt(e.target.value) || 0 })
            }
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-white text-slate-950 font-extrabold rounded-xl hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg text-xs"
      >
        {loading ? 'جاري الإضافة...' : 'إضافة المخزون'}
      </button>
    </form>
  );
}
