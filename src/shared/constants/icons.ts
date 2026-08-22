import React from 'react';
import { 
  // 1️⃣ Family Icons
  Shapes, 
  Layers, 
  // 2️⃣ Template Icons
  Component, 
  Box, 
  Cpu, 
  // 3️⃣ Blueprint Icons
  FileCode, 
  FileEdit as Drafts, 
  Compass,
  // 4️⃣ Architect & Lab Pages Icons
  DraftingCompass,
  Ruler,
  Building2,
  HardHat,
  // Common fallback
  LucideIcon
} from 'lucide-react';

/**
 * BDR Nexus Standard Icons Mapping
 * Based on Chapter 20 of the Architecture Constitution (GMAO v17.1)
 */

// 1️⃣ Family Icons
export const FAMILY_ICONS = {
  Shapes,  // Component Family (Default)
  Layers,  // Machine Family
} as const;

// 2️⃣ Template Icons
export const TEMPLATE_ICONS = {
  Component, // Official Component Template
  Box,       // Individual Item / Part Template
  Cpu,       // Machine / Subsystem Template
} as const;

// 3️⃣ Blueprint Icons
export const BLUEPRINT_ICONS = {
  FileCode,  // Official Blueprint Card Icon
  Compass,   // Engineering & Architectural Design
  Drafts,    // Drafts, Sketches & Initial Designs (FileEdit)
} as const;

// 4️⃣ Architect & Lab Pages Icons
export const ARCHITECT_LAB_ICONS = {
  DraftingCompass, // Primary icon for architectural planning & precise design
  Ruler,           // Measurement tools & engineering specs
  Building2,       // Industrial structure & facility building
  HardHat,         // Field construction & applied engineering
} as const;

// Standard Icons Registry Dictionary
export const NEXUS_STANDARD_ICONS: Record<string, LucideIcon> = {
  ...FAMILY_ICONS,
  ...TEMPLATE_ICONS,
  ...BLUEPRINT_ICONS,
  ...ARCHITECT_LAB_ICONS,
};

/**
 * Returns the appropriate Family Icon Component.
 * @param iconName Optional string name of the icon
 * @param type Optional family category ('component' | 'machine')
 */
export function getFamilyIcon(iconName?: string, type: 'component' | 'machine' = 'component'): LucideIcon {
  if (iconName && NEXUS_STANDARD_ICONS[iconName]) {
    return NEXUS_STANDARD_ICONS[iconName];
  }
  return type === 'machine' ? Layers : Shapes;
}

/**
 * Returns the appropriate Template Icon Component.
 * @param iconName Optional string name of the icon
 * @param type Optional template category ('component' | 'part' | 'subsystem')
 */
export function getTemplateIcon(iconName?: string, type: 'component' | 'part' | 'subsystem' = 'component'): LucideIcon {
  if (iconName && NEXUS_STANDARD_ICONS[iconName]) {
    return NEXUS_STANDARD_ICONS[iconName];
  }
  switch (type) {
    case 'part':
      return Box;
    case 'subsystem':
      return Cpu;
    case 'component':
    default:
      return Component;
  }
}

/**
 * Returns the appropriate Blueprint Icon Component.
 * @param iconName Optional string name of the icon
 * @param type Optional blueprint category ('card' | 'engineering' | 'draft')
 */
export function getBlueprintIcon(iconName?: string, type: 'card' | 'engineering' | 'draft' = 'card'): LucideIcon {
  if (iconName && NEXUS_STANDARD_ICONS[iconName]) {
    return NEXUS_STANDARD_ICONS[iconName];
  }
  switch (type) {
    case 'engineering':
      return Compass;
    case 'draft':
      return Drafts;
    case 'card':
    default:
      return FileCode;
  }
}

/**
 * Returns the appropriate Architect / Lab Page Icon Component.
 * @param iconName Optional string name of the icon
 * @param type Optional category ('planning' | 'measurement' | 'facility' | 'construction')
 */
export function getArchitectIcon(iconName?: string, type: 'planning' | 'measurement' | 'facility' | 'construction' = 'planning'): LucideIcon {
  if (iconName && NEXUS_STANDARD_ICONS[iconName]) {
    return NEXUS_STANDARD_ICONS[iconName];
  }
  switch (type) {
    case 'measurement':
      return Ruler;
    case 'facility':
      return Building2;
    case 'construction':
      return HardHat;
    case 'planning':
    default:
      return DraftingCompass;
  }
}

/**
 * Universal lookup for BDR Nexus standard icons with fallback.
 */
export function getNexusIcon(iconName?: string, fallbackIcon: LucideIcon = Shapes): LucideIcon {
  if (iconName && NEXUS_STANDARD_ICONS[iconName]) {
    return NEXUS_STANDARD_ICONS[iconName];
  }
  return fallbackIcon;
}
