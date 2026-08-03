import { z } from 'zod';

export const MachineFamilySchema = z.object({
  name: z.string().min(1, "اسم العائلة مطلوب"),
  code: z.string().min(1, "رمز العائلة مطلوب").max(5, "الرمز يجب ألا يتجاوز 5 أحرف"),
  techDesc: z.string().optional()
});

export const MachineTemplateSchema = z.object({
  familyId: z.string().min(1, "عائلة الآلة مطلوبة"),
  name: z.string().min(1, "اسم القالب مطلوب"),
  type: z.enum(['A', 'S', 'I', 'E', 'P', 'H', 'M']),
  skuBase: z.string().min(1, "القاعدة الرمزية (SKU) مطلوبة").max(10, "الرمز يجب ألا يتجاوز 10 أحرف"),
  techDesc: z.string().optional()
});

export const MachineBlueprintSchema = z.object({
  templateId: z.string().min(1, "قالب الآلة مطلوب"),
  brand: z.string().min(1, "الشركة المصنعة مطلوبة"),
  model: z.string().min(1, "موديل القطعة مطلوب"),
  power: z.string().optional(),
  energyType: z.string().optional()
});

export const MachineInstanceSchema = z.object({
  templateId: z.string().optional(), // In case of Direct Asset
  blueprintId: z.string().optional(), // In case of Standard Asset
  referenceCode: z.string().min(1, "رقم الآلة المرجعي (Nomenclature) مطلوب"),
  serialNumber: z.string().optional(),
  manufacturingYear: z.number().int().min(1900).max(2100).optional(),
  sectorId: z.string().min(1, "الرجاء تحديد قطاع (Sector)"),
  technicianId: z.string().min(1, "الرجاء تحديد فني (Technician)")
}).refine(data => data.templateId || data.blueprintId, {
  message: "يجب اختيار قالب أو بصمة للآلة",
  path: ["blueprintId"]
});
