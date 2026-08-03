export interface MatrixSlot {
  id: string;
  reference: string;
  index: number;
}

export const MAX_BLUEPRINTS_PER_TEMPLATE = 5;

export const getBlueprintMatrixForTemplate = (templateId: string, templateSkuBase: string): MatrixSlot[] => {
  return Array.from({ length: MAX_BLUEPRINTS_PER_TEMPLATE }).map((_, i) => ({
    id: `bp-${templateId}-${i + 1}`,
    reference: `${templateSkuBase}${i + 1}-00`,
    index: i + 1,
  }));
};
