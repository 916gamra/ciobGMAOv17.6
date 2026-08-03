import { z } from 'zod';

export const AddInventorySchema = z.object({
  blueprintId: z.string().min(1, "الرجاء اختيار البصمة (Blueprint)"),
  warehouseId: z.string().min(1, "الرجاء تحديد المخزن"),
  locationDetails: z.string().optional(),
  quantity: z.number().min(0, "لا يمكن أن تكون الكمية سالبة"),
  condition: z.enum(['NEW', 'USED', 'REFURBISHED', 'LEGACY'])
});

export const StockTransactionSchema = z.object({
  stockId: z.string().min(1, "الرجاء اختيار القطعة من المخزون"),
  type: z.enum(['IN', 'OUT']),
  quantity: z.number().positive("الكمية يجب أن تكون أكبر من صفر"),
  performedBy: z.string().min(1, "الرجاء إدخال اسم الفني / المستلم"),
  machineId: z.string().optional(),
  notes: z.string().optional()
}).refine(data => {
  if (data.type === 'OUT' && !data.machineId) {
    return false;
  }
  return true;
}, {
  message: "الرجاء اختيار الآلة المستهلكة لإتمام عملية السحب",
  path: ["machineId"]
});
