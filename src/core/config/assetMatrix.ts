export interface AssetSlot {
  id: string; // The physical string ID: e.g., "mach-SAT1-01"
  referenceCode: string; // "SAT1-01"
  blueprintId: string;
  index: number;
}

export const MAX_ASSETS_PER_BLUEPRINT = 999;

export const getAssetMatrixForBlueprint = (blueprintId: string, blueprintReference: string): AssetSlot[] => {
  // Extract base prefix like "SAT1", "MP", etc. from blueprint reference
  let basePrefix = blueprintReference;
  if (blueprintReference.includes('-00')) {
    basePrefix = blueprintReference.split('-')[0];
  } else if (blueprintReference.includes('-')) {
    // some legacy refs like MP-2013-00
    basePrefix = blueprintReference.split('-')[0];
  }

  return Array.from({ length: MAX_ASSETS_PER_BLUEPRINT }, (_, i) => {
    const index = i + 1;
    const refNum = index.toString().padStart(2, '0');
    // e.g., SAT1-01
    const referenceCode = `${basePrefix}-${refNum}`;
    
    return {
      id: `mach-${referenceCode.toLowerCase()}`,
      referenceCode,
      blueprintId,
      index
    };
  });
};
