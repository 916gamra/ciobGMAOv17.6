/**
 * ISO 14224 Standard Industrial Hierarchy Validator
 * Enforces strict 5-level taxonomy graph validation for machinery maintenance failure logs.
 * Levels: Equipment (1) -> Subunit (2) -> Component (3) -> Maintainable Item (4) -> Failure Mode & Cause (5)
 */

export interface Iso14224HierarchyGraphInput {
  plantId?: string;
  functionalLocationId?: string;
  assetId?: string;           // Level 1: Equipment / Machine
  subunitId?: string;         // Level 2: Subsystem / Section
  componentId?: string;       // Level 3: Assembly / Component
  maintainableItemId?: string;// Level 4: Specific Spare Part / PDR
  failureMode?: string;       // Level 5: Failure Mode (e.g., Vibration, Leakage, Overheating)
  mechanism?: string;         // Failure Mechanism
  causeCategory?: string;     // Failure Cause Category (e.g., Wear and Tear, Operator Error, Fatigue)
}

export interface Iso14224ValidationResult {
  ok: boolean;
  errors: string[];
  levelReached: number; // 1 to 5
}

export function validateIso14224Graph(input: Iso14224HierarchyGraphInput): Iso14224ValidationResult {
  const errors: string[] = [];
  let levelReached = 0;

  // Level 1: Equipment / Asset Check
  if (!input.assetId) {
    errors.push('ISO 14224 Level 1 Violation: Equipment / Machine ID (assetId) is mandatory.');
  } else {
    levelReached = 1;
  }

  // Level 2: Sub-system / Subunit Check
  if (!input.subunitId && !input.functionalLocationId) {
    errors.push('ISO 14224 Level 2 Violation: Subunit or Functional Location is required to anchor failure position.');
  } else if (levelReached === 1) {
    levelReached = 2;
  }

  // Level 3: Component Assembly Check
  if (!input.componentId) {
    errors.push('ISO 14224 Level 3 Violation: Component assembly assignment is missing.');
  } else if (levelReached === 2) {
    levelReached = 3;
  }

  // Level 4: Maintainable Item / Part
  if (!input.maintainableItemId) {
    errors.push('ISO 14224 Level 4 Violation: Specific maintainable item or spare part reference is required.');
  } else if (levelReached === 3) {
    levelReached = 4;
  }

  // Level 5: Failure Taxonomy Mode & Cause
  if (!input.failureMode || !input.failureMode.trim()) {
    errors.push('ISO 14224 Level 5 Violation: Standardised Failure Mode must be specified.');
  }
  if (!input.causeCategory || !input.causeCategory.trim()) {
    errors.push('ISO 14224 Level 5 Violation: Standardised Cause Category must be specified.');
  }

  if (levelReached === 4 && input.failureMode && input.causeCategory) {
    levelReached = 5;
  }

  return {
    ok: errors.length === 0,
    errors,
    levelReached
  };
}
