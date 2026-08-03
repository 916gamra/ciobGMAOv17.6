export interface PdrFamilyDef {
  id: string; // e.g. fam-CO
  code: string; // e.g. CO
  name: string;
  group?: 'mecanique' | 'hydraulique' | 'electronique' | 'pneumatique' | 'autre';
}

export interface PdrTemplateDef {
  id: string; // e.g. temp-CO-A
  familyId: string;
  code: string; // e.g. CO-A
  name: string;
}

export const MAX_PDR_SLOTS_PER_TEMPLATE = 999;

export const PDR_FAMILIES: PdrFamilyDef[] = [
  // Existing Mechanical Core
  { id: 'fam-CO', code: 'CO', name: 'COURROIES', group: 'mecanique' },
  { id: 'fam-RO', code: 'RO', name: 'ROULEMENTS', group: 'mecanique' },
  { id: 'fam-VI', code: 'VI', name: 'VISSERIE', group: 'mecanique' },
  
  // Power & Control
  { id: 'fam-DIS', code: 'DIS', name: 'DISJONCTEURS', group: 'electronique' },
  { id: 'fam-CON', code: 'CON', name: 'CONTACTEURS', group: 'electronique' },
  { id: 'fam-REL', code: 'REL', name: 'RELAIS', group: 'electronique' },
  { id: 'fam-VAR', code: 'VAR', name: 'VARIATEURS & MOTEURS', group: 'electronique' },
  
  // Automation & Sensing
  { id: 'fam-SEN', code: 'SEN', name: 'CAPTEURS & DETECTION', group: 'electronique' },
  { id: 'fam-AUT', code: 'AUT', name: 'AUTOMATISMES & HMI', group: 'electronique' },
  
  // Fluid Power
  { id: 'fam-PNU', code: 'PNU', name: 'PNEUMATIQUE & HYDRAULIQUE', group: 'pneumatique' },
  
  // Mechanical Core (Bearings/Belts covered, adding transmission/hardware)
  { id: 'fam-MEC', code: 'MEC', name: 'TRANSMISSION & PALIERS', group: 'mecanique' },
  
  // Consumables & Miscellaneous
  { id: 'fam-CON-DIV', code: 'DIV', name: 'CONSOMMABLES & DIVERS', group: 'autre' }
];

export const PDR_TEMPLATES: PdrTemplateDef[] = [
  // COURROIES
  { id: 'temp-CO-A', familyId: 'fam-CO', code: 'CO-A', name: 'Courroie Type A' },
  { id: 'temp-CO-B', familyId: 'fam-CO', code: 'CO-B', name: 'Courroie Type B' },
  { id: 'temp-CO-SPZ', familyId: 'fam-CO', code: 'CO-SPZ', name: 'Courroie Type SPZ' },
  
  // ROULEMENTS
  { id: 'temp-RO-B', familyId: 'fam-RO', code: 'RO-B', name: 'Roulement Standard Ball 6xxx' },
  { id: 'temp-RO-C', familyId: 'fam-RO', code: 'RO-C', name: 'Roulement Conical 3xxxx' },
  { id: 'temp-RO-T', familyId: 'fam-RO', code: 'RO-T', name: 'Roulement Thrust 5xxxx' },

  // VISSERIE
  { id: 'temp-VI-BTR', familyId: 'fam-VI', code: 'VI-BTR', name: 'Vis Allen/BTR' },
  { id: 'temp-VI-HEX', familyId: 'fam-VI', code: 'VI-HEX', name: 'Vis Hexagonale' },
  { id: 'temp-VI-SST', familyId: 'fam-VI', code: 'VI-SST', name: 'Vis Sans Tête' },

  // ELECTRIC PROTECTION (DIS)
  { id: 'temp-DIS-MAG', familyId: 'fam-DIS', code: 'DIS-MAG', name: 'Disjoncteur Magnéto-thermique' },
  { id: 'temp-DIS-DIF', familyId: 'fam-DIS', code: 'DIS-DIF', name: 'Disjoncteur Différentiel' },
  { id: 'temp-FUS', familyId: 'fam-DIS', code: 'DIS-FUS', name: 'Fusible' },

  // CONTROL & SWITCHING (CON / REL)
  { id: 'temp-CON-POW', familyId: 'fam-CON', code: 'CON-POW', name: 'Contacteur Puissance' },
  { id: 'temp-REL-AUX', familyId: 'fam-REL', code: 'REL-AUX', name: 'Relais Auxiliaire / Statique' },
  { id: 'temp-BTN-CMD', familyId: 'fam-CON', code: 'CON-BTN', name: 'Boutons & Commutateurs' },

  // SENSORS & DETECTION (SEN)
  { id: 'temp-SEN-IND', familyId: 'fam-SEN', code: 'SEN-IND', name: 'Capteur Inductif / Capacitif' },
  { id: 'temp-SEN-OPT', familyId: 'fam-SEN', code: 'SEN-OPT', name: 'Capteur Photoélectrique' },
  { id: 'temp-SEN-THR', familyId: 'fam-SEN', code: 'SEN-THR', name: 'Thermostat / Sonde PT100' },
  { id: 'temp-SEN-LIM', familyId: 'fam-SEN', code: 'SEN-LIM', name: 'Fin de Course (Limit Switch)' },

  // FLUID POWER (PNU)
  { id: 'temp-PNU-VER', familyId: 'fam-PNU', code: 'PNU-VER', name: 'Vérin Pneumatique' },
  { id: 'temp-PNU-VAL', familyId: 'fam-PNU', code: 'PNU-VAL', name: 'Électrovanne' },
  { id: 'temp-PNU-FRL', familyId: 'fam-PNU', code: 'PNU-FRL', name: 'Unité FRL & Raccords' },

  // AUTOMATION (AUT)
  { id: 'temp-AUT-PLC', familyId: 'fam-AUT', code: 'AUT-PLC', name: 'Automate Programmable (PLC)' },
  { id: 'temp-AUT-HMI', familyId: 'fam-AUT', code: 'AUT-HMI', name: 'IHM (Afficheur)' },
  { id: 'temp-AUT-PWR', familyId: 'fam-AUT', code: 'AUT-PWR', name: 'Bloc d\'Alimentation (PSU)' },

  // MOTORS & SPEED (VAR)
  { id: 'temp-VAR-VFD', familyId: 'fam-VAR', code: 'VAR-VFD', name: 'Variateur de Vitesse (VFD)' },
  { id: 'temp-MOT-ECA', familyId: 'fam-VAR', code: 'MOT-ECA', name: 'Moteur Électrique AC' },

  // MECHANICAL TRANSMISSION (MEC)
  { id: 'temp-MEC-PAL', familyId: 'fam-MEC', code: 'MEC-PAL', name: 'Palier (UCF, UCP, etc.)' },
  { id: 'temp-MEC-RED', familyId: 'fam-MEC', code: 'MEC-RED', name: 'Réducteur (Gearbox)' },

  // DIVERS & CONSOMMABLES
  { id: 'temp-DIV-GEN', familyId: 'fam-CON-DIV', code: 'DIV-GEN', name: 'Outillage Divers & Consommable (Gants, Huile, etc.)' }
];

// Logic for deterministically generating an immutable ID for a dormant slot
export const generatePdrSlotId = (templateCode: string, slotIndex: number): string => {
  if (slotIndex < 1 || slotIndex > MAX_PDR_SLOTS_PER_TEMPLATE) {
    throw new Error(`Slot index must be between 1 and ${MAX_PDR_SLOTS_PER_TEMPLATE}`);
  }
  const tCode = templateCode.replace('-', ''); // CO-A -> COA
  const indexStr = slotIndex.toString().padStart(3, '0'); // 1 -> 001
  return `PDR-${tCode}-${indexStr}`.toUpperCase();
};

export const parsePdrSlotId = (slotId: string): { templateCode: string; slotNumber: number } => {
  const parts = slotId.split('-');
  if (parts.length < 3) {
    throw new Error(`Invalid PDR Slot ID format: ${slotId}`);
  }
  const slotNumber = parseInt(parts[parts.length - 1], 10);
  const templateCode = parts.slice(1, -1).join('-');
  return { templateCode, slotNumber };
};

