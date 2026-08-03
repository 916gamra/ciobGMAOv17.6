import { db } from '../db';

export async function checkAndSeedSandbox() {
  try {
    const isSeeded = localStorage.getItem('BDR_NEXUS_SANDBOX_SEEDED_V55');
    if (isSeeded === 'true') {
      return; // Already seeded.
    }

    console.log('[SandboxSeeder] Executing seeding of initial sectors, TRR, PRI, SAT, TRP, RCP, PER, MRT, FRM, MEL, SCM, POA V1/V2/V3/V4, POM, and RVA machines into sandbox...');

    await db.transaction('rw', [
      db.pdrFamilies,
      db.pdrTemplates,
      db.pdrBlueprints,
      db.inventory,
      db.movements,
      db.sectors,
      db.technicians,
      db.machines,
      db.machineFamilies,
      db.machineTemplates,
      db.machineBlueprints,
      db.machinePartMappings,
      db.preventiveTasks,
      db.taskExecutions,
      db.standardComponents,
      db.standardActions
    ], async () => {
      // Clear all items to give the user a pure empty sandbox.
      await db.pdrFamilies.clear();
      await db.pdrTemplates.clear();
      await db.pdrBlueprints.clear();
      await db.inventory.clear();
      await db.movements.clear();
      await db.sectors.clear();
      await db.technicians.clear();
      await db.machines.clear();
      await db.machineFamilies.clear();
      await db.machineTemplates.clear();
      await db.machineBlueprints.clear();
      await db.machinePartMappings.clear();
      await db.preventiveTasks.clear();
      await db.standardComponents.clear();
      await db.standardActions.clear();
      await db.taskExecutions.clear();

      console.log('[SandboxSeeder] Sandbox database is now completely empty.');
      
      const sectorsList = [
        "Bakélite", "compresseur", "Detourage", "Diver", "Emboutissage", 
        "Fabrication Mécanique", "Finition Emballage 1", "Finition Emballage 2", 
        "Finition Emballage 3", "Finition Emballage 4", "Polissage", 
        "Repoussage", "Satinage", "Soudeur"
      ].map((name, i) => {
        const num = (i + 1).toString().padStart(2, '0');
        return {
          id: `SEC-${num}`,
          name,
          managerName: '',
          description: `Zone ${name}`,
          status: 'Active' as const
        };
      });
      await db.sectors.bulkAdd(sectorsList);
      
      console.log(`[SandboxSeeder] Added ${sectorsList.length} initial sectors.`);

      // Cleanup old bad families and blueprints if any
      await db.machineFamilies.bulkDelete(['fam-repoussage', 'fam-tournage', 'fam-trp']);
      
      // Create TR (Tours) Family
      const trFamily = {
        id: 'fam-tr',
        name: 'Tours',
        code: 'TR',
        technicalDescription: 'Machines de tournage (repoussage, parallèles, etc).',
        createdAt: new Date().toISOString()
      };
      await db.machineFamilies.add(trFamily);

      const trrTemplate = {
        id: 'tpl-trr',
        familyId: 'fam-tr',
        name: 'Tour à Repoussage',
        type: 'M' as const, // Assuming M for Mechanical/Manual
        skuBase: 'TRR',
        technicalDescription: 'Tour standard pour opérations de repoussage manuel et semi-automatique.',
        createdAt: new Date().toISOString()
      };
      await db.machineTemplates.add(trrTemplate);

      const trrBlueprint = {
        id: 'mchbp-trr-std',
        templateId: 'tpl-trr',
        reference: 'TRR-STANDARD',
        brand: 'Standard Manufacturing',
        model: 'TRR-GENERIC',
        powerOrForce: 'Standard',
        energySource: 'Électrique 380V',
        technicalSpecs: 'Modèle de référence pour les tours de repoussage généraux',
        componentIds: [], // To be populated later
        createdAt: new Date().toISOString()
      };
      await db.machineBlueprints.add(trrBlueprint);

      // Create Individual TRR Machines
      const trrNumbers = ['15', '21', '08', '16', '18', '12', '23', '02', '07', '11', '04', '05'];
      const machinesList = trrNumbers.map((num, i) => ({
        id: `mach-TRR${num}`,
        blueprintId: 'mchbp-trr-std',
        referenceCode: `TRR-${num}`,
        serialNumber: `SN-TRR${num}-SIM`,
        manufacturingYear: 2020 - (i % 5),
        sectorId: 'SEC-12', // Repoussage
        technicianId: null as any, // Not assigned initially based on request
        status: 'Active' as const
      }));
      await db.machines.bulkAdd(machinesList);

      console.log(`[SandboxSeeder] Added ${machinesList.length} TRR machines.`);

      // Create PRI (Press Injection) Family, Template, Blueprint
      const injectionFamily = {
        id: 'fam-injection',
        name: 'Presses à Injection',
        code: 'PRI',
        technicalDescription: 'Injection plastique et moulage bakélite sous haute pression.',
        createdAt: new Date().toISOString()
      };
      await db.machineFamilies.add(injectionFamily);

      const priTemplate = {
        id: 'tpl-pri',
        familyId: 'fam-injection',
        name: 'Presse Injection Bakélite',
        type: 'H' as const, // Hydraulic/Thermal
        skuBase: 'PRI',
        technicalDescription: 'Presse spécialisée pour injection thermodurcissable (Bakélite).',
        createdAt: new Date().toISOString()
      };
      await db.machineTemplates.add(priTemplate);

      const priBlueprint = {
        id: 'mchbp-pri-std',
        templateId: 'tpl-pri',
        reference: 'PRI-STANDARD',
        brand: 'Bakelite Tech',
        model: 'PRI-GENERIC',
        powerOrForce: 'Haute Pression',
        energySource: 'Électrique/Hydraulique',
        technicalSpecs: 'Modèle générique de presse à injection pour le secteur Bakélite',
        componentIds: [],
        createdAt: new Date().toISOString()
      };
      await db.machineBlueprints.add(priBlueprint);

      // Create Individual PRI Machines
      const priNumbers = ['04', '05', '06', '07', '08', '09'];
      const priMachinesList = priNumbers.map((num, i) => ({
        id: `mach-PRI${num}`,
        blueprintId: 'mchbp-pri-std',
        referenceCode: num === '07' ? 'PRI-7' : `PRI-${num}`,
        serialNumber: `SN-PRI${num}-SIM`,
        manufacturingYear: 2018 + i,
        sectorId: 'SEC-01', // Bakélite is SEC-01
        technicianId: null as any,
        status: 'Active' as const
      }));
      await db.machines.bulkAdd(priMachinesList);

      console.log(`[SandboxSeeder] Added ${priMachinesList.length} PRI machines.`);

      // Create SAT (Satinage) Family, Template, Blueprint
      const satinageFamily = {
        id: 'fam-satinage',
        name: 'Machines de Satinage',
        code: 'SAT',
        technicalDescription: 'Machines pour la finition de surface (Satinage).',
        createdAt: new Date().toISOString()
      };
      await db.machineFamilies.add(satinageFamily);

      const satTemplate = {
        id: 'tpl-sat',
        familyId: 'fam-satinage',
        name: 'Machine de Satinage Standard',
        type: 'M' as const, // Mechanical/Surface finish
        skuBase: 'SAT',
        technicalDescription: 'Brossage et finition de surface.',
        createdAt: new Date().toISOString()
      };
      await db.machineTemplates.add(satTemplate);

      const satBlueprint = {
        id: 'mchbp-sat-std',
        templateId: 'tpl-sat',
        reference: 'SAT-STANDARD',
        brand: 'Satin Tech',
        model: 'SAT-GENERIC',
        powerOrForce: 'Standard',
        energySource: 'Électrique 380V',
        technicalSpecs: 'Modèle générique pour équipement de satinage',
        componentIds: [],
        createdAt: new Date().toISOString()
      };
      await db.machineBlueprints.add(satBlueprint);

      // Create Individual SAT Machines
      // SAT-03 SAT-09 SAT-08 SAT-15 SAT-20 SAT-28 SAT-29 SAT-33 SAT-34
      const satNumbers = ['03', '09', '08', '15', '20', '28', '29', '33', '34'];
      const satMachinesList = satNumbers.map((num, i) => ({
        id: `mach-SAT${num}`,
        blueprintId: 'mchbp-sat-std',
        referenceCode: `SAT-${num}`,
        serialNumber: `SN-SAT${num}-SIM`,
        manufacturingYear: 2019 + (i % 4),
        sectorId: 'SEC-13', // Satinage is SEC-13
        technicianId: null as any,
        status: 'Active' as const
      }));
      await db.machines.bulkAdd(satMachinesList);

      console.log(`[SandboxSeeder] Added ${satMachinesList.length} SAT machines.`);

      // Create TRP (Tour Parallèle) Template, Blueprint
      const trpTemplate = {
        id: 'tpl-trp',
        familyId: 'fam-tr',
        name: 'Tour Parallèle Standard',
        type: 'M' as const, // Mechanical
        skuBase: 'TRP',
        technicalDescription: 'Tour parallèle mécanique standard pour fabrication et outillage.',
        createdAt: new Date().toISOString()
      };
      await db.machineTemplates.add(trpTemplate);

      const trpBlueprint = {
        id: 'mchbp-trp-std',
        templateId: 'tpl-trp',
        reference: 'TRP-STANDARD',
        brand: 'Ciob Heavy Machining',
        model: 'TRP-GENERIC-X1',
        powerOrForce: '11 kW',
        energySource: 'Électrique 380V',
        technicalSpecs: 'Modèle de référence pour les tours parallèles généraux de fabrication',
        componentIds: [],
        createdAt: new Date().toISOString()
      };
      await db.machineBlueprints.add(trpBlueprint);

      // Create Individual TRP Machines
      // TRP-01 TRP-04 TRP-08 TRP-10 TRP-11 TRP-12
      const trpNumbers = ['01', '04', '08', '10', '11', '12'];
      const trpMachinesList = trpNumbers.map((num, i) => ({
        id: `mach-TRP${num}`,
        blueprintId: 'mchbp-trp-std',
        referenceCode: `TRP-${num}`,
        serialNumber: `SN-TRP${num}-SIM`,
        manufacturingYear: 2020 + (i % 3),
        sectorId: 'SEC-06', // Fabrication Mécanique is SEC-06
        technicianId: null as any,
        status: 'Active' as const
      }));
      await db.machines.bulkAdd(trpMachinesList);

      console.log(`[SandboxSeeder] Added ${trpMachinesList.length} TRP machines.`);

      // Create RCP (Rectifieuse) Family, Template, Blueprints
      const rcpFamily = {
        id: 'fam-rcp',
        name: 'Rectifieuses',
        code: 'RCP',
        technicalDescription: 'Machines de rectification plane ou cylindrique pour finition de précision.',
        createdAt: new Date().toISOString()
      };
      await db.machineFamilies.add(rcpFamily);

      const rcpTemplate = {
        id: 'tpl-rcp',
        familyId: 'fam-rcp',
        name: 'Rectifieuse de Précision',
        type: 'M' as const, // Mechanical/Precision
        skuBase: 'RCP',
        technicalDescription: 'Rectifieuse industrielle pour rectification de surfaces.',
        createdAt: new Date().toISOString()
      };
      await db.machineTemplates.add(rcpTemplate);

      // Blueprint 1: Standard
      const rcpStdBlueprint = {
        id: 'mchbp-rcp-std',
        templateId: 'tpl-rcp',
        reference: 'RCP-STANDARD',
        brand: 'GrindMaster',
        model: 'GM-RECT-STD',
        powerOrForce: '7.5 kW',
        energySource: 'Électrique 380V',
        technicalSpecs: 'Modèle de référence standard pour rectification plane et cylindrique semi-automatique.',
        componentIds: [],
        createdAt: new Date().toISOString()
      };
      await db.machineBlueprints.add(rcpStdBlueprint);

      // Blueprint 2: Small Manual (RCP-03)
      const rcpSmallManualBlueprint = {
        id: 'mchbp-rcp-small-manual',
        templateId: 'tpl-rcp',
        reference: 'RCP-MINI-MANUAL',
        brand: 'MicroGrind Co.',
        model: 'MG-MAN-01',
        powerOrForce: '2.2 kW',
        energySource: 'Électrique 220V',
        technicalSpecs: 'Modèle réduit conçu exclusivement pour les pièces de petite taille. Fonctionnement 100% manuel, haute précision sans assistance automatique.',
        componentIds: [],
        createdAt: new Date().toISOString()
      };
      await db.machineBlueprints.add(rcpSmallManualBlueprint);

      // Create Individual RCP Machines
      // RCP-02 and RCP-04: standard blueprint
      // RCP-03: small manual blueprint
      const rcpMachinesList = [
        {
          id: 'mach-RCP02',
          blueprintId: 'mchbp-rcp-std',
          referenceCode: 'RCP-02',
          serialNumber: 'SN-RCP02-SIM',
          manufacturingYear: 2021,
          sectorId: 'SEC-06', // Fabrication Mécanique is SEC-06
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-RCP04',
          blueprintId: 'mchbp-rcp-std',
          referenceCode: 'RCP-04',
          serialNumber: 'SN-RCP04-SIM',
          manufacturingYear: 2022,
          sectorId: 'SEC-06', // Fabrication Mécanique is SEC-06
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-RCP03',
          blueprintId: 'mchbp-rcp-small-manual',
          referenceCode: 'RCP-03',
          serialNumber: 'SN-RCP03-SIM',
          manufacturingYear: 2023,
          sectorId: 'SEC-06', // Fabrication Mécanique is SEC-06
          technicianId: null as any,
          status: 'Active' as const
        }
      ];
      await db.machines.bulkAdd(rcpMachinesList);

      console.log(`[SandboxSeeder] Added ${rcpMachinesList.length} RCP machines.`);

      // Create PER (Perceuse) Family, Template, Blueprint
      const perFamily = {
        id: 'fam-per',
        name: 'Perceuses',
        code: 'PER',
        technicalDescription: 'Machines de perçage et taraudage de précision.',
        createdAt: new Date().toISOString()
      };
      await db.machineFamilies.add(perFamily);

      const perTemplate = {
        id: 'tpl-per',
        familyId: 'fam-per',
        name: 'Perceuse Industrielle de Fabrication',
        type: 'M' as const, // Mechanical / Advanced Drill
        skuBase: 'PER',
        technicalDescription: 'Perceuse à colonne industrielle avancée conçue pour les opérations lourdes de fabrication mécanique.',
        createdAt: new Date().toISOString()
      };
      await db.machineTemplates.add(perTemplate);


      // Create Advanced PER Blueprint (PER-06 is advanced/custom, not simple standard)
      const perAdvancedBlueprint = {
        id: 'mchbp-per-advanced',
        templateId: 'tpl-per',
        reference: 'PER-ADVANCED',
        brand: 'AluDrill Heavy Tech',
        model: 'AD-PRO-600',
        powerOrForce: '5.5 kW / High Torque',
        energySource: 'Électrique 380V',
        technicalSpecs: 'Perceuse industrielle de haute précision dotée de vitesses variables électroniques, d’un affichage numérique de profondeur, et d’un système d’arrosage intégré pour usinage intensif (Fabrication Mécanique).',
        componentIds: [],
        createdAt: new Date().toISOString()
      };
      await db.machineBlueprints.add(perAdvancedBlueprint);

      // Create Standard PER Blueprint
      const perStandardBlueprint = {
        id: 'mchbp-per-std',
        templateId: 'tpl-per',
        reference: 'PER-STANDARD-MANUAL',
        brand: 'DrillMaster',
        model: 'DM-MAN-3V',
        powerOrForce: '0.75 kW / Bi-vitesse',
        energySource: 'Électrique 380V, Système de poulies mécaniques',
        technicalSpecs: 'Perceuse d\'établi manuelle avec table ajustable (XY/Z). Moteur bi-vitesse, transmission par courroies trapézoïdales à 3 niveaux de poulies avec galet tendeur. Commutateurs de commande (0/1/2) pour vitesses, commutateur éclairage, boîtier de démarrage avec protection thermique par relais.',
        componentIds: [],
        createdAt: new Date().toISOString()
      };
      await db.machineBlueprints.add(perStandardBlueprint);

      // Create Individual PER Machine PER-06, PER-02, PER-05
      const perMachinesList = [
        {
          id: 'mach-PER06',
          blueprintId: 'mchbp-per-advanced',
          referenceCode: 'PER-06',
          serialNumber: 'SN-PER06-SIM',
          manufacturingYear: 2024,
          sectorId: 'SEC-06', // Fabrication Mécanique is SEC-06
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-PER02',
          blueprintId: 'mchbp-per-std',
          referenceCode: 'PER-02',
          serialNumber: 'SN-PER02-SIM',
          manufacturingYear: 2026,
          sectorId: 'SEC-08', // Finition Emballage 2 (FEMB-02)
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-PER05',
          blueprintId: 'mchbp-per-std',
          referenceCode: 'PER-05',
          serialNumber: 'SN-PER05-SIM',
          manufacturingYear: 2026,
          sectorId: 'SEC-14', // Soudeur
          technicianId: null as any,
          status: 'Active' as const
        }
      ];
      await db.machines.bulkAdd(perMachinesList);

      console.log(`[SandboxSeeder] Added ${perMachinesList.length} PER machines.`);

      // Create PRR (Perceuse Radiale) Template, Blueprint
      const prrTemplate = {
        id: 'tpl-prr',
        familyId: 'fam-per',
        name: 'Perceuse Radiale',
        type: 'M' as const, // Mechanical
        skuBase: 'PRR',
        technicalDescription: 'Perceuse radiale avec bras mobile pour l\'usinage de pièces industrielles lourdes et encombrantes.',
        createdAt: new Date().toISOString()
      };
      await db.machineTemplates.add(prrTemplate);

      // Components for PRR (Perceuse Radiale)
      const prrComponents = [
        {
          id: 'comp-prr-bras',
          name: 'Le bras (Bras mobile horizontal)',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-prr-tete',
          name: 'La tête de perçage (Tête mobile)',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-prr-colonne',
          name: 'La colonne (Pilier de support principal)',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-prr-boite',
          name: 'Boîte de vitesses (Contrôle d\'avance)',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-prr-lubrif',
          name: 'Système de lubrification',
          family: 'HYD' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        }
      ];
//       await db.standardComponents.bulkAdd(prrComponents);

      const prrBlueprint = {
        id: 'mchbp-prr-radiale',
        templateId: 'tpl-prr',
        reference: 'PRR-RADIALE',
        brand: 'HeavyDrill',
        model: 'HDR-RAD-2000',
        powerOrForce: '11 kW',
        energySource: 'Électrique 380V',
        technicalSpecs: 'Idéale pour les grandes pièces avec un bras de grande portée, boîte de vitesses intégrée et système de lubrification.',
        componentIds: prrComponents.map(c => c.id),
        createdAt: new Date().toISOString()
      };
      await db.machineBlueprints.add(prrBlueprint);

      // Create Individual PRR Machine PRR-01
      const prrMachinesList = [
        {
          id: 'mach-PRR01',
          blueprintId: 'mchbp-prr-radiale',
          referenceCode: 'PRR-01',
          serialNumber: 'SN-PRR01-SIM',
          manufacturingYear: 2021,
          sectorId: 'SEC-06', // Fabrication Mécanique
          technicianId: null as any,
          status: 'Active' as const
        }
      ];
      await db.machines.bulkAdd(prrMachinesList);

      console.log(`[SandboxSeeder] Added ${prrMachinesList.length} PRR machines.`);

      // Create MRT (Mortiseuses) Family, Template, Blueprint
      const mrtFamily = {
        id: 'fam-mrt',
        name: 'Mortiseuses',
        code: 'MRT',
        technicalDescription: 'Machines à mortaiser pour l’usinage de rainures et de mortaises.',
        createdAt: new Date().toISOString()
      };
      await db.machineFamilies.add(mrtFamily);

      const mrtTemplate = {
        id: 'tpl-mrt',
        familyId: 'fam-mrt',
        name: 'Mortiseuse Industrielle',
        type: 'M' as const, // Mechanical
        skuBase: 'MRT',
        technicalDescription: 'Machine de mortaisage standard pour fabrication de rainures de clavettes.',
        createdAt: new Date().toISOString()
      };
      await db.machineTemplates.add(mrtTemplate);

      const mrtBlueprint = {
        id: 'mchbp-mrt-std',
        templateId: 'tpl-mrt',
        reference: 'MRT-STANDARD',
        brand: 'SlotMaster',
        model: 'MRT-GENERIC-X',
        powerOrForce: '4.0 kW',
        energySource: 'Électrique 380V',
        technicalSpecs: 'Modèle de référence standard pour mortaisage mécanique de précision',
        componentIds: [],
        createdAt: new Date().toISOString()
      };
      await db.machineBlueprints.add(mrtBlueprint);

      // Create Individual MRT Machine MRT-01
      const mrtMachinesList = [
        {
          id: 'mach-MRT01',
          blueprintId: 'mchbp-mrt-std',
          referenceCode: 'MRT-01',
          serialNumber: 'SN-MRT01-SIM',
          manufacturingYear: 2023,
          sectorId: 'SEC-06', // Fabrication Mécanique is SEC-06
          technicianId: null as any,
          status: 'Active' as const
        }
      ];
      await db.machines.bulkAdd(mrtMachinesList);

      console.log(`[SandboxSeeder] Added ${mrtMachinesList.length} MRT machines.`);

      // Create FRM (Fraiseuses) Family, Template, Blueprint
      const frmFamily = {
        id: 'fam-frm',
        name: 'Fraiseuses',
        code: 'FRM',
        technicalDescription: 'Machines de fraisage mécanique pour enlèvement de matière.',
        createdAt: new Date().toISOString()
      };
      await db.machineFamilies.add(frmFamily);

      const frmTemplate = {
        id: 'tpl-frm',
        familyId: 'fam-frm',
        name: 'Fraiseuse Mécanique Standard',
        type: 'M' as const, // Mechanical
        skuBase: 'FRM',
        technicalDescription: 'Fraiseuse mécanique conventionnelle pour travaux d’usinage.',
        createdAt: new Date().toISOString()
      };
      await db.machineTemplates.add(frmTemplate);

      const frmBlueprint = {
        id: 'mchbp-frm-std',
        templateId: 'tpl-frm',
        reference: 'FRM-STANDARD',
        brand: 'MillCut',
        model: 'FRM-GENERIC-1',
        powerOrForce: '5.5 kW',
        energySource: 'Électrique 380V',
        technicalSpecs: 'Modèle de référence standard pour fraisage mécanique conventionnel (Fabrication Mécanique)',
        componentIds: [],
        createdAt: new Date().toISOString()
      };
      await db.machineBlueprints.add(frmBlueprint);

      // Create Individual FRM Machine FRM-01
      const frmMachinesList = [
        {
          id: 'mach-FRM01',
          blueprintId: 'mchbp-frm-std',
          referenceCode: 'FRM-01',
          serialNumber: 'SN-FRM01-SIM',
          manufacturingYear: 2022,
          sectorId: 'SEC-06', // Fabrication Mécanique is SEC-06
          technicianId: null as any,
          status: 'Active' as const
        }
      ];
      await db.machines.bulkAdd(frmMachinesList);

      console.log(`[SandboxSeeder] Added ${frmMachinesList.length} FRM machines.`);

      // Create MEL (Meuleuses) Family, Template, Blueprint
      const melFamily = {
        id: 'fam-mel',
        name: 'Meuleuses',
        code: 'MEL',
        technicalDescription: 'Machines équipées d\'un moteur électrique rapide et d\'une meule pour l\'enlèvement de matière par friction.',
        createdAt: new Date().toISOString()
      };
      await db.machineFamilies.add(melFamily);

      const melTemplate = {
        id: 'tpl-mel',
        familyId: 'fam-mel',
        name: 'Meuleuse Industrielle',
        type: 'E' as const, // Electrical
        skuBase: 'MEL',
        technicalDescription: 'Touret à meuler fixe pour opérations de finition, d\'ébarbage et d\'affûtage.',
        createdAt: new Date().toISOString()
      };
      await db.machineTemplates.add(melTemplate);

      const melBlueprint = {
        id: 'mchbp-mel-std',
        templateId: 'tpl-mel',
        reference: 'MEL-STANDARD',
        brand: 'GrindTec',
        model: 'GT-MEUL-X',
        powerOrForce: '1.5 kW',
        energySource: 'Électrique 380V',
        technicalSpecs: 'Touret à meuler fixe avec double meule, utilisé pour l\'affûtage d\'outils de coupe et l\'ébavurage. Polyvalence de montage : compatible avec les disques de meulage standards ainsi que les disques de type brosses métalliques pour finition.',
        componentIds: [],
        createdAt: new Date().toISOString()
      };
      await db.machineBlueprints.add(melBlueprint);

      // Create MEL-STANDARD-V2 Blueprint
      const melStandardV2Blueprint = {
        id: 'mchbp-mel-std-v2',
        templateId: 'tpl-mel',
        reference: 'MEL-STANDARD-V2',
        brand: 'GrindTec',
        model: 'GT-MEUL-X-V2',
        powerOrForce: '2.2 kW / High Torque',
        energySource: 'Électrique 380V',
        technicalSpecs: 'Version v2 : Moteur 2.2kW plus puissant, arbe allongé pour accessoires de finition (disques abrasifs, brosses métalliques). Transmission renforcée, vitesse et couple élevés. Commutation directe, boîtier de démarrage intégré avec protection thermique par relais. Alimentation 380V.',
        componentIds: [],
        createdAt: new Date().toISOString()
      };
      await db.machineBlueprints.add(melStandardV2Blueprint);

      // Create Individual MEL Machine MEL-01
      const melMachinesList = [
        {
          id: 'mach-MEL01',
          blueprintId: 'mchbp-mel-std',
          referenceCode: 'MEL-01',
          serialNumber: 'SN-MEL01-SIM',
          manufacturingYear: 2023,
          sectorId: 'SEC-06', // Fabrication Mécanique
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-MEL07',
          blueprintId: 'mchbp-mel-std',
          referenceCode: 'MEL-07',
          serialNumber: 'SN-MEL07-SIM',
          manufacturingYear: 2026,
          sectorId: 'SEC-07', // Finition Emballage 1
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-MEL02',
          blueprintId: 'mchbp-mel-std',
          referenceCode: 'MEL-02',
          serialNumber: 'SN-MEL02-SIM',
          manufacturingYear: 2026,
          sectorId: 'SEC-12', // Repoussage
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-MEL16',
          blueprintId: 'mchbp-mel-std-v2',
          referenceCode: 'MEL-16',
          serialNumber: 'SN-MEL16-SIM',
          manufacturingYear: 2026,
          sectorId: 'SEC-11', // Polissage
          technicianId: null as any,
          status: 'Active' as const
        }
      ];
      await db.machines.bulkAdd(melMachinesList);

      console.log(`[SandboxSeeder] Added ${melMachinesList.length} MEL machines.`);

      // Create SCM (Scie Alternative) Family, Template, Blueprint, Components
      const scieFamily = {
        id: 'fam-scie',
        name: 'Sciage',
        code: 'SCI',
        technicalDescription: 'Machines de coupe de métaux (débitage) pour préparer les bruts avant usinage.',
        createdAt: new Date().toISOString()
      };
      await db.machineFamilies.add(scieFamily);

      const scmTemplate = {
        id: 'tpl-scm',
        familyId: 'fam-scie',
        name: 'Scie Alternative Mécanique',
        type: 'M' as const,
        skuBase: 'SCM',
        technicalDescription: 'Machine transformant un mouvement rotatif en mouvement rectiligne alternatif (système bielle-manivelle) pour le tronçonnage des barres.',
        createdAt: new Date().toISOString()
      };
      await db.machineTemplates.add(scmTemplate);

      // Components for SCM
      const scmComponents = [
        {
          id: 'comp-scm-bielle',
          name: 'Système bielle-manivelle',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-scm-hydraulique',
          name: 'Système Hydraulique (Contrôle de descente/avance)',
          family: 'HYD' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-scm-etau',
          name: 'Étau hydraulique (Fixation de la barre)',
          family: 'HYD' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-scm-moteur',
          name: 'Moteur électrique',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        }
      ];
//       await db.standardComponents.bulkAdd(scmComponents);

      const scmBlueprint = {
        id: 'mchbp-scm-std',
        templateId: 'tpl-scm',
        reference: 'SCM-ALTERNATIVE',
        brand: 'SawMaster',
        model: 'SM-250-ALT',
        powerOrForce: '2.2 kW',
        energySource: 'Électrique 380V / Hydraulique',
        technicalSpecs: 'Idéale pour le débitage. Équipée d\'un système hydraulique pour lever la lame au retour et d\'un étau de serrage puissant.',
        componentIds: scmComponents.map(c => c.id),
        createdAt: new Date().toISOString()
      };
      await db.machineBlueprints.add(scmBlueprint);

      // Create Individual SCM Machine SCM-01
      const scmMachinesList = [
        {
          id: 'mach-SCM01',
          blueprintId: 'mchbp-scm-std',
          referenceCode: 'SCM-01',
          serialNumber: 'SN-SCM01-SIM',
          manufacturingYear: 2021,
          sectorId: 'SEC-06', // Fabrication Mécanique
          technicianId: null as any,
          status: 'Active' as const
        }
      ];
      await db.machines.bulkAdd(scmMachinesList);

      console.log(`[SandboxSeeder] Added ${scmMachinesList.length} SCM machines.`);

      // Create PO (Polissage) Family, Template, Blueprint, Components, and 4 Machines
      const polissageFamily = {
        id: 'fam-po',
        name: 'Polissage Machine',
        code: 'PO',
        technicalDescription: 'Surface smoothing and brightening using rotary buffs and polishing compounds.',
        createdAt: new Date().toISOString()
      };
      await db.machineFamilies.add(polissageFamily);

      const poaTemplate = {
        id: 'tpl-poa',
        familyId: 'fam-po',
        name: 'Polissage Automatique',
        type: 'A' as const, // Automatic
        skuBase: 'POA',
        technicalDescription: 'Machine de polissage automatique avec variateur de vitesse et système d\'entraînement du moule.',
        createdAt: new Date().toISOString()
      };
      await db.machineTemplates.add(poaTemplate);

      // Components for POA
      const poaComponents = [
        // Sub-ensemble Mandrin/Moule
        {
          id: 'comp-poa-moteur-moule',
          name: 'Moteur de rotation moule (Sous-ensemble Mandrin/Moule)',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-reducteur',
          name: 'Réducteur de vitesse (Sous-ensemble Mandrin/Moule)',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-axe-vertical',
          name: 'Axe vertical de rotation (Sous-ensemble Mandrin/Moule)',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        // Sub-ensemble Bras de brossage
        {
          id: 'comp-poa-moteur-brosse',
          name: 'Moteur principal de brosse (Sous-ensemble Bras de brossage)',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-transmission',
          name: 'Système de transmission: Courroies & Poulies (Sous-ensemble Bras de brossage)',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-axe-brosse',
          name: 'Axe de la brosse (Sous-ensemble Bras de brossage)',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-verin-approche',
          name: 'Vérin pneumatique d\'approche (Sous-ensemble Bras de brossage)',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        // Sub-ensemble Tête/Presse (Taqia)
        {
          id: 'comp-poa-verin-serrage',
          name: 'Vérin pneumatique de serrage / Taqia (Sous-ensemble Presse/Taqia)',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-tampon-pressage',
          name: 'Tampon de pressage (Sous-ensemble Presse/Taqia)',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },
        // Système d'Automatisme & Commande
        {
          id: 'comp-poa-contacteur-brosse',
          name: 'Contacteur de démarrage direct brosse (Système d\'Automatisme & Commande)',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-temporisateurs',
          name: 'Temporisateurs de cycle (Système d\'Automatisme & Commande)',
          family: 'ELN' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-distributeurs',
          name: 'Distributeurs pneumatiques (Système d\'Automatisme & Commande)',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-capteurs',
          name: 'Capteurs de fin de course (Système d\'Automatisme & Commande)',
          family: 'ELN' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        }
      ];
//       await db.standardComponents.bulkAdd(poaComponents);

      const poaBlueprint = {
        id: 'mchbp-poa-std',
        templateId: 'tpl-poa',
        reference: 'POL-POA-AUTOMATIC-V1',
        brand: 'PoliMax',
        model: 'PM-POA-AUTOMATIC-V1',
        powerOrForce: 'Main: 5.5 kW / Aux: 0.75 kW',
        energySource: 'Électrique 380V / Pneumatique',
        technicalSpecs: `Machine de Polissage - Version 1 (Rotative Pneumatique) à logique séquentielle.
Cinématique de fonctionnement:
1. État initial: Brosse principale en rotation continue (Démarrage direct).
2. Start Cycle: Descente du vérin de serrage (Taqia) pour bloquer la pièce métallique.
3. Rotation moule: Activation du moto-réducteur de rotation de la pièce.
4. Processus de صقل / Tlemie: Avance du vérin pneumatique d'approche de la brosse polisseuse et temporisation du cycle.
5. Fin de cycle: Recul du bras de brossage, arrêt de rotation du moule, remontée du vérin de serrage Taqia pour libérer la pièce.`,
        componentIds: poaComponents.map(c => c.id),
        createdAt: new Date().toISOString()
      };
      await db.machineBlueprints.add(poaBlueprint);

      // Create Individual POA Machines (4 machines) in SEC-11 (Polissage)
      const poaMachinesList = [
        {
          id: 'mach-POA08',
          blueprintId: 'mchbp-poa-std',
          referenceCode: 'POA-08',
          serialNumber: 'SN-POA08-SIM',
          manufacturingYear: 2022,
          sectorId: 'SEC-11', // Polissage
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-POA09',
          blueprintId: 'mchbp-poa-std',
          referenceCode: 'POA-09',
          serialNumber: 'SN-POA09-SIM',
          manufacturingYear: 2022,
          sectorId: 'SEC-11', // Polissage
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-POA07',
          blueprintId: 'mchbp-poa-std',
          referenceCode: 'POA-07',
          serialNumber: 'SN-POA07-SIM',
          manufacturingYear: 2022,
          sectorId: 'SEC-11', // Polissage
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-POA22',
          blueprintId: 'mchbp-poa-std',
          referenceCode: 'POA-22',
          serialNumber: 'SN-POA22-SIM',
          manufacturingYear: 2023,
          sectorId: 'SEC-11', // Polissage
          technicianId: null as any,
          status: 'Active' as const
        }
      ];
      await db.machines.bulkAdd(poaMachinesList);

      console.log(`[SandboxSeeder] Added ${poaMachinesList.length} POA machines.`);

      // Create POA V2 (Polissage Horizontale à Pivot) Blueprint, Components, and registered machines
      const poaV2Components = [
        // Sub-ensemble Mandrin/Moule Horizontal en porte-à-faux
        {
          id: 'comp-poa-v2-mandrin-horizontal',
          name: 'Mandrin horizontal en porte-à-faux (Axe horizontal soumis à flexion)',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v2-roulements-coniques',
          name: 'Roulements à rouleaux coniques (Support de charges combinées lourdes)',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v2-moto-reducteur',
          name: 'Moto-réducteur de rotation moule à couple élevé (Pour rotation moule horizontal)',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        // Sub-ensemble Bras de brossage parallèle
        {
          id: 'comp-poa-v2-verin-descente',
          name: 'Vérin pneumatique de descente verticale (Mouvement vertical de la brosse)',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v2-joints-etancheite',
          name: 'Joints d\'étanchéité anti-poussière d\'aluminium (Protection du vérin de descente)',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v2-axe-brosse-parallele',
          name: 'Axe de la brosse parallèle (Sous-ensemble Bras de brossage V2)',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        // Sub-ensemble Tête/Presse (Taqia) à bascule/Pivot
        {
          id: 'comp-poa-v2-taqia-bascule',
          name: 'Système de basculement Taqia (Taqia à bascule à pivot)',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v2-axe-pivot',
          name: 'Axe d\'articulation de pivot (Pivot oscillant)',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v2-coussinets-rotules',
          name: 'Coussinets et rotules de pivot (Serrage d\'articulation)',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v2-verin-basculement',
          name: 'Vérin pneumatique de basculement Taqia (Serrage horizontal)',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        // Système d'Automatisme & Commande
        {
          id: 'comp-poa-v2-moteur-brosse',
          name: 'Moteur principal de brosse V2 (Entraînement direct)',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v2-contacteur-demarrage',
          name: 'Contacteur de démarrage direct brosse V2 (Armoire électrique)',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v2-temporisateurs',
          name: 'Temporisateurs de cycle V2 (Descente, brossage, basculement)',
          family: 'ELN' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v2-distributeurs',
          name: 'Distributeurs pneumatiques pour mouvements verticaux et bascule',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v2-capteurs',
          name: 'Capteurs de fin de course V2 (Position haute/basse et bascule)',
          family: 'ELN' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        }
      ];
//       await db.standardComponents.bulkAdd(poaV2Components);

      const poaV2Blueprint = {
        id: 'mchbp-poa-v2',
        templateId: 'tpl-poa',
        reference: 'POL-POA-AUTOMATIC-V2',
        brand: 'PoliMax',
        model: 'PM-POA-AUTOMATIC-V2',
        powerOrForce: 'Main: 7.5 kW / Aux: 1.5 kW',
        energySource: 'Électrique 380V / Pneumatique',
        technicalSpecs: `Machine de Polissage - Version 2 (Horizontale à Pivot) à logique séquentielle pour grandes pièces.
Bénéficie d'un axe horizontal en porte-à-faux pour supporter des pièces massives.
Cinématique de fonctionnement:
1. État initial: Brosse principale en rotation continue (Démarrage direct).
2. Start Cycle: Rotation du bras pivotant Taqia de 90° et serrage horizontal de la pièce.
3. Rotation moule: Activation du moto-réducteur horizontal à couple élevé.
4. Processus de صقل / Tlemie: Descente verticale du vérin de brossage et temporisation du cycle.
5. Fin de cycle: Remontée verticale de la brosse, arrêt du moule, pivotement inverse et desserrage de la Taqia pour libérer la pièce.`,
        componentIds: poaV2Components.map(c => c.id),
        createdAt: new Date().toISOString()
      };
      await db.machineBlueprints.add(poaV2Blueprint);

      // Create Registered Machines POA-02, POA-05, POA-06, POA-18 for V2
      const poaV2MachinesList = [
        {
          id: 'mach-POA02',
          blueprintId: 'mchbp-poa-v2',
          referenceCode: 'POA-02',
          serialNumber: 'SN-POA02-SIM',
          manufacturingYear: 2021,
          sectorId: 'SEC-11', // Polissage
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-POA05',
          blueprintId: 'mchbp-poa-v2',
          referenceCode: 'POA-05',
          serialNumber: 'SN-POA05-SIM',
          manufacturingYear: 2022,
          sectorId: 'SEC-11', // Polissage
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-POA06',
          blueprintId: 'mchbp-poa-v2',
          referenceCode: 'POA-06',
          serialNumber: 'SN-POA06-SIM',
          manufacturingYear: 2022,
          sectorId: 'SEC-11', // Polissage
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-POA18',
          blueprintId: 'mchbp-poa-v2',
          referenceCode: 'POA-18',
          serialNumber: 'SN-POA18-SIM',
          manufacturingYear: 2024,
          sectorId: 'SEC-11', // Polissage
          technicianId: null as any,
          status: 'Active' as const
        }
      ];
      await db.machines.bulkAdd(poaV2MachinesList);

      console.log(`[SandboxSeeder] Added ${poaV2MachinesList.length} POA V2 machines.`);

      // Create POA V3 (Double Brosse à Vide - Configuration Bilatérale en T) Blueprint, Components, and registered machines
      const poaV3Components = [
        // Système Pneumatique à Vide (Fixation par vide indépendante)
        {
          id: 'comp-poa-v3-pompe-vide',
          name: 'Pompe à vide centrale (Génération de dépression pour les deux côtés)',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v3-raccord-tournant-gauche',
          name: 'Raccord tournant / Joint tournant - Côté Gauche (Axe d\'aspiration rotatif)',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v3-raccord-tournant-droit',
          name: 'Raccord tournant / Joint tournant - Côté Droit (Axe d\'aspiration rotatif)',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v3-joints-moule-gauche',
          name: 'Joints ventouses de moule - Côté Gauche (Étanchéité d\'aspiration sur moule)',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v3-joints-moule-droit',
          name: 'Joints ventouses de moule - Côté Droit (Étanchéité d\'aspiration sur moule)',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        // Station Double Brosse & Moteurs principaux indépendants
        {
          id: 'comp-poa-v3-moteur-brosse-gauche',
          name: 'Moteur principal de brosse gauche (Satinage indépendant côté gauche)',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v3-moteur-brosse-droit',
          name: 'Moteur principal de brosse droite (Satinage indépendant côté droit)',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v3-moteur-moule-gauche',
          name: 'Moteur de rotation moule gauche (Moto-réducteur indépendant gauche)',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v3-moteur-moule-droit',
          name: 'Moteur de rotation moule droit (Moto-réducteur indépendant droit)',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v3-brosses-gauche',
          name: 'Brosse de satinage grand format - Côté Gauche',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v3-brosses-droite',
          name: 'Brosse de satinage grand format - Côté Droit',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },
        // Tables élévatrices / Chariots verticaux indépendants
        {
          id: 'comp-poa-v3-verin-levage-gauche',
          name: 'Vérin pneumatique de levage vertical - Côté Gauche',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v3-verin-levage-droit',
          name: 'Vérin pneumatique de levage vertical - Côté Droit',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v3-guides-lineaires-gauche',
          name: 'Guides linéaires & Douilles à billes de table - Côté Gauche',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v3-guides-lineaires-droit',
          name: 'Guides linéaires & Douilles à billes de table - Côté Droit',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        // Système d'Automatisme, Vannes & Commande séparés
        {
          id: 'comp-poa-v3-electrovanne-vide-gauche',
          name: 'Électrovanne de contrôle du vide - Côté Gauche',
          family: 'ELN' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v3-electrovanne-vide-droit',
          name: 'Électrovanne de contrôle du vide - Côté Droit',
          family: 'ELN' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v3-filtres-vide',
          name: 'Filtres de ligne d\'aspiration (Protection poussière alu pour les deux côtés)',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v3-temporisateurs-gauche',
          name: 'Temporisateurs de cycle indépendants - Côté Gauche',
          family: 'ELN' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v3-temporisateurs-droit',
          name: 'Temporisateurs de cycle indépendants - Côté Droit',
          family: 'ELN' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v3-capteurs-hauteur-gauche',
          name: 'Capteurs de fin de course de table - Côté Gauche',
          family: 'ELN' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v3-capteurs-hauteur-droit',
          name: 'Capteurs de fin de course de table - Côté Droit',
          family: 'ELN' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        }
      ];
//       await db.standardComponents.bulkAdd(poaV3Components);

      const poaV3Blueprint = {
        id: 'mchbp-poa-v3',
        templateId: 'tpl-poa',
        reference: 'POL-POA-AUTOMATIC-V3',
        brand: 'PoliMax',
        model: 'PM-POA-AUTOMATIC-V3',
        powerOrForce: 'Brosses: 2x 7.5 kW / Aux: 2x 2.2 kW',
        energySource: 'Électrique 380V / Pneumatique / Vide',
        technicalSpecs: `Machine de Polissage - Version 3 (Double Brosse à Vide - Structure en T Bilatérale) pour production de couvercles à haute cadence.
Cette machine réunit deux postes de travail complètement indépendants sur le même châssis en T.
Chaque côté est conçu pour un opérateur et dispose de son propre ensemble brosse-moteur, de sa propre table élévatrice, et de son système d'aspiration par vide individuel.
Cinématique de fonctionnement (Indépendante pour chaque côté):
1. État initial: Les deux brosses de satinage tournent en continu.
2. Pose pièce: L'opérateur pose le couvercle sur son moule récepteur (Génère le vide pour sceller).
3. Start Cycle: L'électrovanne du côté concerné s'ouvre, la pompe crée une dépression à travers le joint tournant pour fixer fermement le couvercle.
4. Rotation & Levage: Le moto-réducteur de rotation du moule s'active, puis le vérin de levage monte la table. La pièce s'engage contre la brosse de satinage correspondante.
5. Cycle de polissage: Temporisation du satinage actif.
6. Fin de cycle: Descente de la table élévatrice, arrêt du moteur de moule, et cassage automatique du vide (soufflage) pour libérer le couvercle poli.`,
        componentIds: poaV3Components.map(c => c.id),
        createdAt: new Date().toISOString()
      };
      await db.machineBlueprints.add(poaV3Blueprint);

      // Create Registered Machines POA-20 & POA-21 for V3 (Twin stations sharing the same physical frames)
      const poaV3MachinesList = [
        {
          id: 'mach-POA20',
          blueprintId: 'mchbp-poa-v3',
          referenceCode: 'POA-20',
          serialNumber: 'SN-POA20-TWIN-A',
          manufacturingYear: 2025,
          sectorId: 'SEC-11', // Polissage
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-POA21',
          blueprintId: 'mchbp-poa-v3',
          referenceCode: 'POA-21',
          serialNumber: 'SN-POA21-TWIN-B',
          manufacturingYear: 2025,
          sectorId: 'SEC-11', // Polissage
          technicianId: null as any,
          status: 'Active' as const
        }
      ];
      await db.machines.bulkAdd(poaV3MachinesList);

      console.log(`[SandboxSeeder] Added ${poaV3MachinesList.length} POA V3 machines.`);

      // Create POA V4 (Double Station à Pivot 90° & Injection de Pâte) Blueprint, Components, and registered machines
      const poaV4Components = [
        // Stations Gauche & Droite - Bras Pivotants & Fixation Vide
        {
          id: 'comp-poa-v4-bras-pivot-gauche',
          name: 'Bras pivotant à 90° - Côté Gauche (Avance vers brosse)',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v4-bras-pivot-droit',
          name: 'Bras pivotant à 90° - Côté Droit (Avance vers brosse)',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v4-verin-rotatif-gauche',
          name: 'Vérin rotatif/pneumatique de pivotement de bras - Côté Gauche',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v4-verin-rotatif-droit',
          name: 'Vérin rotatif/pneumatique de pivotement de bras - Côté Droit',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v4-moule-vide-gauche',
          name: 'Moule récepteur à vide - Côté Gauche',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v4-moule-vide-droit',
          name: 'Moule récepteur à vide - Côté Droit',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v4-raccord-tournant-gauche',
          name: 'Raccord tournant de vide étanche - Côté Gauche',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v4-raccord-tournant-droit',
          name: 'Raccord tournant de vide étanche - Côté Droit',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v4-moteur-moule-gauche',
          name: 'Moteur & Réducteur de rotation de moule - Côté Gauche',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v4-moteur-moule-droit',
          name: 'Moteur & Réducteur de rotation de moule - Côté Droit',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        // Station de Brossage (Moteurs & brosses principaux)
        {
          id: 'comp-poa-v4-moteur-brosse-gauche',
          name: 'Moteur principal de brosse gauche (Satinage haute puissance)',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v4-moteur-brosse-droit',
          name: 'Moteur principal de brosse droite (Satinage haute puissance)',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v4-brosses-gauche',
          name: 'Kit de brosse large de satinage - Côté Gauche',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v4-brosses-droite',
          name: 'Kit de brosse large de satinage - Côté Droit',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },
        // Système d'injection automatique de pâte à polir
        {
          id: 'comp-poa-v4-pistolet-injecteur-gauche',
          name: 'Pistolet applicateur pneumatique de pâte (Buses d\'injection) - Côté Gauche',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v4-pistolet-injecteur-droit',
          name: 'Pistolet applicateur pneumatique de pâte (Buses d\'injection) - Côté Droit',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v4-bras-oscillant-gauche',
          name: 'Bras oscillant de pistolet de pâte - Côté Gauche',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v4-bras-oscillant-droit',
          name: 'Bras oscillant de pistolet de pâte - Côté Droit',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v4-verin-oscillation-gauche',
          name: 'Vérin pneumatique d\'oscillation du pistolet - Côté Gauche',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v4-verin-oscillation-droit',
          name: 'Vérin pneumatique d\'oscillation du pistolet - Côté Droit',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v4-reservoir-pate',
          name: 'Réservoir de pâte à polir sous pression centrale',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        // Pneumatique, Contrôle, Sécurité & Vide
        {
          id: 'comp-poa-v4-vannes-vide',
          name: 'Électrovannes de commande de vide indépendantes',
          family: 'ELN' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v4-clapets-anti-retour',
          name: 'Clapets anti-retour de sécurité de vide (Garantit l\'indépendance de pression)',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-poa-v4-temporisateurs',
          name: 'Temporisateurs de cycles de satinage et de pulvérisation automatique',
          family: 'ELN' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        }
      ];
//       await db.standardComponents.bulkAdd(poaV4Components);

      const poaV4Blueprint = {
        id: 'mchbp-poa-v4',
        templateId: 'tpl-poa',
        reference: 'POL-POA-AUTOMATIC-V4',
        brand: 'PoliMax',
        model: 'PM-POA-AUTOMATIC-V4',
        powerOrForce: 'Brosses: 2x 11 kW / Aux: 2x 3.0 kW',
        energySource: 'Électrique 380V / Pneumatique / Vide',
        technicalSpecs: `Machine de Polissage - Version 4 (Double Station à Pivot 90° & Injection Automatique de Pâte).
Conçue pour une production de masse bilatérale sur un châssis en T. Permet à deux opérateurs de travailler simultanément et de façon entièrement isolée.
Équipée d'un bras pivotant horizontal à 90° commandé par un vérin rotatif et d'un système d'injection pneumatique oscillant automatique de pâte abrasive.
Sécurité renforcée par des clapets anti-retour de vide indépendants empêchant toute chute de pièce en cas de fuite du côté opposé.
Cinématique de fonctionnement:
1. Pose de pièce: L'opérateur charge la pièce sur le moule récepteur.
2. Aspiration par vide: Le circuit pneumatique active la ventouse à travers le raccord tournant.
3. Rotation & Pivotement: Le moteur de moule démarre, puis le vérin rotatif pivote le bras de 90° horizontalement pour engager la pièce contre la brosse de satinage principale.
4. Injection de pâte: Le pistolet pulvérisateur effectue un balayage oscillant temporisé pour lubrifier la brosse avec la pâte abrasive.
5. Cycle temporisé: Satinage haute performance sous flux de pâte.
6. Fin de cycle: Pivotement inverse à 90°, arrêt de rotation, coupure du vide avec impulsion de soufflage pour libérer la pièce finie.`,
        componentIds: poaV4Components.map(c => c.id),
        createdAt: new Date().toISOString()
      };
      await db.machineBlueprints.add(poaV4Blueprint);

      // Create Registered Machines POL-V4-01, POA-03, POA-04 for V4 in SEC-11
      const poaV4MachinesList = [
        {
          id: 'mach-POLV401',
          blueprintId: 'mchbp-poa-v4',
          referenceCode: 'POL-V4-01',
          serialNumber: 'SN-POLV401-TWIN-AB',
          manufacturingYear: 2026,
          sectorId: 'SEC-11', // Polissage
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-POA03',
          blueprintId: 'mchbp-poa-v4',
          referenceCode: 'POA-03',
          serialNumber: 'SN-POA03-TWIN-A',
          manufacturingYear: 2023,
          sectorId: 'SEC-11', // Polissage
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-POA04',
          blueprintId: 'mchbp-poa-v4',
          referenceCode: 'POA-04',
          serialNumber: 'SN-POA04-TWIN-B',
          manufacturingYear: 2023,
          sectorId: 'SEC-11', // Polissage
          technicianId: null as any,
          status: 'Active' as const
        }
      ];
      await db.machines.bulkAdd(poaV4MachinesList);

      console.log(`[SandboxSeeder] Added ${poaV4MachinesList.length} POA V4 machines.`);

      // Create POM (Polissage Manuel) Template, Components, Blueprint, and registered machine
      const pomTemplate = {
        id: 'tpl-pom',
        familyId: 'fam-po',
        name: 'Polissage Manuel',
        type: 'M' as const, // Manual
        skuBase: 'POM',
        technicalDescription: 'Machine de polissage manuel simple équipée d\'un arbre d\'entraînement bilatéral pour deux postes de travail.',
        createdAt: new Date().toISOString()
      };
      await db.machineTemplates.add(pomTemplate);

      const pomComponents = [
        {
          id: 'comp-pom-moteur-central',
          name: 'Moteur électrique central étanche IP65 (Arbre d\'entraînement bilatéral & ventilateurs internes doubles)',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-pom-commutateur',
          name: 'Commutateur de commande rotatif ON/OFF tripolaire (Démarrage robuste)',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-pom-brosses-satinage',
          name: 'Kit de deux brosses de satinage minces (Pour finition de précision et zones d\'accès étroits)',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-pom-brosses-fils-acier',
          name: 'Kit de deux brosses métalliques à fils d\'acier (Ebavurage rigide pour pièces brutes)',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-pom-chassis-support',
          name: 'Châssis-support métallique lourd rigide avec silentblocs (Absorption de vibrations)',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        }
      ];
//       await db.standardComponents.bulkAdd(pomComponents);

      const pomBlueprint = {
        id: 'mchbp-pom-std',
        templateId: 'tpl-pom',
        reference: 'POL-POM-MANUAL',
        brand: 'PoliCraft',
        model: 'PC-POM-MANUAL',
        powerOrForce: 'Moteur central: 3.0 kW / 1500 RPM',
        energySource: 'Électrique 380V',
        technicalSpecs: `Machine de Polissage Manuel (Double poste face-à-face).
Comprend un unique moteur électrique central renforcé et étanche aux poussières d'aluminium, monté sur un châssis lourd pour minimiser les vibrations.
Le moteur entraîne un arbre rotatif bilatéral avec des brosses montées aux deux extrémités de l'arbre, tournant en continu dans le sens de l'opérateur.
Le moteur est équipé de doubles ventilateurs de refroidissement internes (un de chaque côté) pour dissiper efficacement la chaleur lors de charges continues de polissage et de frottement direct.
Permet à deux opérateurs de travailler simultanément sur les deux extrémités de l'arbre de manière autonome.
Supporte des brosses fines/disques de polissage délicat ou des brosses à fils d'acier trempé pour l'ébavurage.`,
        componentIds: pomComponents.map(c => c.id),
        createdAt: new Date().toISOString()
      };
      await db.machineBlueprints.add(pomBlueprint);

      const pomMachinesList = [
        {
          id: 'mach-POM01',
          blueprintId: 'mchbp-pom-std',
          referenceCode: 'POM-01',
          serialNumber: 'SN-POM01-SIM',
          manufacturingYear: 2020,
          sectorId: 'SEC-11', // Polissage
          technicianId: null as any,
          status: 'Active' as const
        }
      ];
      await db.machines.bulkAdd(pomMachinesList);

      console.log(`[SandboxSeeder] Added ${pomMachinesList.length} POM manual machines.`);

      // =============================================================
      // RVA (Riveteuse Automatique) ENGINE OVERHAUL & PARTS
      // =============================================================

      // 1. Create Preventive Tasks for RVA (The "Industrial Consciousness" Engine)

      // 2. Create PDR Master Data (Fulfilling the 4 Dimensions & 999 Slots Rule)
      const pdrFamilies = [
        { id: 'fam-CO', name: 'COURROIES', description: 'Power transmission belts', createdAt: new Date().toISOString() },
        { id: 'fam-RO', name: 'ROULEMENTS', description: 'SKF Standard bearings', createdAt: new Date().toISOString() },
        { id: 'fam-VI', name: 'VISSERIE', description: 'ISO Standard screws and bolts', createdAt: new Date().toISOString() },
        { id: 'fam-PNU', name: 'PNEUMATIQUE', description: 'Pneumatic components (Cylinders, valves, FRLs)', createdAt: new Date().toISOString() },
        { id: 'fam-MEC', name: 'MÉCANIQUE', description: 'Mechanical transmission and structural components', createdAt: new Date().toISOString() },
        { id: 'fam-ELE', name: 'ÉLECTRIQUE / MÉCATRONIQUE', description: 'Electrical control, PLC, sensors and automation mechatronic parts', createdAt: new Date().toISOString() }
      ];
      await db.pdrFamilies.bulkAdd(pdrFamilies);

      const pdrTemplates = [
        // COURROIES
        { id: 'temp-CO-A', familyId: 'fam-CO', name: 'Courroie Type A', skuBase: 'COA', createdAt: new Date().toISOString() },
        { id: 'temp-CO-B', familyId: 'fam-CO', name: 'Courroie Type B', skuBase: 'COB', createdAt: new Date().toISOString() },
        { id: 'temp-CO-SPZ', familyId: 'fam-CO', name: 'Courroie Type SPZ', skuBase: 'COSPZ', createdAt: new Date().toISOString() },
        // ROULEMENTS
        { id: 'temp-RO-B', familyId: 'fam-RO', name: 'Roulement Standard Ball 6xxx', skuBase: 'ROB', createdAt: new Date().toISOString() },
        { id: 'temp-RO-C', familyId: 'fam-RO', name: 'Roulement Conical 3xxxx', skuBase: 'ROC', createdAt: new Date().toISOString() },
        // VISSERIE
        { id: 'temp-VI-BTR', familyId: 'fam-VI', name: 'Vis Allen/BTR', skuBase: 'VIB', createdAt: new Date().toISOString() },
        // PNEUMATIQUE
        { id: 'temp-PNU-VER', familyId: 'fam-PNU', name: 'Vérin Pneumatique', skuBase: 'VEP', createdAt: new Date().toISOString() },
        { id: 'temp-PNU-FRL', familyId: 'fam-PNU', name: 'Filtre Régulateur Lubrificateur', skuBase: 'FRL', createdAt: new Date().toISOString() },
        { id: 'temp-PNU-VAL', familyId: 'fam-PNU', name: 'Vanne et Fin de Course', skuBase: 'FDC', createdAt: new Date().toISOString() },
        { id: 'temp-PNU-DST', familyId: 'fam-PNU', name: 'Distributeur / Électrovanne', skuBase: 'DST', createdAt: new Date().toISOString() },
        // MÉCANIQUE
        { id: 'temp-MEC-BIL', familyId: 'fam-MEC', name: 'Bielle et Entraînement', skuBase: 'BIE', createdAt: new Date().toISOString() },
        { id: 'temp-MEC-PIG', familyId: 'fam-MEC', name: 'Pignon et Engrenage', skuBase: 'PIG', createdAt: new Date().toISOString() },
        { id: 'temp-MEC-JNT', familyId: 'fam-MEC', name: 'Joint d\'Étanchéité', skuBase: 'JNT', createdAt: new Date().toISOString() },
        { id: 'temp-MEC-CLA', familyId: 'fam-MEC', name: 'Clavette d\'Embrayage (المخلب الميكانيكي)', skuBase: 'CLA', createdAt: new Date().toISOString() },
        { id: 'temp-MEC-RES', familyId: 'fam-MEC', name: 'Ressort de Rappel / Embrayage (الزنبركات)', skuBase: 'RES', createdAt: new Date().toISOString() },
        { id: 'temp-MEC-GLI', familyId: 'fam-MEC', name: 'Glissière et Garniture (مجرى وحشوة المكبس)', skuBase: 'GLI', createdAt: new Date().toISOString() },
        { id: 'temp-MEC-CAR', familyId: 'fam-MEC', name: 'Carter de Protection (أغطية الأمان)', skuBase: 'CAR', createdAt: new Date().toISOString() },
        { id: 'temp-MEC-REG', familyId: 'fam-MEC', name: 'Système de Réglage de Course (منظومة ضبط الشوط والمعايرة)', skuBase: 'REG', createdAt: new Date().toISOString() },
        { id: 'temp-PNU-RAC', familyId: 'fam-PNU', name: 'Raccord Tournant Pneumatique (الوصلة الدورانية للشفط)', skuBase: 'RAC', createdAt: new Date().toISOString() },
        { id: 'temp-MEC-FRN', familyId: 'fam-MEC', name: 'Système de Freinage / Garnitures (نظام الفرامل وقماش المكابح)', skuBase: 'FRN', createdAt: new Date().toISOString() },
        { id: 'temp-MEC-FLT', familyId: 'fam-MEC', name: 'Filtres et Consommables Hydrauliques (فلتر الزيت والقطع الهيدروليكية)', skuBase: 'FLT', createdAt: new Date().toISOString() },
        // ÉLECTRIQUE / MÉCATRONIQUE
        { id: 'temp-ELE-PLC', familyId: 'fam-ELE', name: 'Automate Programmable (PLC)', skuBase: 'PLC', createdAt: new Date().toISOString() },
        { id: 'temp-ELE-VAR', familyId: 'fam-ELE', name: 'Variateur de Vitesse / Inverter', skuBase: 'VAR', createdAt: new Date().toISOString() },
        { id: 'temp-ELE-CAP', familyId: 'fam-ELE', name: 'Capteur de Proximité / Switch', skuBase: 'CAP', createdAt: new Date().toISOString() },
        { id: 'temp-ELE-CON', familyId: 'fam-ELE', name: 'Contacteur et Relais Thermique (الكونتاكتور والحماية الكهربائية)', skuBase: 'CON', createdAt: new Date().toISOString() }
      ];
      await db.pdrTemplates.bulkAdd(pdrTemplates);

      // PdrBlueprints - following the 999 slots: [skuBase]-[001-999] sequential nomenclature
      const pdrBlueprints = [
        {
          id: 'bp-pdr-vep001',
          templateId: 'temp-PNU-VER',
          reference: 'VEP-001', // Slot 001
          unit: 'Pcs',
          minThreshold: 1,
          model: 'DSNU-25-100-PPV-A',
          powerOrForce: '6 bar',
          technicalSpecs: 'Vérin de frein pneumatique double effet à rappel par ressort intégré',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-fdc001',
          templateId: 'temp-PNU-VAL',
          reference: 'FDC-001', // Slot 001
          unit: 'Pcs',
          minThreshold: 3,
          model: 'VM130-F01-00',
          powerOrForce: 'Mécanique à Galet',
          technicalSpecs: 'Vanne pneumatique fin de course mécanique à galet pour soufflage et timing',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-frl001',
          templateId: 'temp-PNU-FRL',
          reference: 'FRL-001', // Slot 001
          unit: 'Pcs',
          minThreshold: 1,
          model: 'AC20-F02G-A',
          powerOrForce: '10 bar Max',
          technicalSpecs: 'Unité complète de traitement d\'air FRL (Filtre, Régulateur, Lubrificateur)',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-dst001',
          templateId: 'temp-PNU-DST',
          reference: 'DST-001', // Slot 001
          unit: 'Pcs',
          minThreshold: 1,
          model: 'VUVS-L20-M52-MD-G18',
          powerOrForce: '24V DC / 6 bar',
          technicalSpecs: 'Électrovanne de distribution principale haut débit à rappel par ressort',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-jnt001',
          templateId: 'temp-MEC-JNT',
          reference: 'JNT-001', // Slot 001
          unit: 'Pcs',
          minThreshold: 5,
          model: 'JNT-DK-25X35',
          powerOrForce: 'Standard',
          technicalSpecs: 'Joint d\'étanchéité à lèvres résistant à la poussière d\'aluminium pour vérin',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-bie001',
          templateId: 'temp-MEC-BIL',
          reference: 'BIE-001', // Slot 001
          unit: 'Pcs',
          minThreshold: 1,
          model: 'BIE-RVA-V1-ARM',
          powerOrForce: 'Démultiplié',
          technicalSpecs: 'Bielle d\'accouplement principale type locomotive à roulement étanche',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-pig001',
          templateId: 'temp-MEC-PIG',
          reference: 'PIG-001', // Slot 001
          unit: 'Pcs',
          minThreshold: 2,
          model: 'PIG-MOD2-Z15',
          powerOrForce: 'Module 2 - 15T',
          technicalSpecs: 'Pignon moteur d\'entraînement primaire 15 dents en acier carboné',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-pig002',
          templateId: 'temp-MEC-PIG',
          reference: 'PIG-002', // Slot 002
          unit: 'Pcs',
          minThreshold: 1,
          model: 'PIG-MOD2-Z120',
          powerOrForce: 'Module 2 - 120T',
          technicalSpecs: 'Grande couronne d\'inertie dentée de démultiplication double réduction 120 dents',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-jnt002',
          templateId: 'temp-MEC-JNT',
          reference: 'JNT-002', // Slot 002
          unit: 'Pcs',
          minThreshold: 2,
          model: 'GRN-FR-RVA-COUD',
          powerOrForce: 'Haute friction',
          technicalSpecs: 'Garniture de frein pré-moulée pour machoire à levier coudé RVA',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-vib001',
          templateId: 'temp-VI-BTR',
          reference: 'VIB-001', // Slot 001
          unit: 'Pcs',
          minThreshold: 10,
          model: 'TIG-FIL-M12',
          powerOrForce: 'Classe 8.8',
          technicalSpecs: 'Tige filetée haute résistance de réglage de hauteur et d\'inclinaison de rail',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-vep002',
          templateId: 'temp-PNU-VER',
          reference: 'VEP-002', // Slot 002
          unit: 'Pcs',
          minThreshold: 1,
          model: 'DRRD-12-180-FH-PA',
          powerOrForce: '6 bar / Actuateur Rotatif',
          technicalSpecs: 'Vérin rotatif pneumatique du distributeur (الفيران الدوراني لقرص الفرز)',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-fdc002',
          templateId: 'temp-PNU-VAL',
          reference: 'FDC-002', // Slot 002
          unit: 'Pcs',
          minThreshold: 2,
          model: 'VM130-F01-08',
          powerOrForce: 'Mécanique à Galet Interne',
          technicalSpecs: 'Valve fin de course pneumatique à galet (interne) (حساس نهاية الشوط الداخلي للسان)',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-fdc003',
          templateId: 'temp-PNU-VAL',
          reference: 'FDC-003', // Slot 003
          unit: 'Pcs',
          minThreshold: 1,
          model: 'VF3130-5G-02',
          powerOrForce: '6 bar / Pédale pure',
          technicalSpecs: 'Pédale pneumatique pure (الدواسة الهوائية الجديدة)',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-dst002',
          templateId: 'temp-PNU-DST',
          reference: 'DST-002', // Slot 002
          unit: 'Pcs',
          minThreshold: 1,
          model: 'SY5120-5D-C6',
          powerOrForce: '6 bar / Haut Débit',
          technicalSpecs: 'Bloc distributeur haute performance (الموزع المحسن والجديد)',
          createdAt: new Date().toISOString()
        },
        // MECHATRONICS V4 SPECIFIC SPARE PARTS
        {
          id: 'bp-pdr-plc001',
          templateId: 'temp-ELE-PLC',
          reference: 'PLC-001', // Slot 001
          unit: 'Pcs',
          minThreshold: 1,
          model: 'S7-1200 CPU 1214C DC/DC/DC',
          powerOrForce: '24V DC',
          technicalSpecs: 'Automate programmable industriel (PLC) pour la gestion du cycle de rivetage et timing',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-var001',
          templateId: 'temp-ELE-VAR',
          reference: 'VAR-001', // Slot 001
          unit: 'Pcs',
          minThreshold: 1,
          model: 'Altivar Machine ATV320 4kW',
          powerOrForce: '380V Triphasé',
          technicalSpecs: 'Variateur de vitesse et de fréquence pour contrôle de couple et rampe de moteur central',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-cap001',
          templateId: 'temp-ELE-CAP',
          reference: 'CAP-001', // Slot 001
          unit: 'Pcs',
          minThreshold: 2,
          model: 'XS612B1PAL2',
          powerOrForce: '12-24V DC / Inductif',
          technicalSpecs: 'Capteur de proximité inductif cylindrique M12 pour fin de course de bielle de rivetage',
          createdAt: new Date().toISOString()
        },
        // RVM MANUAL MECHANICAL SPARE PARTS
        {
          id: 'bp-pdr-cla001',
          templateId: 'temp-MEC-CLA',
          reference: 'CLA-001', // Slot 001
          unit: 'Pcs',
          minThreshold: 2,
          model: 'CL-RVM-V1',
          powerOrForce: 'Haute résistance',
          technicalSpecs: 'Clavette tournante mico-alliée (المخلب الداخلي لآلة RVM) لنقل الحركة الكبسية',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-res001',
          templateId: 'temp-MEC-RES',
          reference: 'RES-001', // Slot 001
          unit: 'Pcs',
          minThreshold: 5,
          model: 'RES-EMB-RVM',
          powerOrForce: 'Forte tension',
          technicalSpecs: 'Ressort hélicoïdal d\'embrayage pour rappel instantané de la clavette tournante',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-res002',
          templateId: 'temp-MEC-RES',
          reference: 'RES-002', // Slot 002
          unit: 'Pcs',
          minThreshold: 4,
          model: 'RES-PED-RVM',
          powerOrForce: 'Rappel lourd',
          technicalSpecs: 'Ressort de traction lourd pour rappel de la pédale mécanique de commande',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-gli001',
          templateId: 'temp-MEC-GLI',
          reference: 'GLI-001', // Slot 001
          unit: 'Pcs',
          minThreshold: 2,
          model: 'GNT-GLI-RVM',
          powerOrForce: 'Basse friction',
          technicalSpecs: 'Garniture ou glissière en bronze/composite de guidage du piston de bielle pour réduire les frottements et l\'usure',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-con001',
          templateId: 'temp-ELE-CON',
          reference: 'CON-001', // Slot 001
          unit: 'Pcs',
          minThreshold: 2,
          model: 'LC1D09P7',
          powerOrForce: '230V AC / 9A',
          technicalSpecs: 'Contacteur TeSys D triphasé pour la commande de puissance du moteur électrique',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-con002',
          templateId: 'temp-ELE-CON',
          reference: 'CON-002', // Slot 002
          unit: 'Pcs',
          minThreshold: 2,
          model: 'LRD14',
          powerOrForce: '7-10A',
          technicalSpecs: 'Relais de surcharge thermique de protection contre les surintensités du moteur',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-car001',
          templateId: 'temp-MEC-CAR',
          reference: 'CAR-001', // Slot 001
          unit: 'Pcs',
          minThreshold: 1,
          model: 'CRT-PRO-VOL',
          powerOrForce: 'HSE Métallique',
          technicalSpecs: 'Carter de protection en tôle d\'acier enveloppant le volant d\'inertie et les courroies',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-reg001',
          templateId: 'temp-MEC-REG',
          reference: 'REG-001', // Slot 001
          unit: 'Pcs',
          minThreshold: 1,
          model: 'TIG-REG-M20',
          powerOrForce: 'Pas fin M20',
          technicalSpecs: 'Tige filetée de bielle principale pour réglage de hauteur de course du poinçon',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-reg002',
          templateId: 'temp-MEC-REG',
          reference: 'REG-002', // Slot 002
          unit: 'Pcs',
          minThreshold: 5,
          model: 'CTR-ECR-M20',
          powerOrForce: 'M20 Acier',
          technicalSpecs: 'Contre-écrou de blocage robuste de réglage de bielle pour empêcher le déréglage sous l\'effet des vibrations',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-reg003',
          templateId: 'temp-MEC-REG',
          reference: 'REG-003', // Slot 003
          unit: 'Pcs',
          minThreshold: 2,
          model: 'VIS-ENC-RVM',
          powerOrForce: 'M16',
          technicalSpecs: 'Boulon/vis de réglage de hauteur d\'enclume inférieure (support de rivet)',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-gli002',
          templateId: 'temp-MEC-GLI',
          reference: 'GLI-002', // Slot 002
          unit: 'Pcs',
          minThreshold: 2,
          model: 'PST-RVM-V3',
          powerOrForce: 'Bande d\'usure en bronze',
          technicalSpecs: 'Piston interne (Coulisseau noyé RVM-V3) - المكبس الداخلي المخفي الذي يتحرك داخل تجويف مغلق مسبوك بدقة لحمايته تماماً من الأوساخ وغبار الألومنيوم ويمنع خلوص الحركة الجانبية للـ V3',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-bie002',
          templateId: 'temp-MEC-BIL',
          reference: 'BIE-002', // Slot 002
          unit: 'Pcs',
          minThreshold: 2,
          model: 'BIE-MOT-V3',
          powerOrForce: 'Acier forgé traité',
          technicalSpecs: 'Bielle de type moteur (ذراع التوصيل الداخلي RVM-V3) - ذراع توصيل داخلي يشبه بيال محرك الاحتراق لتحويل حركة عمود الحدبات إلى حركة خطية للمكبس الداخلي بقوة وعزم صدمي أعلى',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-reg004',
          templateId: 'temp-MEC-REG',
          reference: 'REG-004', // Slot 004
          unit: 'Pcs',
          minThreshold: 3,
          model: 'TIG-PED-V3',
          powerOrForce: 'Réglage micrométrique',
          technicalSpecs: 'Tige de pédale réglable (قضيب الدواسة القابل للضبط RVM-V3) - قضيب ميكانيكي واصل بين الدواسة والكوموند لتعديل حساسية وارتفاع الدواسة حسب رغبة العامل',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-reg005',
          templateId: 'temp-MEC-REG',
          reference: 'REG-005', // Slot 005
          unit: 'Pcs',
          minThreshold: 2,
          model: 'PPH-FRN-V3',
          powerOrForce: 'Haute dureté HRC58',
          technicalSpecs: 'Porte-poinçon frontal (رأس تثبيت البوانسو السفلي RVM-V3) - الجزء الوحيد البارز من المكبس المغلق بالأسفل حيث يتم تثبيت لقمة الكبس وتغييرها بسهولة وسرعة',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-gen001',
          templateId: 'temp-MEC-PAL',
          reference: 'GEN-001', // Slot 001
          unit: 'Pcs',
          minThreshold: 4,
          model: 'AXE-BAG-GEN-V3',
          powerOrForce: 'Haute résistance mécanique',
          technicalSpecs: 'Axes et bagues de genouillère (محاور وجلب آلية الركبة RVM-V3) - محاور وجلب ميكانيكية معالجة حرارياً لمقاومة الاحتكاك والقص المتكرر في آلية الركبة',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-cla002',
          templateId: 'temp-MEC-PAL',
          reference: 'CLA-002', // Slot 002
          unit: 'Pcs',
          minThreshold: 2,
          model: 'DCE-ECL-V3',
          powerOrForce: 'Double doigt',
          technicalSpecs: 'Doigts de commande d\'embrayage éclipsables (أصابع الكلافيت الذكية RVM-V3) - أصابع أمان ميكانيكية مزدوجة تمنع تكرار الضربات وتطوي تلقائياً في حالة الدوران العكسي لحماية الآلة',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-bie003',
          templateId: 'temp-MEC-PAL',
          reference: 'BIE-003', // Slot 003
          unit: 'Pcs',
          minThreshold: 2,
          model: 'BIL-HOR-V3',
          powerOrForce: 'Effort axial direct',
          technicalSpecs: 'Bielle horizontale (ذراع الدفع الأفقي RVM-V3) - ذراع توصيل جانبي متين يقوم بتحويل حركة عمود الحدبات الدورانية إلى حركة خطية أفقية واصلة للمفصل المركزي لتفعيل الركبة',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-pvt001',
          templateId: 'temp-MEC-PAL',
          reference: 'PVT-001', // Slot 001
          unit: 'Pcs',
          minThreshold: 2,
          model: 'PVT-GEN-V3',
          powerOrForce: 'Très haute résilience',
          technicalSpecs: 'Axe d\'articulation central / Pivot de genouillère (محور المفصل المركزي RVM-V3) - المحور الحرج المعرض لإجهاد قص هائل (Effort de cisaillement) يربط البيال والذراعين العلوي والسفلي معاً ويجب مراقبة تشحيمه',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-bra001',
          templateId: 'temp-MEC-PAL',
          reference: 'BRA-001', // Slot 001
          unit: 'Pcs',
          minThreshold: 2,
          model: 'BRS-GEN-SUP-V3',
          powerOrForce: 'Pivot fixe',
          technicalSpecs: 'Bras de genouillère supérieur (الذراع العلوي لآلية الركبة RVM-V3) - ذراع ميكانيكي مسبوك صلب يدور حول نقطة ارتكاز ثابتة في هيكل الآلة لتضخيم عزم الكبس',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-bra002',
          templateId: 'temp-MEC-PAL',
          reference: 'BRA-002', // Slot 002
          unit: 'Pcs',
          minThreshold: 2,
          model: 'BRS-GEN-INF-V3',
          powerOrForce: 'Pivot mobile',
          technicalSpecs: 'Bras de genouillère inférieur (الذراع السفلي لآلية الركبة RVM-V3) - ذراع ميكانيكي واصل بين المفصل المركزي ومكبس البرشمة العمودي لنقل ذروة قوة الصدمة',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-roc001',
          templateId: 'temp-RO-C',
          reference: 'ROC-001', // Slot 001
          unit: 'Pcs',
          minThreshold: 2,
          model: '32210 SKF',
          powerOrForce: 'Forte charge radiale/axiale',
          technicalSpecs: 'Roulement à rouleaux coniques (رولمان مخروطي) - مصمم خصيصاً لتحمل القوى المحورية والجانبية الناتجة عن ضغط أداة الخراطة على حافة الآنية',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-rac001',
          templateId: 'temp-PNU-RAC',
          reference: 'RAC-001', // Slot 001
          unit: 'Pcs',
          minThreshold: 2,
          model: 'Rotoflux G1/4"',
          powerOrForce: '10 bar / High speed',
          technicalSpecs: 'Raccord tournant pneumatique (الوصلة الدورانية للشفط) - يسمح بمرور الشفط من الأنابيب الثابتة إلى القالب الدوار دون حدوث تسريب للهواء',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-frn001',
          templateId: 'temp-MEC-FRN',
          reference: 'FRN-001', // Slot 001
          unit: 'Pcs',
          minThreshold: 2,
          model: 'PFC-D100',
          powerOrForce: 'Pneumatique active',
          technicalSpecs: 'Garnitures et plaquettes de frein (قماش مكابح الديتوراج) - فكوك الكبح الهوائية لإيقاف المحور الدوار للآلة فوراً عند إطفاء المحرك لحماية العامل',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-dst003',
          templateId: 'temp-PNU-DST',
          reference: 'DST-003', // Slot 003
          unit: 'Pcs',
          minThreshold: 2,
          model: 'Bobine 24V DC / 110V AC',
          powerOrForce: 'Bobine d\'excitation',
          technicalSpecs: 'Bobines de distributeurs (الملفات الكهربائية) - الملفات المغناطيسية المسؤولة عن تحويل الإشارات الكهربائية إلى حركة ميكانيكية للموزعات',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-flt001',
          templateId: 'temp-MEC-FLT',
          reference: 'FLT-001', // Slot 001
          unit: 'Pcs',
          minThreshold: 2,
          model: 'FIL-HYD-50',
          powerOrForce: '10 microns',
          technicalSpecs: 'Filtre hydraulique (فلتر الزيت الهيدروليكي) - لتنقية الزيت بانتظام وحماية طلمبة المحطة الهيدروليكية وصمامات التحكم من الانسداد',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-jnt003',
          templateId: 'temp-MEC-JNT',
          reference: 'JNT-003', // Slot 003
          unit: 'Pcs',
          minThreshold: 2,
          model: 'JOI-VER-VER',
          powerOrForce: 'Haute étanchéité',
          technicalSpecs: 'Joints d\'étanchéité du vérin (طقم جوانات الفيرانت الهيدروليكي) - لمنع تسريب الزيت والحفاظ على ضغط القص مستقراً',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-reg006',
          templateId: 'temp-MEC-REG',
          reference: 'REG-006', // Slot 006
          unit: 'Pcs',
          minThreshold: 2,
          model: 'REG-HYD-1/4',
          powerOrForce: 'Régulateur de débit',
          technicalSpecs: 'Régulateur de débit hydraulique (صمام خنق الصبيب) - لمعايرة سرعة تقدم ورجوع الفيران لضمان قص ناعم ودقيق',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-cap002',
          templateId: 'temp-ELE-CAP',
          reference: 'CAP-002', // Slot 002
          unit: 'Pcs',
          minThreshold: 2,
          model: 'XCK-M110 Schneider',
          powerOrForce: 'Levier à galet',
          technicalSpecs: 'Interrupteur fin de course (حساس نهاية الشوط السفلي) - حساس ميكانيكي برافعة يوقف نزول الفيران ويبدأ الصعود العكسي فور ملامسته',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bp-pdr-gli003',
          templateId: 'temp-MEC-GLI',
          reference: 'GLI-003', // Slot 003
          unit: 'Pcs',
          minThreshold: 2,
          model: 'HGH20CA HIWIN',
          powerOrForce: 'Guidage linéaire à billes',
          technicalSpecs: 'Patins de guidage linéaire (حشوات السكك الخطية) - لضمان ثبات تام للحامل أثناء حركة القص ومنع الاهتزازات الجانبية',
          createdAt: new Date().toISOString()
        }
      ];
      await db.pdrBlueprints.bulkAdd(pdrBlueprints);

      // 3. Register Inventory (Stock Items - The Physical Real Presence in WH)
      const pdrStocks = [
        { id: 'stk-vep001', blueprintId: 'bp-pdr-vep001', warehouseId: 'WH-MAGASIN', quantityCurrent: 3, locationDetails: 'Rayon Pneumatique A-1', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-fdc001', blueprintId: 'bp-pdr-fdc001', warehouseId: 'WH-MAGASIN', quantityCurrent: 12, locationDetails: 'Rayon Capteurs B-3', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-frl001', blueprintId: 'bp-pdr-frl001', warehouseId: 'WH-MAGASIN', quantityCurrent: 2, locationDetails: 'Rayon Pneumatique A-4', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-dst001', blueprintId: 'bp-pdr-dst001', warehouseId: 'WH-MAGASIN', quantityCurrent: 5, locationDetails: 'Rayon Électronique E-2', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-jnt001', blueprintId: 'bp-pdr-jnt001', warehouseId: 'WH-DEPOT', quantityCurrent: 20, locationDetails: 'Tiroir Garnitures T-1', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-bie001', blueprintId: 'bp-pdr-bie001', warehouseId: 'WH-DEPOT', quantityCurrent: 2, locationDetails: 'Rayon Mécanique M-2', updatedAt: new Date().toISOString(), condition: 'USED' as const },
        { id: 'stk-pig001', blueprintId: 'bp-pdr-pig001', warehouseId: 'WH-DEPOT', quantityCurrent: 4, locationDetails: 'Rayon Transmissions T-5', updatedAt: new Date().toISOString(), condition: 'REFURBISHED' as const },
        { id: 'stk-pig002', blueprintId: 'bp-pdr-pig002', warehouseId: 'WH-DEPOT', quantityCurrent: 1, locationDetails: 'Rayon Transmissions T-6', updatedAt: new Date().toISOString(), condition: 'LEGACY' as const },
        { id: 'stk-jnt002', blueprintId: 'bp-pdr-jnt002', warehouseId: 'WH-DEPOT', quantityCurrent: 6, locationDetails: 'Tiroir Garnitures T-2', updatedAt: new Date().toISOString(), condition: 'USED' as const },
        { id: 'stk-vib001', blueprintId: 'bp-pdr-vib001', warehouseId: 'WH-MAGASIN', quantityCurrent: 15, locationDetails: 'Tiroir Visserie V-3', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-vep002', blueprintId: 'bp-pdr-vep002', warehouseId: 'WH-DEPOT', quantityCurrent: 2, locationDetails: 'Rayon Pneumatique A-2', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-fdc002', blueprintId: 'bp-pdr-fdc002', warehouseId: 'WH-MAGASIN', quantityCurrent: 5, locationDetails: 'Rayon Capteurs B-4', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-fdc003', blueprintId: 'bp-pdr-fdc003', warehouseId: 'WH-MAGASIN', quantityCurrent: 2, locationDetails: 'Rayon Pneumatique A-3', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-dst002', blueprintId: 'bp-pdr-dst002', warehouseId: 'WH-MAGASIN', quantityCurrent: 3, locationDetails: 'Rayon Pneumatique A-5', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        // MECHATRONICS V4 SPECIFIC STOCK
        { id: 'stk-plc001', blueprintId: 'bp-pdr-plc001', warehouseId: 'WH-MAGASIN', quantityCurrent: 2, locationDetails: 'Rayon Électronique E-3', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-var001', blueprintId: 'bp-pdr-var001', warehouseId: 'WH-MAGASIN', quantityCurrent: 1, locationDetails: 'Rayon Électronique E-4', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-cap001', blueprintId: 'bp-pdr-cap001', warehouseId: 'WH-MAGASIN', quantityCurrent: 8, locationDetails: 'Rayon Capteurs B-5', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        // RVM MANUAL MECHANICAL SPECIFIC STOCK
        { id: 'stk-cla001', blueprintId: 'bp-pdr-cla001', warehouseId: 'WH-MAGASIN', quantityCurrent: 6, locationDetails: 'Rayon Mécanique M-3', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-res001', blueprintId: 'bp-pdr-res001', warehouseId: 'WH-MAGASIN', quantityCurrent: 15, locationDetails: 'Tiroir Quincaillerie Q-1', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-res002', blueprintId: 'bp-pdr-res002', warehouseId: 'WH-MAGASIN', quantityCurrent: 10, locationDetails: 'Tiroir Quincaillerie Q-2', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-gli001', blueprintId: 'bp-pdr-gli001', warehouseId: 'WH-MAGASIN', quantityCurrent: 4, locationDetails: 'Rayon Mécanique M-4', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-con001', blueprintId: 'bp-pdr-con001', warehouseId: 'WH-MAGASIN', quantityCurrent: 3, locationDetails: 'Rayon Électrique E-5', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-con002', blueprintId: 'bp-pdr-con002', warehouseId: 'WH-MAGASIN', quantityCurrent: 3, locationDetails: 'Rayon Électrique E-5', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-car001', blueprintId: 'bp-pdr-car001', warehouseId: 'WH-DEPOT', quantityCurrent: 1, locationDetails: 'Étagère Sécurité S-1', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-reg001', blueprintId: 'bp-pdr-reg001', warehouseId: 'WH-MAGASIN', quantityCurrent: 2, locationDetails: 'Rayon Mécanique M-5', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-reg002', blueprintId: 'bp-pdr-reg002', warehouseId: 'WH-MAGASIN', quantityCurrent: 10, locationDetails: 'Tiroir Visserie V-4', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-reg003', blueprintId: 'bp-pdr-reg003', warehouseId: 'WH-MAGASIN', quantityCurrent: 4, locationDetails: 'Tiroir Visserie V-4', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-gli002', blueprintId: 'bp-pdr-gli002', warehouseId: 'WH-MAGASIN', quantityCurrent: 5, locationDetails: 'Rayon Mécanique M-4', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-bie002', blueprintId: 'bp-pdr-bie002', warehouseId: 'WH-DEPOT', quantityCurrent: 3, locationDetails: 'Rayon Mécanique M-2', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-reg004', blueprintId: 'bp-pdr-reg004', warehouseId: 'WH-MAGASIN', quantityCurrent: 8, locationDetails: 'Tiroir Visserie V-4', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-reg005', blueprintId: 'bp-pdr-reg005', warehouseId: 'WH-MAGASIN', quantityCurrent: 4, locationDetails: 'Tiroir Visserie V-4', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-gen001', blueprintId: 'bp-pdr-gen001', warehouseId: 'WH-MAGASIN', quantityCurrent: 10, locationDetails: 'Rayon Mécanique M-6', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-cla002', blueprintId: 'bp-pdr-cla002', warehouseId: 'WH-MAGASIN', quantityCurrent: 6, locationDetails: 'Rayon Mécanique M-7', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-bie003', blueprintId: 'bp-pdr-bie003', warehouseId: 'WH-DEPOT', quantityCurrent: 3, locationDetails: 'Rayon Mécanique M-2', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-pvt001', blueprintId: 'bp-pdr-pvt001', warehouseId: 'WH-MAGASIN', quantityCurrent: 12, locationDetails: 'Tiroir Quincaillerie Q-3', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-bra001', blueprintId: 'bp-pdr-bra001', warehouseId: 'WH-DEPOT', quantityCurrent: 4, locationDetails: 'Rayon Mécanique M-8', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-bra002', blueprintId: 'bp-pdr-bra002', warehouseId: 'WH-DEPOT', quantityCurrent: 4, locationDetails: 'Rayon Mécanique M-8', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-roc001', blueprintId: 'bp-pdr-roc001', warehouseId: 'WH-MAGASIN', quantityCurrent: 6, locationDetails: 'Rayon Roulements R-3', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-rac001', blueprintId: 'bp-pdr-rac001', warehouseId: 'WH-MAGASIN', quantityCurrent: 4, locationDetails: 'Rayon Pneumatique A-4', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-frn001', blueprintId: 'bp-pdr-frn001', warehouseId: 'WH-MAGASIN', quantityCurrent: 8, locationDetails: 'Rayon Mécanique M-9', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-dst003', blueprintId: 'bp-pdr-dst003', warehouseId: 'WH-MAGASIN', quantityCurrent: 10, locationDetails: 'Rayon Pneumatique A-5', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-flt001', blueprintId: 'bp-pdr-flt001', warehouseId: 'WH-DEPOT', quantityCurrent: 5, locationDetails: 'Rayon Consommables C-2', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-jnt003', blueprintId: 'bp-pdr-jnt003', warehouseId: 'WH-MAGASIN', quantityCurrent: 12, locationDetails: 'Rayon Hydraulique H-1', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-reg006', blueprintId: 'bp-pdr-reg006', warehouseId: 'WH-MAGASIN', quantityCurrent: 6, locationDetails: 'Rayon Hydraulique H-2', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-cap002', blueprintId: 'bp-pdr-cap002', warehouseId: 'WH-MAGASIN', quantityCurrent: 8, locationDetails: 'Rayon Électricité E-4', updatedAt: new Date().toISOString(), condition: 'NEW' as const },
        { id: 'stk-gli003', blueprintId: 'bp-pdr-gli003', warehouseId: 'WH-MAGASIN', quantityCurrent: 4, locationDetails: 'Rayon Mécanique M-10', updatedAt: new Date().toISOString(), condition: 'NEW' as const }
      ];
      await db.inventory.bulkAdd(pdrStocks);

      // 4. Create RVA Machine Family, RVA Template
      const rvFamily = {
        id: 'fam-rv',
        name: 'Riveteuse',
        code: 'RV',
        technicalDescription: 'Machines d\'assemblage par rivetage automatique ou manuel.',
        createdAt: new Date().toISOString()
      };
      await db.machineFamilies.add(rvFamily);

      const rvaTemplate = {
        id: 'tpl-rva',
        familyId: 'fam-rv',
        name: 'Riveteuse Automatique',
        type: 'A' as const, // Automatic
        skuBase: 'RVA',
        technicalDescription: 'Riveteuse automatique de précision à synchronisation mécanique et pneumatique active.',
        createdAt: new Date().toISOString()
      };
      await db.machineTemplates.add(rvaTemplate);

      const rvmTemplate = {
        id: 'tpl-rvm',
        familyId: 'fam-rv',
        name: 'Riveteuse Mécanique à Alimentation Manuelle',
        type: 'M' as const, // Manual/Mechanical
        skuBase: 'RVM',
        technicalDescription: 'Riveteuse mécanique simple à alimentation manuelle des rivets et commande par pédale mécanique pure.',
        createdAt: new Date().toISOString()
      };
      await db.machineTemplates.add(rvmTemplate);

      const detFamily = {
        id: 'fam-det',
        name: 'Détourage',
        code: 'DT',
        technicalDescription: 'Machines de détourage pour l\'usinage, l\'ébavurage et le contournage de précision des ustensiles.',
        createdAt: new Date().toISOString()
      };
      await db.machineFamilies.add(detFamily);

      const detTemplate = {
        id: 'tpl-det',
        familyId: 'fam-det',
        name: 'Détoureuse',
        type: 'H' as const, // Hydropneumatic / Hydraulic
        skuBase: 'DET',
        technicalDescription: 'Machine de détourage hydropneumatique à vide de haute performance pour le rognage des bords.',
        createdAt: new Date().toISOString()
      };
      await db.machineTemplates.add(detTemplate);

      // 5. Complete V1 Component Architecture
      const rvaComponents = [
        // 1. منظومة نقل الحركة الثقيلة والتخفيض المزدوج (Système de Transmission & Réduction)
        {
          id: 'comp-rva-moteur-principal',
          name: 'المحرك الميكانيكي الرئيسي (Moteur Principal) - محرك تيار مستمر مصدر الطاقة',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-poulies-courroies',
          name: 'بكرة السيور المبدئية (Poulie-Courroie SPZ1950) لنقل وتخفيض السرعة',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-pignon-primaire',
          name: 'الترس القائد الصغير (Pignon) المعالج حرارياً لنقل عزم الدوران',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-couronne-grand-pignon',
          name: 'الترس الكبير والثقيل (Couronne / Grand Pignon) حدافة الموازنة لتخزين طاقة الكبس',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-volant-reglage-manuel',
          name: 'عجلة التدوير اليدوي للأمان (Volant de réglage manuel) لمعايرة مسار الشوط والتأكد من خلوه',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-roulements-axes',
          name: 'كراسي التحميل والمحاور (Roulements & Axes 6205 & 33205) لدعم وتوجيه الأجزاء الدوارة والعمودية',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },

        // 2. آلية دفع اللسان المطورة (Système Bielle-Manivelle - "القطار البخاري")
        {
          id: 'comp-rva-bielle-manivelle',
          name: 'ذراع التوصيل والكرنك (Bielle-Manivelle) لتحويل الحركة الدوارة إلى حركة خطية تردديّة',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-guides-lineaires',
          name: 'قضبان التوجيه المتوازية (Guides Linéaires / 2 Axes parallèles) لمنع أي انحراف جانبي',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-doigt-reglable',
          name: 'اللسان القابل لضبط الطول (Doigt d\'alimentation réglable) لضبط دقة دفع مسمار البرشام',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },

        // 3. قرص التحكم والفرملة الهوائي الذكي (Disque à Cames Réglables)
        {
          id: 'comp-rva-plateau-cames-reglables',
          name: 'قرص التحكم المزدوج (Plateau à cames) كقاعدة لتثبيت كامات التوقيت وكسطح احتكاك للفرملة',
          family: 'MEC' as const,
          taskIds: ['task-rva-cames-vis'],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-bossages-cames',
          name: 'رؤوس الكامّات القابلة للتعديل (Cames réglables) لتغيير توقيت فتح وإغلاق صمامات الهواء',
          family: 'MEC' as const,
          taskIds: ['task-rva-cames-vis'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-valves-fin-course-pneu',
          name: 'حساسات الشوط الهوائية للقرص (Fin de course pneumatique à galet) لتوجيه الإشارات النيوماتيكية',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-machoires-frein-levier-coude',
          name: 'ذراع الفرملة المقوس (Mâchoires de frein coudé) المبطن بقماش احتكاك عالي للكبح الفوري',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-verin-frein-double',
          name: 'فيلان الفرامل المزدوج والزنبرك (Vérin de frein & Ressort) لتحرير وكبح القرص بدقة',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },

        // 4. منظومة فرز وتوزيع المسامير الميكانيكية الكلاسيكية (Système de Distribution Mécanique)
        {
          id: 'comp-rva-disque-distributeur',
          name: 'قرص التوزيع الميكانيكي التبادلي (Disque Distributeur) لعزل المسامير وتمرير مسمار واحد فقط',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-biellettes-commande',
          name: 'روافع التوصيل الميكانيكية (Biellettes de commande) لنقل الحركة من الدواسة إلى قرص التوزيع',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-axes-reglage-rail',
          name: 'محاور ضبط السكة الجانبية (Axes de réglage de rail / Coulisse) للتحكم في خلوص وعرض سكة التوجيه',
          family: 'MEC' as const,
          taskIds: ['task-rva-vis-reglage'],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },

        // 5. لوحة إدارة الهواء الكلاسيكية ونظام التنظيف (Système Pneumatique Classique & Soufflage)
        {
          id: 'comp-rva-frl',
          name: 'مجموعة معالجة الهواء المتقدمة (Unité FRL - Filtre, Régulateur, Lubrificateur) لتصفية الهواء وتشحيمه',
          family: 'PNU' as const,
          taskIds: ['task-rva-lubrificateur', 'task-rva-manometre'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-distributeur-classique',
          name: 'الموزع النيوماتيكي الكلاسيكي القديم (Distributeur classique) لتوزيع الهواء بالتزامن مع حركة الكامات',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-robinets-pointeau',
          name: 'صمامات التحكم التدريجي المسمارية (Vannes à vis / Robinets pointeau) للتحكم بدقة في سرعة وتدفق الهواء',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-buse-soufflage',
          name: 'نظام طرد الشوائب الموجه (Soufflage de sécurité / Buse d\'air) لتنظيف منطقة الكبس من الرايش بقوة الهواء',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },

        // 6. القابض الميكانيكي / الأومبرياج (Embrayage à Clavette / Mamelon)
        {
          id: 'comp-rva-clavette-tournante',
          name: 'المخلب / الخابور الدوار الداخلي (Clavette Tournante / Pivotante) المعالج حرارياً لنقل وتوصيل عزم الحركة للعمود الرئيسي',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-ressort-embrayage',
          name: 'نابض Mamelon / مخلب الأومبرياج الداخلي (Ressort d\'embrayage) لدفع الخابور للخروج لوضع التعشيق',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-commande-clavette',
          name: 'إصبع التحكم الخارجي (Commande de Clavette / Levier de déclenchement) لفك التعشيق في نهاية الدورة',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-logement-clavette',
          name: 'الحلقة الداخلية للبكرة (Logement de clavette) لنقل العزم الحركي عند دخول المخلب بها',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },

        // 7. منظومة التحكم والتفعيل السفلي (Système Pédale & Vérins d'Activation)
        {
          id: 'comp-rva-pedale-mixte',
          name: 'الدواسة المختلطة (Pédale mixte) للربط الميكانيكي والنيوماتيكي معاً عند قدم المشغل',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-micro-valve-pneumatique',
          name: 'الصمام الهوائي الميكرووي للدواسة (Micro-valve pneumatique) لفتح مجرى هواء بدء التشغيل النبضي',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-distributeur-principal',
          name: 'الموزع النيوماتيكي الرئيسي (Distributeur à commande pneumatique) لتوجيه الهواء لفيلان التعشيق والفرامل',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-verin-embrayage',
          name: 'فيلان التعشيق السفلي (Vérin d\'embrayage pneumatique) لسحب إسفين التحكم وتحرير المخلب',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-ressorts-rappel-pedale',
          name: 'نوابض إرجاع الدواسة (Ressorts de rappel de pédale) لإعادتها لوضعها العلوي فور رفع القدم',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },

        // 8. منظومة التغذية والفرز الاهتزازي (Système d'Alimentation Vibratoire)
        {
          id: 'comp-rva-bol-vibrant',
          name: 'الوعاء الاهتزازي (Bol Vibrant / Bowl Feeder) لترتيب وتوجيه المسامير بمسار صاعد موحد',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-electro-aimant',
          name: 'الملف الكهرومغناطيسي (Électro-aimant) لتوليد نبضات الجذب المغناطيسي المسببة للاهتزاز',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-ressorts-lames',
          name: 'النوابض الورقية (Ressorts à lames) لدعم توجيه الاهتزاز بشكل جبهي صاعد متناسق',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-rail-guidage',
          name: 'سكة التوجيه والناقل (Rail de Guidage / Couloir) لنقل المسامير بالجاذبية نحو التوزيع',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-vibrateur-rail',
          name: 'الهزاز النيوماتيكي للسكة (Vibrateur Pneumatique de rail) لتوليد ذبذبات منع تلاصق وانحشار المسامير',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },

        // 9. منظومة رأس البرشمة والتثبيت وأعمدة الضبط (Tête de Rivetage & Réglage)
        {
          id: 'comp-rva-serre-flan',
          name: 'القطع الأسطوانية المثبتة (Serre-flan / Guide-rivet) لتثبيت الأجزاء ومنع حركتها أثناء شوط المكبس',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-poincon-bouterolle',
          name: 'المكبس الميكانيكي الصلب (Poinçon / Bouterolle) لتشكيل وتجعيد البرشام تحت صدمة ميكانيكية',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-broche-interne',
          name: 'البروش الداخلي للمكبس (Broche interne) لضمان استقامة وشاقولية المسمار ومنع ميله',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-ressorts-tete',
          name: 'زنبركات إرجاع الرأس (Ressorts de rappel de tête) لإعادة المكبس لوضعه العلوي بعد إتمام ضربة الكبس',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-tiges-reglage-hauteur',
          name: 'الأعمدة الملولبة والصواميل (Tiges filetées et Écrous de réglage) لضبط عمق تداخل رأس البرشمة',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-carters-protection',
          name: 'أغطية الأمان والوقاية الجانبية (Carters de protection) لسلامة الفنيين والمشغلين من الأجزاء الدوارة',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },

        // 10. منظومة التغذية الكهربائية والتحكم الكلاسيكي (Système Électrique & Commande)
        {
          id: 'comp-rva-boitier-commande',
          name: 'علبة التشغيل (Boîtier de commande) المحتوية على أزرار البدء والإيقاف الكلاسيكية الطارئة',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-disjoncteur-magneto-thermique',
          name: 'قاطع الحماية الحراري (Disjoncteur Magnéto-thermique) لحماية المحرك من زيادة التيار والأحمال',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-regulateur-bol-vibrant',
          name: 'لوحة التحكم بالاهتزاز (Régulateur du bol vibrant / Potentiomètre) لتعديل قوة الاهتزاز وصعود المسامير',
          family: 'ELN' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },

        // 11. منظومة التزييت والتشحيم المركزي/اليدوي (Système de Lubrification)
        {
          id: 'comp-rva-graisseurs-nipples',
          name: 'نقاط ومنافذ التشحيم (Graisseurs / Nipples) لتوصيل وضخ الشحم للمحاور والتحميل',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva-canaux-lubrification',
          name: 'قنوات تصريف الزيت (Canaux de lubrification) شرايين تزييت مسارات الاحتكاك الداخلي المدمجة للهيكل والعمود الرئيسي',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },

        // 12. منظومة ضبط توقيت التعشيق (Système de Réglage du Point d\'Embrayage)
        {
          id: 'comp-rva-support-verin-reglable',
          name: 'القاعدة القابلة للإزاحة لضبط توقيت كلافيت التعشيق (Support de Vérin Réglable / Coulissant) لضبط نقطة PMH والموضع الميكانيكي الفني الدقيق',
          family: 'MEC' as const,
          taskIds: ['task-rva-vis-reglage'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        }
      ];
//       await db.standardComponents.bulkAdd(rvaComponents);

      const rvaBlueprint = {
        id: 'mchbp-rva-v1',
        templateId: 'tpl-rva',
        reference: 'RIV-RVA-AUTOMATIC-V1',
        brand: 'RivMax',
        model: 'RVA-V1-MECHANICAL',
        powerOrForce: 'Moteur principal: 2.2 kW / Double réduction par engrenages de pignon-couronne lourde',
        energySource: 'Électrique 380V & Pneumatique actif de précision',
        technicalSpecs: `Riveteuse Automatique Classique RVA V1 (Modèle mécanique et pneumatique haute performance).
Comporte une transmission robuste combinée : moteur électrique principal, système de poulies-courroies, et réduction d'engrenage pignon-couronne lourde agissant comme volant d'inertie démultiplié.
Le doigt d'alimentation des rivets est géré par un mécanisme de Bielle-Manivelle (style locomotive à vapeur) coulissant sur un double axe parallèle de guidage linéaire.
Le tambour de frein de précision est équipé de machoires à levier coudé mues par un vérin pneumatique double effet à rappel par ressort robuste.
La gestion temporelle et les signaux d'air sont synchronisés par un plateau à cames réglables qui actionnent des vannes fin de course pneumatiques à galet.
Équipée d'une unité de traitement FRL complète avec manomètre et lubrificateur d'air, de robinets pointeaux de régulation fine, d'une buse de soufflage automatique après impact et d'un protecteur enveloppant robuste.`,
        componentIds: rvaComponents.map(c => c.id),
        createdAt: new Date().toISOString()
      };
      await db.machineBlueprints.add(rvaBlueprint);

      // 6. Map Blueprints to Physical Machines (PDR B.O.M Link)
      const rvaPartMappings = [
        // RVA-01 (V1) Mappings
        { id: 'map-rva01-vep001', machineId: 'mach-RVA01', blueprintId: 'bp-pdr-vep001', addedAt: new Date().toISOString() },
        { id: 'map-rva01-fdc001', machineId: 'mach-RVA01', blueprintId: 'bp-pdr-fdc001', addedAt: new Date().toISOString() },
        { id: 'map-rva01-frl001', machineId: 'mach-RVA01', blueprintId: 'bp-pdr-frl001', addedAt: new Date().toISOString() },
        { id: 'map-rva01-dst001', machineId: 'mach-RVA01', blueprintId: 'bp-pdr-dst001', addedAt: new Date().toISOString() },
        { id: 'map-rva01-jnt001', machineId: 'mach-RVA01', blueprintId: 'bp-pdr-jnt001', addedAt: new Date().toISOString() },
        { id: 'map-rva01-bie001', machineId: 'mach-RVA01', blueprintId: 'bp-pdr-bie001', addedAt: new Date().toISOString() },
        { id: 'map-rva01-pig001', machineId: 'mach-RVA01', blueprintId: 'bp-pdr-pig001', addedAt: new Date().toISOString() },
        { id: 'map-rva01-pig002', machineId: 'mach-RVA01', blueprintId: 'bp-pdr-pig002', addedAt: new Date().toISOString() },
        { id: 'map-rva01-jnt002', machineId: 'mach-RVA01', blueprintId: 'bp-pdr-jnt002', addedAt: new Date().toISOString() },
        { id: 'map-rva01-vib001', machineId: 'mach-RVA01', blueprintId: 'bp-pdr-vib001', addedAt: new Date().toISOString() },

        // RVA-02 (V2) Mappings
        { id: 'map-rva02-vep002', machineId: 'mach-RVA02', blueprintId: 'bp-pdr-vep002', addedAt: new Date().toISOString() },
        { id: 'map-rva02-fdc002', machineId: 'mach-RVA02', blueprintId: 'bp-pdr-fdc002', addedAt: new Date().toISOString() },
        { id: 'map-rva02-fdc003', machineId: 'mach-RVA02', blueprintId: 'bp-pdr-fdc003', addedAt: new Date().toISOString() },
        { id: 'map-rva02-dst002', machineId: 'mach-RVA02', blueprintId: 'bp-pdr-dst002', addedAt: new Date().toISOString() },
        { id: 'map-rva02-frl001', machineId: 'mach-RVA02', blueprintId: 'bp-pdr-frl001', addedAt: new Date().toISOString() },
        { id: 'map-rva02-jnt001', machineId: 'mach-RVA02', blueprintId: 'bp-pdr-jnt001', addedAt: new Date().toISOString() },
        { id: 'map-rva02-bie001', machineId: 'mach-RVA02', blueprintId: 'bp-pdr-bie001', addedAt: new Date().toISOString() },
        { id: 'map-rva02-pig001', machineId: 'mach-RVA02', blueprintId: 'bp-pdr-pig001', addedAt: new Date().toISOString() },
        { id: 'map-rva02-pig002', machineId: 'mach-RVA02', blueprintId: 'bp-pdr-pig002', addedAt: new Date().toISOString() },
        { id: 'map-rva02-jnt002', machineId: 'mach-RVA02', blueprintId: 'bp-pdr-jnt002', addedAt: new Date().toISOString() },
        { id: 'map-rva02-vib001', machineId: 'mach-RVA02', blueprintId: 'bp-pdr-vib001', addedAt: new Date().toISOString() },

        // RVA-03 (V4) Mappings (PLC-based Mechatronics System)
        { id: 'map-rva03-plc001', machineId: 'mach-RVA03', blueprintId: 'bp-pdr-plc001', addedAt: new Date().toISOString() },
        { id: 'map-rva03-var001', machineId: 'mach-RVA03', blueprintId: 'bp-pdr-var001', addedAt: new Date().toISOString() },
        { id: 'map-rva03-cap001', machineId: 'mach-RVA03', blueprintId: 'bp-pdr-cap001', addedAt: new Date().toISOString() },
        { id: 'map-rva03-frl001', machineId: 'mach-RVA03', blueprintId: 'bp-pdr-frl001', addedAt: new Date().toISOString() },
        { id: 'map-rva03-dst002', machineId: 'mach-RVA03', blueprintId: 'bp-pdr-dst002', addedAt: new Date().toISOString() },
        { id: 'map-rva03-jnt001', machineId: 'mach-RVA03', blueprintId: 'bp-pdr-jnt001', addedAt: new Date().toISOString() },
        { id: 'map-rva03-bie001', machineId: 'mach-RVA03', blueprintId: 'bp-pdr-bie001', addedAt: new Date().toISOString() },
        { id: 'map-rva03-pig001', machineId: 'mach-RVA03', blueprintId: 'bp-pdr-pig001', addedAt: new Date().toISOString() },
        { id: 'map-rva03-vib001', machineId: 'mach-RVA03', blueprintId: 'bp-pdr-vib001', addedAt: new Date().toISOString() }
      ];
      await db.machinePartMappings.bulkAdd(rvaPartMappings);

      // RVM-07, RVM-11, RVM-15 (V3) Mappings (Compact High-Torque Mechanical Systems)
      const rvmPartMappings = [
        // RVM-07
        { id: 'map-rvm07-reg004', machineId: 'mach-RVM07', blueprintId: 'bp-pdr-reg004', addedAt: new Date().toISOString() },
        { id: 'map-rvm07-reg005', machineId: 'mach-RVM07', blueprintId: 'bp-pdr-reg005', addedAt: new Date().toISOString() },
        { id: 'map-rvm07-gli002', machineId: 'mach-RVM07', blueprintId: 'bp-pdr-gli002', addedAt: new Date().toISOString() },
        { id: 'map-rvm07-bie002', machineId: 'mach-RVM07', blueprintId: 'bp-pdr-bie002', addedAt: new Date().toISOString() },
        { id: 'map-rvm07-gen001', machineId: 'mach-RVM07', blueprintId: 'bp-pdr-gen001', addedAt: new Date().toISOString() },
        { id: 'map-rvm07-cla002', machineId: 'mach-RVM07', blueprintId: 'bp-pdr-cla002', addedAt: new Date().toISOString() },
        { id: 'map-rvm07-bie003', machineId: 'mach-RVM07', blueprintId: 'bp-pdr-bie003', addedAt: new Date().toISOString() },
        { id: 'map-rvm07-pvt001', machineId: 'mach-RVM07', blueprintId: 'bp-pdr-pvt001', addedAt: new Date().toISOString() },
        { id: 'map-rvm07-bra001', machineId: 'mach-RVM07', blueprintId: 'bp-pdr-bra001', addedAt: new Date().toISOString() },
        { id: 'map-rvm07-bra002', machineId: 'mach-RVM07', blueprintId: 'bp-pdr-bra002', addedAt: new Date().toISOString() },

        // RVM-11
        { id: 'map-rvm11-reg004', machineId: 'mach-RVM11', blueprintId: 'bp-pdr-reg004', addedAt: new Date().toISOString() },
        { id: 'map-rvm11-reg005', machineId: 'mach-RVM11', blueprintId: 'bp-pdr-reg005', addedAt: new Date().toISOString() },
        { id: 'map-rvm11-gli002', machineId: 'mach-RVM11', blueprintId: 'bp-pdr-gli002', addedAt: new Date().toISOString() },
        { id: 'map-rvm11-bie002', machineId: 'mach-RVM11', blueprintId: 'bp-pdr-bie002', addedAt: new Date().toISOString() },
        { id: 'map-rvm11-gen001', machineId: 'mach-RVM11', blueprintId: 'bp-pdr-gen001', addedAt: new Date().toISOString() },
        { id: 'map-rvm11-cla002', machineId: 'mach-RVM11', blueprintId: 'bp-pdr-cla002', addedAt: new Date().toISOString() },
        { id: 'map-rvm11-bie003', machineId: 'mach-RVM11', blueprintId: 'bp-pdr-bie003', addedAt: new Date().toISOString() },
        { id: 'map-rvm11-pvt001', machineId: 'mach-RVM11', blueprintId: 'bp-pdr-pvt001', addedAt: new Date().toISOString() },
        { id: 'map-rvm11-bra001', machineId: 'mach-RVM11', blueprintId: 'bp-pdr-bra001', addedAt: new Date().toISOString() },
        { id: 'map-rvm11-bra002', machineId: 'mach-RVM11', blueprintId: 'bp-pdr-bra002', addedAt: new Date().toISOString() },

        // RVM-15
        { id: 'map-rvm15-reg004', machineId: 'mach-RVM15', blueprintId: 'bp-pdr-reg004', addedAt: new Date().toISOString() },
        { id: 'map-rvm15-reg005', machineId: 'mach-RVM15', blueprintId: 'bp-pdr-reg005', addedAt: new Date().toISOString() },
        { id: 'map-rvm15-gli002', machineId: 'mach-RVM15', blueprintId: 'bp-pdr-gli002', addedAt: new Date().toISOString() },
        { id: 'map-rvm15-bie002', machineId: 'mach-RVM15', blueprintId: 'bp-pdr-bie002', addedAt: new Date().toISOString() },
        { id: 'map-rvm15-gen001', machineId: 'mach-RVM15', blueprintId: 'bp-pdr-gen001', addedAt: new Date().toISOString() },
        { id: 'map-rvm15-cla002', machineId: 'mach-RVM15', blueprintId: 'bp-pdr-cla002', addedAt: new Date().toISOString() },
        { id: 'map-rvm15-bie003', machineId: 'mach-RVM15', blueprintId: 'bp-pdr-bie003', addedAt: new Date().toISOString() },
        { id: 'map-rvm15-pvt001', machineId: 'mach-RVM15', blueprintId: 'bp-pdr-pvt001', addedAt: new Date().toISOString() },
        { id: 'map-rvm15-bra001', machineId: 'mach-RVM15', blueprintId: 'bp-pdr-bra001', addedAt: new Date().toISOString() },
        { id: 'map-rvm15-bra002', machineId: 'mach-RVM15', blueprintId: 'bp-pdr-bra002', addedAt: new Date().toISOString() },

        // RVM-03
        { id: 'map-rvm03-reg004', machineId: 'mach-RVM03', blueprintId: 'bp-pdr-reg004', addedAt: new Date().toISOString() },
        { id: 'map-rvm03-reg005', machineId: 'mach-RVM03', blueprintId: 'bp-pdr-reg005', addedAt: new Date().toISOString() },
        { id: 'map-rvm03-gli002', machineId: 'mach-RVM03', blueprintId: 'bp-pdr-gli002', addedAt: new Date().toISOString() },
        { id: 'map-rvm03-bie002', machineId: 'mach-RVM03', blueprintId: 'bp-pdr-bie002', addedAt: new Date().toISOString() },
        { id: 'map-rvm03-gen001', machineId: 'mach-RVM03', blueprintId: 'bp-pdr-gen001', addedAt: new Date().toISOString() },
        { id: 'map-rvm03-cla002', machineId: 'mach-RVM03', blueprintId: 'bp-pdr-cla002', addedAt: new Date().toISOString() },
        { id: 'map-rvm03-bie003', machineId: 'mach-RVM03', blueprintId: 'bp-pdr-bie003', addedAt: new Date().toISOString() },
        { id: 'map-rvm03-pvt001', machineId: 'mach-RVM03', blueprintId: 'bp-pdr-pvt001', addedAt: new Date().toISOString() },
        { id: 'map-rvm03-bra001', machineId: 'mach-RVM03', blueprintId: 'bp-pdr-bra001', addedAt: new Date().toISOString() },
        { id: 'map-rvm03-bra002', machineId: 'mach-RVM03', blueprintId: 'bp-pdr-bra002', addedAt: new Date().toISOString() }
      ];
      await db.machinePartMappings.bulkAdd(rvmPartMappings);

      const detPartMappings = [
        // DET-11 Mappings (V3)
        { id: 'map-det11-roc001', machineId: 'mach-DET11', blueprintId: 'bp-pdr-roc001', addedAt: new Date().toISOString() },
        { id: 'map-det11-flt001', machineId: 'mach-DET11', blueprintId: 'bp-pdr-flt001', addedAt: new Date().toISOString() },
        { id: 'map-det11-jnt003', machineId: 'mach-DET11', blueprintId: 'bp-pdr-jnt003', addedAt: new Date().toISOString() },
        { id: 'map-det11-reg006', machineId: 'mach-DET11', blueprintId: 'bp-pdr-reg006', addedAt: new Date().toISOString() },
        { id: 'map-det11-cap002', machineId: 'mach-DET11', blueprintId: 'bp-pdr-cap002', addedAt: new Date().toISOString() },
        { id: 'map-det11-gli003', machineId: 'mach-DET11', blueprintId: 'bp-pdr-gli003', addedAt: new Date().toISOString() },

        // DET-04 Mappings (V4)
        { id: 'map-det04-roc001', machineId: 'mach-DET04', blueprintId: 'bp-pdr-roc001', addedAt: new Date().toISOString() },
        { id: 'map-det04-rac001', machineId: 'mach-DET04', blueprintId: 'bp-pdr-rac001', addedAt: new Date().toISOString() },
        { id: 'map-det04-flt001', machineId: 'mach-DET04', blueprintId: 'bp-pdr-flt001', addedAt: new Date().toISOString() },
        { id: 'map-det04-jnt003', machineId: 'mach-DET04', blueprintId: 'bp-pdr-jnt003', addedAt: new Date().toISOString() },
        { id: 'map-det04-reg006', machineId: 'mach-DET04', blueprintId: 'bp-pdr-reg006', addedAt: new Date().toISOString() },
        { id: 'map-det04-cap002', machineId: 'mach-DET04', blueprintId: 'bp-pdr-cap002', addedAt: new Date().toISOString() },
        { id: 'map-det04-gli003', machineId: 'mach-DET04', blueprintId: 'bp-pdr-gli003', addedAt: new Date().toISOString() },

        // DET-05 Mappings (V4)
        { id: 'map-det05-roc001', machineId: 'mach-DET05', blueprintId: 'bp-pdr-roc001', addedAt: new Date().toISOString() },
        { id: 'map-det05-rac001', machineId: 'mach-DET05', blueprintId: 'bp-pdr-rac001', addedAt: new Date().toISOString() },
        { id: 'map-det05-flt001', machineId: 'mach-DET05', blueprintId: 'bp-pdr-flt001', addedAt: new Date().toISOString() },
        { id: 'map-det05-jnt003', machineId: 'mach-DET05', blueprintId: 'bp-pdr-jnt003', addedAt: new Date().toISOString() },
        { id: 'map-det05-reg006', machineId: 'mach-DET05', blueprintId: 'bp-pdr-reg006', addedAt: new Date().toISOString() },
        { id: 'map-det05-cap002', machineId: 'mach-DET05', blueprintId: 'bp-pdr-cap002', addedAt: new Date().toISOString() },
        { id: 'map-det05-gli003', machineId: 'mach-DET05', blueprintId: 'bp-pdr-gli003', addedAt: new Date().toISOString() },

        // DET-08 Mappings (V4)
        { id: 'map-det08-roc001', machineId: 'mach-DET08', blueprintId: 'bp-pdr-roc001', addedAt: new Date().toISOString() },
        { id: 'map-det08-rac001', machineId: 'mach-DET08', blueprintId: 'bp-pdr-rac001', addedAt: new Date().toISOString() },
        { id: 'map-det08-flt001', machineId: 'mach-DET08', blueprintId: 'bp-pdr-flt001', addedAt: new Date().toISOString() },
        { id: 'map-det08-jnt003', machineId: 'mach-DET08', blueprintId: 'bp-pdr-jnt003', addedAt: new Date().toISOString() },
        { id: 'map-det08-reg006', machineId: 'mach-DET08', blueprintId: 'bp-pdr-reg006', addedAt: new Date().toISOString() },
        { id: 'map-det08-cap002', machineId: 'mach-DET08', blueprintId: 'bp-pdr-cap002', addedAt: new Date().toISOString() },
        { id: 'map-det08-gli003', machineId: 'mach-DET08', blueprintId: 'bp-pdr-gli003', addedAt: new Date().toISOString() },

        // DET-09 Mappings (V4)
        { id: 'map-det09-roc001', machineId: 'mach-DET09', blueprintId: 'bp-pdr-roc001', addedAt: new Date().toISOString() },
        { id: 'map-det09-rac001', machineId: 'mach-DET09', blueprintId: 'bp-pdr-rac001', addedAt: new Date().toISOString() },
        { id: 'map-det09-flt001', machineId: 'mach-DET09', blueprintId: 'bp-pdr-flt001', addedAt: new Date().toISOString() },
        { id: 'map-det09-jnt003', machineId: 'mach-DET09', blueprintId: 'bp-pdr-jnt003', addedAt: new Date().toISOString() },
        { id: 'map-det09-reg006', machineId: 'mach-DET09', blueprintId: 'bp-pdr-reg006', addedAt: new Date().toISOString() },
        { id: 'map-det09-cap002', machineId: 'mach-DET09', blueprintId: 'bp-pdr-cap002', addedAt: new Date().toISOString() },
        { id: 'map-det09-gli003', machineId: 'mach-DET09', blueprintId: 'bp-pdr-gli003', addedAt: new Date().toISOString() },

        // DET-01 Mappings
        { id: 'map-det01-roc001', machineId: 'mach-DET01', blueprintId: 'bp-pdr-roc001', addedAt: new Date().toISOString() },
        { id: 'map-det01-rac001', machineId: 'mach-DET01', blueprintId: 'bp-pdr-rac001', addedAt: new Date().toISOString() },
        { id: 'map-det01-frn001', machineId: 'mach-DET01', blueprintId: 'bp-pdr-frn001', addedAt: new Date().toISOString() },
        { id: 'map-det01-dst003', machineId: 'mach-DET01', blueprintId: 'bp-pdr-dst003', addedAt: new Date().toISOString() },
        { id: 'map-det01-flt001', machineId: 'mach-DET01', blueprintId: 'bp-pdr-flt001', addedAt: new Date().toISOString() },
        { id: 'map-det01-jnt003', machineId: 'mach-DET01', blueprintId: 'bp-pdr-jnt003', addedAt: new Date().toISOString() },
        { id: 'map-det01-reg006', machineId: 'mach-DET01', blueprintId: 'bp-pdr-reg006', addedAt: new Date().toISOString() },
        { id: 'map-det01-cap002', machineId: 'mach-DET01', blueprintId: 'bp-pdr-cap002', addedAt: new Date().toISOString() },
        { id: 'map-det01-gli003', machineId: 'mach-DET01', blueprintId: 'bp-pdr-gli003', addedAt: new Date().toISOString() },

        // DET-03 Mappings
        { id: 'map-det03-roc001', machineId: 'mach-DET03', blueprintId: 'bp-pdr-roc001', addedAt: new Date().toISOString() },
        { id: 'map-det03-rac001', machineId: 'mach-DET03', blueprintId: 'bp-pdr-rac001', addedAt: new Date().toISOString() },
        { id: 'map-det03-frn001', machineId: 'mach-DET03', blueprintId: 'bp-pdr-frn001', addedAt: new Date().toISOString() },
        { id: 'map-det03-dst003', machineId: 'mach-DET03', blueprintId: 'bp-pdr-dst003', addedAt: new Date().toISOString() },
        { id: 'map-det03-flt001', machineId: 'mach-DET03', blueprintId: 'bp-pdr-flt001', addedAt: new Date().toISOString() },
        { id: 'map-det03-jnt003', machineId: 'mach-DET03', blueprintId: 'bp-pdr-jnt003', addedAt: new Date().toISOString() },
        { id: 'map-det03-reg006', machineId: 'mach-DET03', blueprintId: 'bp-pdr-reg006', addedAt: new Date().toISOString() },
        { id: 'map-det03-cap002', machineId: 'mach-DET03', blueprintId: 'bp-pdr-cap002', addedAt: new Date().toISOString() },
        { id: 'map-det03-gli003', machineId: 'mach-DET03', blueprintId: 'bp-pdr-gli003', addedAt: new Date().toISOString() },

        // DET-06 Mappings
        { id: 'map-det06-roc001', machineId: 'mach-DET06', blueprintId: 'bp-pdr-roc001', addedAt: new Date().toISOString() },
        { id: 'map-det06-rac001', machineId: 'mach-DET06', blueprintId: 'bp-pdr-rac001', addedAt: new Date().toISOString() },
        { id: 'map-det06-frn001', machineId: 'mach-DET06', blueprintId: 'bp-pdr-frn001', addedAt: new Date().toISOString() },
        { id: 'map-det06-dst003', machineId: 'mach-DET06', blueprintId: 'bp-pdr-dst003', addedAt: new Date().toISOString() },
        { id: 'map-det06-flt001', machineId: 'mach-DET06', blueprintId: 'bp-pdr-flt001', addedAt: new Date().toISOString() },
        { id: 'map-det06-jnt003', machineId: 'mach-DET06', blueprintId: 'bp-pdr-jnt003', addedAt: new Date().toISOString() },
        { id: 'map-det06-reg006', machineId: 'mach-DET06', blueprintId: 'bp-pdr-reg006', addedAt: new Date().toISOString() },
        { id: 'map-det06-cap002', machineId: 'mach-DET06', blueprintId: 'bp-pdr-cap002', addedAt: new Date().toISOString() },
        { id: 'map-det06-gli003', machineId: 'mach-DET06', blueprintId: 'bp-pdr-gli003', addedAt: new Date().toISOString() }
      ];
      await db.machinePartMappings.bulkAdd(detPartMappings);

      // SAT-V2 Part Mappings for machines SAT-13, 17, 21, 25, 26, 27, 36, 41
      const sat2PartMappings = [];
      const sat2MachineIds = ['mach-SAT13', 'mach-SAT17', 'mach-SAT21', 'mach-SAT25', 'mach-SAT26', 'mach-SAT27', 'mach-SAT36', 'mach-SAT41'];
      const sat2BlueprintIds = ['bp-pdr-roc001', 'bp-pdr-rac001', 'bp-pdr-frn001', 'bp-pdr-dst003'];

      for (const machineId of sat2MachineIds) {
        for (const blueprintId of sat2BlueprintIds) {
          const suffix = blueprintId.split('-').pop(); // e.g. 'roc001'
          const machNum = machineId.replace('mach-SAT', ''); // e.g. '13'
          sat2PartMappings.push({
            id: `map-sat${machNum}-${suffix}`,
            machineId,
            blueprintId,
            addedAt: new Date().toISOString()
          });
        }
      }
      await db.machinePartMappings.bulkAdd(sat2PartMappings);

      console.log('[SandboxSeeder] Added RVA (Riveteuse) & RVM V3 Family, Template, Blueprints, linked PDR Stocks & BOM mappings.');

      // -------------------------------------------------------------
      // Create RVA V2 Components & Blueprint (RIV-RVA-AUTOMATIC-V2)
      // -------------------------------------------------------------
      const rvaComponentsV2 = [
        // 1. منظومة نقل الحركة الثقيلة والتخفيض المزدوج (Système de Transmission & Réduction)
        {
          id: 'comp-rva2-moteur-principal',
          name: 'المحرك الميكانيكي الرئيسي (Moteur Principal) - محرك تيار مستمر مصدر الطاقة',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-poulies-courroies',
          name: 'بكرة السيور المبدئية (Poulie-Courroie SPZ1950) لنقل وتخفيض السرعة',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-pignon-primaire',
          name: 'الترس القائد الصغير (Pignon) المعالج حرارياً لنقل عزم الدوران',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-couronne-grand-pignon',
          name: 'الترس الكبير والثقيل (Couronne / Grand Pignon) حدافة الموازنة لتخزين طاقة الكبس',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-volant-reglage-manuel',
          name: 'عجلة التدوير اليدوي للأمان (Volant de réglage manuel) لمعايرة مسار الشوط والتأكد من خلوه',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-roulements-axes',
          name: 'كراسي التحميل والمحاور (Roulements & Axes 6205 & 33205) لدعم وتوجيه الأجزاء الدوارة والعمودية',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },

        // 2. آلية دفع اللسان المطورة (Système Bielle-Manivelle - "القطار البخاري")
        {
          id: 'comp-rva2-bielle-manivelle',
          name: 'ذراع التوصيل والكرنك (Bielle-Manivelle) لتحويل الحركة الدوارة إلى حركة خطية تردديّة',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-guides-lineaires',
          name: 'قضبان التوجيه المتوازية (Guides Linéaires / 2 Axes parallèles) لمنع أي انحراف جانبي',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-doigt-reglable',
          name: 'اللسان القابل لضبط الطول (Doigt d\'alimentation réglable) لضبط دقة دفع مسمار البرشام',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },

        // 3. قرص التحكم والفرملة الهوائي الذكي (Disque à Cames Réglables)
        {
          id: 'comp-rva2-plateau-cames-reglables',
          name: 'قرص التحكم المزدوج (Plateau à cames) كقاعدة لتثبيت كامات التوقيت وكسطح احتكاك للفرملة',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-bossages-cames',
          name: 'رؤوس الكامّات القابلة للتعديل (Cames réglables) لتغيير توقيت فتح وإغلاق صمامات الهواء',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-valves-fin-course-pneu',
          name: 'حساسات الشوط الهوائية للقرص (Fin de course pneumatique à galet) لتوجيه الإشارات النيوماتيكية',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-machoires-frein-levier-coude',
          name: 'ذراع الفرملة المقوس (Mâchoires de frein coudé) المبطن بقماش احتكاك عالي للكبح الفوري',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-verin-frein-double',
          name: 'فيلان الفرامل المزدوج والزنبرك (Vérin de frein & Ressort) لتحرير وكبح القرص بدقة',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },

        // 4. منظومة الفرز والتوزيع النيوماتيكية المحدثة (Système de Distribution Pneumatique Moteur)
        {
          id: 'comp-rva2-verin-rotatif',
          name: 'الفيران الدوراني النيوماتيكي (Vérin Rotatif / Actuateur) لتدوير قرص الفرز بشكل تبادلي لليمين واليسار لتجهيز المسمار',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-butees-angle',
          name: 'قاعدة تعديل زوايا الدوران (Butées de réglage d\'angle) لضبط زاوية دوران قرص الفرز بدقة (45 أو 90 درجة)',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-fdc-interne-galet',
          name: 'حساس نهاية الشوط النيوماتيكي الداخلي لللسان (Valve fin de course pneumatique à galet interne) لتسريع التغذية التلقائية فور رجوع اللسان',
          family: 'PNU' as const,
          taskIds: ['task-rva-fdc-interne-vis'],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-biellettes-liaison',
          name: 'روافع التوصيل الميكانيكية الترددية (Biellettes de liaison au vérin rotatif) لنقل حركة الفيران الدائري لقرص الفرز',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-axes-reglage-rail',
          name: 'محاور ضبط السكة الجانبية (Axes de réglage de rail / Coulisse) للتحكم في خلوص وعرض سكة التوجيه',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },

        // 5. لوحة إدارة الهواء المطورة ونظام التنظيف (Système Pneumatique Moderne & Soufflage)
        {
          id: 'comp-rva2-frl',
          name: 'مجموعة معالجة الهواء المتقدمة (Unité FRL - Filtre, Régulateur, Lubrificateur) لتصفية الهواء وتزييته',
          family: 'PNU' as const,
          taskIds: ['task-rva-lubrificateur', 'task-rva-manometre'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-distributeur-hp',
          name: 'الموزع النيوماتيكي عالي الأداء المجدد (Distributeur Haute Performance) لضمان صبيب هواء قوي ومستقر لجميع الفيرانات معاً',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-robinets-pointeau',
          name: 'صمامات التحكم التدريجي المسمارية (Vannes à vis / Robinets pointeau) للتحكم بدقة في سرعة وتدفق الهواء لخطوط الحركة',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-buse-soufflage',
          name: 'نظام طرد الشوائب الموجه (Soufflage de sécurité / Buse d\'air) لتنظيف منطقة الكبس من الرايش بقوة الهواء',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },

        // 6. القابض الميكانيكي / الأومبرياج (Embrayage à Clavette / Mamelon)
        {
          id: 'comp-rva2-clavette-tournante',
          name: 'المخلب / الخابور الدوار الداخلي (Clavette Tournante / Pivotante) المعالج حرارياً لنقل وتوصيل عزم الحركة للعمود الرئيسي',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-ressort-embrayage',
          name: 'نابض Mamelon / مخلب الأومبرياج الداخلي (Ressort d\'embrayage) لدفع الخابور للخروج لوضع التعشيق',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-commande-clavette',
          name: 'إصبع التحكم الخارجي (Commande de Clavette / Levier de déclenchement) لفك التعشيق في نهاية الدورة',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-logement-clavette',
          name: 'الحلقة الداخلية للبكرة (Logement de clavette) لنقل العزم الحركي عند دخول المخلب بها',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },

        // 7. منظومة التحكم والتفعيل السفلي (Système Pédale Pneumatique Pure & Vérins)
        {
          id: 'comp-rva2-pedale-pneumatique',
          name: 'الدواسة النيوماتيكية بالكامل (Pédale pneumatique pure) كصمام هوائي خالص يرسل إشارة تحرير فورية بدون روافع ميكانيكية',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-micro-valve-pneu',
          name: 'الصمام الهوائي الميكرووي للدواسة (Micro-valve pneumatique) لفتح مجرى هواء بدء التشغيل النبضي بدقة',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-distributeur-principal',
          name: 'الموزع النيوماتيكي الرئيسي للتحكم (Distributeur principal à commande pneumatique) لتوجيه هواء تفعيل فيلان التعشيق والفرامل',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-verin-embrayage',
          name: 'فيلان التعشيق السفلي (Vérin d\'embrayage pneumatique) لسحب إسفين التحكم وتحرير المخلب',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-ressorts-rappel-pedale',
          name: 'نوابض إرجاع الدواسة الهوائية (Ressorts de rappel de pédale) لإعادتها لوضعها العلوي فور رفع القدم',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },

        // 8. منظومة التغذية والفرز الاهتزازي (Système d'Alimentation Vibratoire)
        {
          id: 'comp-rva2-bol-vibrant',
          name: 'الوعاء الاهتزازي (Bol Vibrant / Bowl Feeder) لترتيب وتوجيه المسامير بمسار صاعد موحد',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-electro-aimant',
          name: 'الملف الكهرومغناطيسي (Électro-aimant) لتوليد نبضات الجذب المغناطيسي المسببة للاهتزاز',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-ressorts-lames',
          name: 'النوابض الورقية (Ressorts à lames) لدعم توجيه الاهتزاز بشكل جبهي صاعد متناسق',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-rail-guidage',
          name: 'سكة التوجيه والناقل (Rail de Guidage / Couloir) لنقل المسامير بالجاذبية نحو التوزيع',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-vibrateur-rail',
          name: 'الهزاز النيوماتيكي للسكة (Vibrateur Pneumatique de rail) لتوليد ذبذبات منع تلاصق وانحشار المسامير',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },

        // 9. منظومة رأس البرشمة والتثبيت وأعمدة الضبط (Tête de Rivetage & Réglage)
        {
          id: 'comp-rva2-serre-flan',
          name: 'القطع الأسطوانية المثبتة (Serre-flan / Guide-rivet) لتثبيت الأجزاء ومنع حركتها أثناء شوط المكبس',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-poincon-bouterolle',
          name: 'المكبس الميكانيكي الصلب (Poinçon / Bouterolle) لتشكيل وتجعيد البرشام تحت صدمة ميكانيكية',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-broche-interne',
          name: 'البروش الداخلي للمكبس (Broche interne) لضمان استقامة وشاقولية المسمار ومنع ميله',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-ressorts-tete',
          name: 'زنبركات إرجاع الرأس (Ressorts de rappel de tête) لإعادة المكبس لوضعه العلوي بعد إتمام ضربة الكبس',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-tiges-reglage-hauteur',
          name: 'الأعمدة الملولبة والصواميل (Tiges filetées et Écrous de réglage) لضبط عمق تداخل رأس البرشمة',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-carters-protection',
          name: 'أغطية الأمان والوقاية الجانبية (Carters de protection) لسلامة الفنيين والمشغلين من الأجزاء الدوارة',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },

        // 10. منظومة التغذية الكهربائية والتحكم الكلاسيكي (Système Électrique & Commande)
        {
          id: 'comp-rva2-boitier-commande',
          name: 'علبة التشغيل (Boîtier de commande) المحتوية على أزرار البدء والإيقاف الكلاسيكية الطارئة',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-disjoncteur-magneto-thermique',
          name: 'قاطع الحماية الحراري (Disjoncteur Magnéto-thermique) لحماية المحرك من زيادة التيار والأحمال',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-regulateur-bol-vibrant',
          name: 'لوحة التحكم بالاهتزاز (Régulateur du bol vibrant / Potentiomètre) لتعديل قوة الاهتزاز وصعود المسامير',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },

        // 11. منظومة التزييت والتشحيم المركزي/اليدوي (Système de Lubrification)
        {
          id: 'comp-rva2-graisseurs-nipples',
          name: 'نقاط ومنافذ التشحيم (Graisseurs / Nipples) لتوصيل وضخ الشحم للمحاور والتحميل',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva2-canaux-lubrification',
          name: 'قنوات تصريف الزيت (Canaux de lubrification) شرايين تزييت مسارات الاحتكاك الداخلي المدمجة للهيكل والعمود الرئيسي',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },

        // 12. منظومة ضبط توقيت التعشيق (Système de Réglage du Point d'Embrayage)
        {
          id: 'comp-rva2-support-verin-reglable',
          name: 'القاعدة القابلة للإزاحة لضبط توقيت كلافيت التعشيق (Support de Vérin Réglable / Coulissant) لضبط نقطة PMH والموضع الميكانيكي الفني الدقيق',
          family: 'MEC' as const,
          taskIds: ['task-rva-vis-reglage'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        }
      ];
//       await db.standardComponents.bulkAdd(rvaComponentsV2);

      const rvaBlueprintV2 = {
        id: 'mchbp-rva-v2',
        templateId: 'tpl-rva',
        reference: 'RIV-RVA-AUTOMATIC-V2',
        brand: 'RivMax',
        model: 'RVA-V2-SMART-PNEUMATIC',
        powerOrForce: 'Moteur central continu: 3.7 kW / Réduction par couronne d\'inertie lourde',
        energySource: 'Électrique 380V & Pneumatique 6 bar de précision',
        technicalSpecs: `Riveteuse Automatique de Deuxième Génération RVA V2 (Version haute performance et synchro pneumatique).
Comprend un moteur continu à haut rendement couplé à un réducteur d'entraînement pignon-couronne lourde agissant comme volant d'inertie surpuissant pour multiplier l'effort d'impact.
Équipée d'un volant de réglage manuel d'alignement à gauche pour les réglages de course morte sécurisés.
Le mécanisme bielle-manivelle entraîne horizontalement le doigt d'alimentation sur deux axes de guidage linéaire parallèles.
Disque de frein et de commande à cames et bossages réglables actionnant directement des vannes pneumatiques à galet fin de course.
Système de tri et distribution alterné par actuateur/vérin rotatif indexant un disque de sélection de rivets, déclenché automatiquement lors du retour arrière du doigt d'alimentation.
Panneau de commande pneumatique à vanne d'isolement générale FRL et vis pointeaux de réglage indépendant.
Comprend un jet de soufflage automatique de sécurité pour rejeter les copeaux et impuretés après chaque cycle de rivetage.`,
        componentIds: rvaComponentsV2.map(c => c.id),
        createdAt: new Date().toISOString()
      };
      await db.machineBlueprints.add(rvaBlueprintV2);

      console.log('[SandboxSeeder] Added RVA V2 Blueprint and components.');

      // -------------------------------------------------------------
      // Create RVA V4 Components & Blueprint (RIV-RVA-MECHATRONIC-V4)
      // -------------------------------------------------------------
      const rvaComponentsV4 = [
        // 1. منظومة التحكم الذكي والأتمتة الرقمية (نظام رقم 1 - تحديث جذري)
        {
          id: 'comp-rva4-plc',
          name: 'جهاز الـ PLC (العقل الإلكتروني للآلة / Automate Programmable) لإدارة مؤقتات ودورة الآلة بالميلي ثانية',
          family: 'ELE' as const,
          taskIds: ['task-rva4-plc-check'],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva4-hmi',
          name: 'شاشة التحكم الصغيرة بالأزرار (IHM / Operator Panel) لضبط البارامترات والتحكم بالدورة',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rva4-counter',
          name: 'عداد الضربات الرقمي المدمج كودياً (Compteur de Cycles Numérique) لتسجيل مستمر للمنتجات والأعطال',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },

        // 2. منظومة إدارة وعزم المحرك (نظام رقم 2 - تحديث إلكتروني)
        {
          id: 'comp-rva4-moteur',
          name: 'المحرك الكهربائي الرئيسي لآلة البرشمة (Moteur Électrique Principal) الموفر للطاقة الدائري',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        }
      ];
//       await db.standardComponents.bulkAdd(rvaComponentsV4);

      const rvaBlueprintV4 = {
        id: 'mchbp-rva-v4',
        templateId: 'tpl-rva',
        reference: 'RIV-RVA-MECHATRONIC-V4',
        brand: 'RivMax',
        model: 'RVA-V4-MECHATRONICS',
        powerOrForce: 'Moteur central asynchrone: 4.0 kW + Variateur Inverter / Couple élevé',
        energySource: 'Électrique 380V & Contrôle 24V DC / Pneumatique 6 bar contrôlé par électrovannes',
        technicalSpecs: `Riveteuse Automatique de Quatrième Génération RVA-V4 (Système Mécatronique Intelligent).
Intègre un automate programmable PLC régulant la synchronisation temporelle fine et les boucles de sécurité complexes au millième de seconde.
Moteur d'entraînement asynchrone piloté par variateur de fréquence dynamique permettant l'adaptation du couple aux épaisseurs de rivetage.
Élimination intégral du système d'embrayage mécanique à clavette au profit d'un ensemble frein-embrayage pneumatique à friction Ferodo à commande électro-pneumatique 24V.
Pupitre de commande avec interface operator HMI à touches physiques et afficheur de compteur de coups.
Capteurs de proximité inductifs étanches IP67 remplaçant les anciens distributeurs pneumatiques à galet.
Jet de soufflage temporisé après chaque rivetage géré par temporisation programmable interne au PLC pour assurer la propreté continue de la matrice.`,
        componentIds: rvaComponentsV4.map(c => c.id),
        createdAt: new Date().toISOString()
      };
      await db.machineBlueprints.add(rvaBlueprintV4);

      console.log('[SandboxSeeder] Added RVA V4 Blueprint and components.');

      // -------------------------------------------------------------
      // Create RVM Components & Blueprint (RVM-V1-01)
      // -------------------------------------------------------------
      // -------------------------------------------------------------
      // Create RVM Components & Blueprint (RVM-V1-01)
      // -------------------------------------------------------------
      const rvmComponents = [
        // 1. منظومة الطاقة وشد السيور (Propulsion & Tension)
        {
          id: 'comp-rvm-moteur',
          name: 'المحرك الكهربائي الصغير (Moteur Électrique Petit) - مصدر الحركة الرئيسي المثبت خلف الآلة',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm-tendeur',
          name: 'طاولة المحرك المتحركة (Support Moteur Réglable / Tendeur) - لضبط شد السيور يدوياً ومنع الانزلاق وتآكل الرولمانات',
          family: 'MEC' as const,
          taskIds: ['task-rvm-tendeur'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm-poulie',
          name: 'بكرة المحرك الصغيرة (Poulie Moteur) لنقل الحركة الابتدائية',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm-courroies',
          name: 'السيور الناقلة للحركة (Courroies) بين المحرك والطارة الكبيرة',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm-volant',
          name: 'العجلة الكبيرة الثقيلة حدافة الموازنة (Volant d\'Inertie) لتخزين الطاقة الحركية وتوفير قوة الصدمة',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },

        // 2. منظومة التعشيق والمخلب الميكانيكي (Embrayage à Clavette)
        {
          id: 'comp-rvm-clavette',
          name: 'المخلب الداخلي (Clavette Tournante) - الخابور الميكانيكي للتعشيق بالدوران لتوليد الضربة الكبسية',
          family: 'MEC' as const,
          taskIds: ['task-rvm-lubrification'],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm-commande-clavette',
          name: 'إصبع التحكم الخارجي (Commande de Clavette) لإمساك وتحرير المخلب الميكانيكي',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm-ressort-embrayage',
          name: 'نابض المخلب (Ressort d\'Embrayage) لدفع المخلب فور تحريره وبدء ضربة الكبس السريعة',
          family: 'MEC' as const,
          taskIds: ['task-rvm-ressorts'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },

        // 3. منظومة الدواسة والقضيب الميكانيكي (Pédale & Tringlerie)
        {
          id: 'comp-rvm-pedale',
          name: 'الدواسة الميكانيكية البسيطة (Pédale Mécanique) للتشغيل اليدوي المباشر بالقدم',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm-tringlerie',
          name: 'القضيب المعدني الناقل (Tige de Commande / Tringlerie) لنقل حركة الدواسة وتحرير المخلب علوياً',
          family: 'MEC' as const,
          taskIds: ['task-rvm-lubrification'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm-ressorts-rappel',
          name: 'نوابض الإرجاع (Ressorts de Rappel) - تضمن عودة الدواسة والعمود ومنع الصدمات العشوائية المزدوجة',
          family: 'MEC' as const,
          taskIds: ['task-rvm-ressorts'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },

        // 4. منظومة تحويل الحركة الميكانيكية (Bielle-Manivelle)
        {
          id: 'comp-rvm-arbre',
          name: 'العمود الأفقي الممتد (Arbre Principal) - ينقل الحركة الدائرية من الطارة إلى آلية الكبس',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm-bielle',
          name: 'آلية ذراع التوصيل والتدوير (Système Bielle-Manivelle) تحويل الحركة الدائرية لكبس عمودي',
          family: 'MEC' as const,
          taskIds: ['task-rvm-lubrification'],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },

        // 5. منظومة رأس البرشمة والمكبس (Tête de Rivetage & Poinçon)
        {
          id: 'comp-rvm-poincon',
          name: 'المكبس الميكانيكي والسنبك (Poinçon / Bouterolle) - الأداة العلوية النازلة لبرشمة وتشكيل رأس البرشام',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm-enclume',
          name: 'منقار التثبيت اليدوي (Enclume / Support de Rivet) - الفك السفلي الثابت لحمل القطعة المراد برشمتها',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },

        // 6. الهيكل والدعم الميكانيكي (Bâti en Fonte)
        {
          id: 'comp-rvm-bati',
          name: 'الهيكل الثقيل القائم الذاتي (Bâti autoporteur en fonte lourde) - يمتص الاهتزازات القوية الناتجة عن الصدمات الميكانيكية',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },

        // 7. منظومة التحكم الكهربائي الكلاسيكية (Tableau Électrique)
        {
          id: 'comp-rvm-boutons-moteur',
          name: 'أزرار التشغيل والإيقاف (Boutons Marche/Arrêt) - تشغيل وإيقاف يدوي بسيط للمحرك الكهربائي الرئيسي',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm-contacteur',
          name: 'الكونتاكتور الكهربائي (Contacteur TeSys D) - لفتح وغلق دوائر الطاقة للمحرك لحمايته من الهبوط المفاجئ للجهد',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm-relais-thermique',
          name: 'الروليه الحراري (Relais Thermique / Surcharge) - جهاز الحماية الموصول بالكونتاكتور لقطع الكهرباء عند الحمل الزائد',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },

        // 8. منظومة الحماية وأغطية الأمان (Carter de Sécurité)
        {
          id: 'comp-rvm-carter-protection',
          name: 'غطاء الحماية الشامل (Carter de protection) - غطاء معدني صلب يغطي العجلة الكبيرة والسيور وبكرة المحرك بالكامل لضمان معايير السلامة',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },

        // 9. نظام ضبط شوط المكبس والمعايرة (Système de Réglage de Course)
        {
          id: 'comp-rvm-tige-filetee',
          name: 'عمود التوصيل الملولب (Tige Filetée de Bielle) - لضبط ارتفاع المكبس العلوي بدقة',
          family: 'MEC' as const,
          taskIds: ['task-rvm-reglage-course'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm-contre-ecrou',
          name: 'صمولة الضبط وصمولة القفل (Contre-écrou de blocage) - لتأمين وتثبيت طول عمود الشوط ومنع ارتخائه بسبب الاهتزازات',
          family: 'MEC' as const,
          taskIds: ['task-rvm-reglage-course'],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm-vis-reglage-enclume',
          name: 'براغي ضبط القاعدة/الفك السفلي (Vis de réglage d\'enclume) - لتعديل المسافة الفاصلة بينه وبين المكبس العلوي حسب سمك الأواني',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        }
      ];
//       await db.standardComponents.bulkAdd(rvmComponents);

      const rvmComponentsV2 = [
        // 1. منظومة الطاقة وشد السيور (Propulsion & Tension RVM-V2)
        {
          id: 'comp-rvm2-moteur',
          name: 'المحرك الكهربائي الأكبر والأقوى للـ V2 (Moteur Électrique Renforcé 2.2kW) - لتدوير طارة الموازنة الأضخم والأثقل',
          family: 'ELE' as const,
          taskIds: ['task-rvm-v2-contacteur'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm2-tendeur',
          name: 'طاولة المحرك المتحركة الثقيلة (Support Moteur Réglable renforcé / Tendeur) - لضبط شد السيور السميكة فئة B ومنع الانزلاق والتآكل',
          family: 'MEC' as const,
          taskIds: ['task-rvm-tendeur'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm2-poulie',
          name: 'بكرة المحرك الكبيرة (Grande Poulie Moteur) لنقل الحركة ومقاومة العزم الميكانيكي العالي للـ V2',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm2-courroies',
          name: 'السيور الناقلة السميكة فئة B (Courroies Renforcées Type B) - لتحمل العزم العالي دون انزلاق بين المحرك والطارة',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm2-volant',
          name: 'طارة الموازنة الأضخم والأثقل (Grand Volant d\'Inertie surélevé RVM-V2) لتخزين طاقة حركية هائلة ومضاعفة قوة الصدم',
          family: 'MEC' as const,
          taskIds: ['task-rvm-v2-lubrification-intensive'],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },

        // 2. منظومة التعشيق والمخلب الميكانيكي (Embrayage à Clavette RVM-V2)
        {
          id: 'comp-rvm2-clavette',
          name: 'خابور تعشيق أضخم ومعالج حرارياً (Clavette Tournante Renforcée) ليتحمل صدمة شبك الطارة الكبيرة الضخمة للـ V2',
          family: 'MEC' as const,
          taskIds: ['task-rvm-v2-lubrification-intensive'],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm2-commande-clavette',
          name: 'ذراع تشغيل ميكانيكي معزز (Commande de Clavette renforcée) للتحكم الخارجي بالتعشيق للـ V2',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm2-ressort-embrayage',
          name: "نابض المخلب الثقيل (Ressort d'Embrayage renforcé RVM-V2) لدفع المخلب بعزم أقصى لبدء الضربة الصدمية",
          family: 'MEC' as const,
          taskIds: ['task-rvm-ressorts'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },



        // 3. منظومة الدواسة والقضيب الميكانيكي (Pédale & Tringlerie RVM-V2)
        {
          id: 'comp-rvm2-pedale',
          name: 'الدواسة الميكانيكية البسيطة العريضة (Pédale large) للتشغيل اليدوي المباشر بالقدم مع قبضة مريحة',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm2-tringlerie',
          name: 'القضيب المعدني الناقل السميك (Tige de Commande / Tringlerie renforcée) لنقل حركة الدواسة',
          family: 'MEC' as const,
          taskIds: ['task-rvm-v2-lubrification-intensive'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm2-ressorts-rappel',
          name: 'نوابض الإرجاع المزدوجة المعززة (Doubles Ressorts de Rappel renforcés) لإعادة الدواسة والعمود فوراً لمنع الضربات المتتالية الخاطئة',
          family: 'MEC' as const,
          taskIds: ['task-rvm-ressorts'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },

        // 4. منظومة تحويل الحركة الميكانيكية (Bielle-Manivelle RVM-V2)
        {
          id: 'comp-rvm2-arbre',
          name: 'العمود الأفقي الممتد السميك (Arbre Principal surdimensionné RVM-V2) لنقل العزم الحركي الضخم إلى رأس الآلة',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm2-bielle',
          name: 'آلية ذراع التوصيل والتدوير الثقيلة (Système Bielle-Manivelle renforcé RVM-V2) لتحويل الدوران إلى كبس صدمي رأسي هائل',
          family: 'MEC' as const,
          taskIds: ['task-rvm-v2-lubrification-intensive'],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },

        // 5. منظومة رأس البرشمة والمكبس (Tête de Rivetage & Poinçon RVM-V2)
        {
          id: 'comp-rvm2-poincon',
          name: 'المكبس الميكانيكي والسنبك المتين بأقطار أكبر للبرشام الضخم (Poinçon / Bouterolle renforcé RVM-V2)',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm2-enclume',
          name: 'منقار التثبيت اليدوي الأمتن للبرشام الضخم (Enclume / Support de Rivet Renforcé RVM-V2)',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },

        // 6. الهيكل والدعم الميكانيكي (Bâti en Fonte RVM-V2)
        {
          id: 'comp-rvm2-bati',
          name: 'الهيكل الثقيل جداً القائم الذاتي (Bâti autoporteur en fonte lourde RVM-V2) على قاعدته الخاصة لامتصاص الصدمات القوية وصدم الرأس والضربات',
          family: 'MEC' as const,
          taskIds: ['task-rvm-v2-ancrage'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },

        // 6. منظومة التشحيم والتزييت المكثف (Système de Lubrification RVM-V2)
        {
          id: 'comp-rvm2-lubrification-volant',
          name: 'نقاط تشحيم العجلة الكبيرة (Graisseurs de volant RVM-V2) - حلمات ضخ الشحم لتزييت جلب ورولمينات العجلة الثقيلة الدوارة بانتظام',
          family: 'MEC' as const,
          taskIds: ['task-rvm-v2-lubrification-intensive'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm2-lubrification-piston',
          name: 'نقاط تشحيم المكبس والمجرى (Graisseurs de piston RVM-V2) - منافذ مخصصة لضخ الشحم أو الزيت لتقليل الاحتكاك للـ V2',
          family: 'MEC' as const,
          taskIds: ['task-rvm-v2-lubrification-intensive'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm2-garniture-glissiere',
          name: 'حشوة أو مجرى المكبس المنزلق للـ V2 (Garniture de glissière renforcée RVM-V2) - لمنع تآكل المكبس والمجرى مع قوى الاحتكاك الضخمة',
          family: 'MEC' as const,
          taskIds: ['task-rvm-v2-lubrification-intensive'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },

        // 7. منظومة التحكم الكهربائي الكلاسيكية (Tableau Électrique RVM-V2)
        {
          id: 'comp-rvm2-boutons-moteur',
          name: 'أزرار التشغيل والإيقاف الكهربائية (Boutons Marche/Arrêt RVM-V2) - لتشغيل وإيقاف المحرك الكلاسيكي 2.2kW',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm2-contacteur',
          name: 'الكونتاكتور الكهربائي ومقاومة الأمبير (Contacteur TeSys D RVM-V2) - ريليه كهروميكانيكي لفتح وغلق دوائر الطاقة للمحرك',
          family: 'ELE' as const,
          taskIds: ['task-rvm-v2-contacteur'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm2-relais-thermique',
          name: 'الروليه الحراري للحماية (Relais Thermique RVM-V2) - جهاز الحماية الموصول بالكونتاكتور لقطع الكهرباء عند الحمل الزائد للـ V2',
          family: 'ELE' as const,
          taskIds: ['task-rvm-v2-contacteur'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },

        // 8. منظومة الحماية وأغطية الأمان (Carter de Sécurité RVM-V2)
        {
          id: 'comp-rvm2-carter-protection',
          name: 'غطاء الحماية الشامل لسلامة العامل (Carter de protection renforcé RVM-V2) - غطاء معدني صلب يغطي العجلة الكبيرة والسيور والتروس بالكامل لضمان معايير السلامة HSE',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },

        // 9. نظام ضبط شوط المكبس والمعايرة (Système de Réglage de Course RVM-V2)
        {
          id: 'comp-rvm2-tige-filetee',
          name: 'عمود التوصيل الملولب لضبط الشوط (Tige Filetée de Bielle RVM-V2) - لضبط ارتفاع المكبس العلوي بدقة تحت عزم الكبس العالي',
          family: 'MEC' as const,
          taskIds: ['task-rvm-reglage-course'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm2-contre-ecrou',
          name: 'صمولة القفل والتأمين لتفادي الارتخاء من الاهتزاز (Contre-écrou de blocage RVM-V2) - صمولة robuste تمنع تغير المعايرة بسبب صدمات الـ V2',
          family: 'MEC' as const,
          taskIds: ['task-rvm-reglage-course'],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm2-vis-reglage-enclume',
          name: 'براغي ضبط قاعدة الفك السفلي (Vis de réglage d\'enclume RVM-V2) - لتعديل المسافة الفاصلة والعمق لبرشمة الأواني السميكية ومقابضها',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        }
      ];
//       await db.standardComponents.bulkAdd(rvmComponentsV2);

      // -------------------------------------------------------------
      // Create RVM V3 Components (RVM-V3 Standard Components)
      // -------------------------------------------------------------
      const rvmComponentsV3 = [
        // 1. منظومة الطاقة والتعليق العلوي (Système de Propulsion Supérieur)
        {
          id: 'comp-rvm3-moteur',
          name: 'المحرك الكهربائي العلوي المعلق (Moteur Électrique Suspendu RVM-V3) - بقدرة 1.5 kW لحماية المحرك وتوفير المساحة الأرضية',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm3-courroies',
          name: 'بكرة وسيور نقل الحركة العلوية (Poulie & Courroies Supérieures RVM-V3) - لنقل الحركة المباشرة من الأعلى للواجهة الأمامية للآلة',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm3-volant',
          name: 'العجلة الأمامية اليمنى حدافة الموازنة (Volant d\'Inertie Frontal Droit RVM-V3) - لتخزين عزم الدوران والضربة الكبسية المباشرة للآلة',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },

        // 2. ميكانيزم المحرك الانفجاري والمكبس الداخلي (Système Bielle-Manivelle Interne)
        {
          id: 'comp-rvm3-piston',
          name: 'المكبس الداخلي المخفي (Piston interne / Coulisseau noyé RVM-V3) - يتحرك داخل تجويف مغلق مسبوك بدقة لمنع التآكل وخلوص الحركة الجانبية بفعل غبار الألومنيوم',
          family: 'MEC' as const,
          taskIds: ['task-rvm3-lubrification-interne'],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm3-bielle',
          name: 'ذراع التوصيل الداخلي (Bielle interne de type moteur RVM-V3) - يحول الحركة الدورانية لحركة خطية صدمية بعزم أقصى شبيه بمحرك السيارة أو الدراجة النارية',
          family: 'MEC' as const,
          taskIds: ['task-rvm3-lubrification-interne'],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm3-porte-poincon',
          name: 'رأس تثبيت لقمة الكبس السفلي (Porte-poinçon frontal RVM-V3) - لتثبيت وتغيير لقمة الكبس والسنبك بسهولة وسرعة عالية في واجهة الآلة',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },

        // 3. منظومة الدواسة والقضيب القابل للضبط (Système Pédale & Tringlerie Réglable)
        {
          id: 'comp-rvm3-tige-pedale',
          name: 'قضيب الدواسة التلسكوبي القابل للضبط (Tige de commande télescopique / réglable RVM-V3) - لضبط حساسية وارتفاع الدواسة لتناسب العمال',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-rvm3-pedale',
          name: 'الدواسة المباشرة المزودة بنابض إرجاع قوي (Pédale & Ressort de Rappel Direct RVM-V3) - لعودة الدواسة السريعة ومنع تكرار الضربة المزدوجة المتتالية (Double Coup)',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },

        // 4. منظومة المعايرة المحدودة وضبط الفك السفلي (Système de Réglage Outillage)
        {
          id: 'comp-rvm3-enclume',
          name: 'الفك السفلي المنقار القابل للضبط والمعايرة (Enclume réglable RVM-V3) - لرفع وخفض مستوى الدعم للأواني المكبوسة ومقابضها لتعديل الضغط والارتفاع',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },

        // 5. منظومة التشحيم المدمجة (Système de Lubrification Centralisé)
        {
          id: 'comp-rvm3-lubrification',
          name: 'قنوات ومنافذ التشحيم المدمجة للمكبس المخفي (Canaux de lubrification internes RVM-V3) - لضخ الشحم مباشرة للمكبس والبيال لضمان حركة سلسة ومنع التآكل الميكانيكي',
          family: 'MEC' as const,
          taskIds: ['task-rvm3-lubrification-interne'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        }
      ];
//       await db.standardComponents.bulkAdd(rvmComponentsV3);

      const rvmBlueprintV1 = {
        id: 'mchbp-rvm-v1',
        templateId: 'tpl-rvm',
        reference: 'RIV-RVM-MANUAL-V1',
        brand: 'RivClassic',
        model: 'RVM-V1-01',
        powerOrForce: 'Moteur central standard: 1.1 kW / Volant d\'inertie lourd à couplage direct',
        energySource: 'Électrique 220V/380V (moteur uniquement) & Actionnement 100% mécanique par tringlerie et pédale',
        technicalSpecs: `Riveteuse Mécanique à Alimentation Manuelle RVM-V1-01 (L'ancêtre robuste de la gamme RVA).
Conception mécanique pure à haute durabilité avec maintenance réduite.
Toutes les opérations d'alimentation en rivets s'effectuent manuellement (rivet par rivet posé directement sur l'enclume par l'opérateur).
Système de transmission par moteur électrique compact avec tendeur à réglage de hauteur par glissière manuelle pour réguler le glissement des courروies de transmission.
Embrayage à friction remplacé par un système d'embrayage mécanique pur à clavette tournante robuste activé par une tringlerie mécanique verticale connectée à la pédale de pied.
Le cycle de descente rapide du poinçon s'effectue via un système bielle-manivelle simple.
Sécurités passives : carter de protection de volant d'inertie et rappel mécanique robuste par doubles ressorts pour éviter tout ré-engagement intempestif (double coup d'embrayage).`,
        componentIds: rvmComponents.map(c => c.id),
        createdAt: new Date().toISOString()
      };
      await db.machineBlueprints.add(rvmBlueprintV1);

      const rvmBlueprintV2 = {
        id: 'mchbp-rvm-v2',
        templateId: 'tpl-rvm',
        reference: 'RIV-RVM-MANUAL-V2',
        brand: 'RivClassic',
        model: 'RVM-V2-01',
        powerOrForce: 'Moteur principal renforcé: 2.2 kW / Volant d\'inertie lourd surdimensionné',
        energySource: 'Électrique 380V (moteur uniquement) & Actionnement 100% mécanique par tringlerie et pédale',
        technicalSpecs: `Riveteuse Mécanique à Alimentation Manuelle RVM-V2-01 de grande capacité. Version renforcée et surdimensionnée de la gamme RVM.
Équipée d'un bâti auto-porteur lourd sur socle (sa propre base de fixation) pour une stabilité et une inertie accrues lors des opérations de rivetage intensif.
Dispose d'un moteur asynchrone triphasé puissant de 2.2 kW entraînant un grand volant d'inertie de fort diamètre pour démultiplier efficacement l'énergie cinétique stockée.
Système de transmission mécanique direct sans assistance pneumatique ou PLC, idéal pour les travaux de tôlerie lourde nécessitant une force mécanique élevée brute.
Entièrement autonome with les mêmes composants fonctionnels éprouvés que la gamme RVM V1, adaptés pour supporter des couples mécaniques supérieurs.`,
        componentIds: rvmComponentsV2.map(c => c.id),
        createdAt: new Date().toISOString()
      };
      await db.machineBlueprints.add(rvmBlueprintV2);

      const rvmBlueprintV3 = {
        id: 'mchbp-rvm-v3',
        templateId: 'tpl-rvm',
        reference: 'RIV-RVM-MANUAL-V3',
        brand: 'RivClassic',
        model: 'RVM-V3-01',
        powerOrForce: 'Moteur suspendu supérieur: 1.5 kW / Volant d\'inertie frontal droit compact',
        energySource: 'Électrique 380V (moteur suspendu) & Actionnement mécanique par bielle interne et pédale réglable',
        technicalSpecs: `Riveteuse Mécanique V3 - Compacte à Haute Densité RVM-V3-01 (التصميم المدمج عالي الكفاءة).
تصميم هندسي مبتكر يعيد توزيع الأوزان للتخلص من المساحات الضائعة، ومحاكاة ميكانيزم محرك الاحتراق الداخلي للدراجة النارية (Système Bielle-Manivelle direct d'un moteur à explosion).
1. منظومة الطاقة والتعليق العلوي (Système de Propulsion Supérieur): محرك علوي معلق (Position Suspendue) بقدرة 1.5 kW يقلل المساحة الأرضية ويحمي من الغبار والرطوبة، مع سيور علوية وعجلة موازنة أمامية يمنى (Volant d'inertie frontal droit) مربوطة مباشرة بعمود الحدبات.
2. ميكانيزم المكبس الداخلي (Système Bielle-Manivelle Interne): مكبس مخفي (Piston interne / Coulisseau noyé RVM-V3) يتحرك داخل تجويف مغلق مسبوك بدقة لمنع تسرب غبار الألومنيوم وخلوص الحركة الجانبية، مع ذراع توصيل داخلي (Bielle interne de type moteur) وporte-poinçon سفلي بارز لتثبيت لقم الكبس وسنبك البرشمة بسهولة.
3. منظومة الدواسة والقضيب القابل للضبط (Système Pédale & Tringlerie Réglable): قضيب تلسكوبي قابل لتعديل الطول (Tige télescopique) لضبط حساسية وارتفاع الدواسة مع نابض إرجاع قوي ومباشر لمنع الضربات المزدوجة المتتالية (Double coup).
4. منظومة المعايرة المحدودة وضبط الفك السفلي (Système de Réglage Outillage): شوط علوي ثابت ميكانيكياً بفعل البيال الداخلي، والمعايرة بالكامل تعتمد على رفع وخفض الفك السفلي القابل للضبط (Enclume réglable).
5. منظومة التشحيم المدمجة (Système de Lubrification Centralisé): قنوات تشحيم خارجية وداخلية لضخ الشحم مباشرة إلى المكبس المخفي لضمان الانزلاق بنعومة وتفادي التآكل والالتصاق (Grippage).`,
        componentIds: [
          'comp-rvm3-moteur',
          'comp-rvm3-courroies',
          'comp-rvm3-volant',
          'comp-rvm3-piston',
          'comp-rvm3-bielle',
          'comp-rvm3-porte-poincon',
          'comp-rvm3-tige-pedale',
          'comp-rvm3-pedale',
          'comp-rvm3-enclume',
          'comp-rvm3-lubrification'
        ],
        createdAt: new Date().toISOString()
      };
      await db.machineBlueprints.add(rvmBlueprintV3);

      const detComponents = [
        {
          id: 'comp-det-moteur',
          name: 'المحرك الرئيسي للعمود (Moteur principal de broche) - محرك كهربائي 3kW لتوفير طاقة الدوران السريعة',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-det-poulies',
          name: 'البكرات والسيور ثلاثية المجاري (Poulies & Courroies) - نظام نقل الحركة الميكانيكي مع بكرات لضبط وتوزيع عزم الدوران',
          family: 'MEC' as const,
          taskIds: ['task-det-align-courroies'],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-det-paliers',
          name: 'كراسي التحميل بالرولمينات المخروطية والعادية (Paliers de broche coniques/billes) - لتحمل الإجهاد الأفقي الشديد أثناء الخراطة',
          family: 'MEC' as const,
          taskIds: ['task-det-align-courroies'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-det-pompe-vide',
          name: 'مضخة الخلأ ونظام الفلترة (Pompe à vide) - لتوليد ضغط الشفط اللازم لتثبيت الآنية بإحكام على القالب الدوار',
          family: 'PNU' as const,
          taskIds: ['task-det-pompe-vide'],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-det-raccord-tournant',
          name: 'الوصلة الدورانية للشفط (Raccord tournant pneumatique) - تضمن نقل الشفط من خطوط الإمداد الثابتة إلى القالب الدوار دون تسريب',
          family: 'PNU' as const,
          taskIds: ['task-det-pompe-vide'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-det-pedale-distrib',
          name: 'الدواسة الكهربائية والموزع النيوماتيكي 5/3 (Pédale & Distributeur 5/3) - للتحكم الكهرونيوماتيكي بتوجيه الشفط وتثبيت وتحرير الآنية',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-det-frein',
          name: 'قرص الفرملة والمكابح النيوماتيكية (Système de Freinage Automatique) - لإيقاف دوران العمود فوراً بالتنسيق مع تلامسات الكونتاكتور المساعدة',
          family: 'PNU' as const,
          taskIds: ['task-det-frein'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-det-centrale-hyd',
          name: 'المحطة الهيدروليكية المدمجة (Centrale hydraulique) - تشمل طلمبة ومحرك 2.2kW لتوليد ضغط الزيت اللازم لحركة فكوك القص',
          family: 'HYD' as const,
          taskIds: ['task-det-huile-hyd'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-det-verin-vertical',
          name: 'الفيرانت الهيدروليكي وحامل الأدوات (Vérin vertical & Porte-outil) - لتحريك شفرة أو قلم الخراطة رأسياً وجانبياً بسلاسة وثبات',
          family: 'HYD' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-det-tige-reglage',
          name: 'عمود معايرة المشوار وحساس نهاية الشوط السفلي (Tige filetée & Capteur fin de course) - للتحكم الميكانيكي الدقيق في نهاية مشوار الهبوط',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-det-armoire',
          name: 'لوحة التحكم والتشغيل الميدانية ووحدة FRL (Armoire électrique & Unité FRL) - تحتوي على الكونتاكتورات وأجهزة الحماية ومصفاة الهواء والمشحم',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-det-tendeur',
          name: 'منظومة ضبط المحرك السفلي (Tendeur à vis) - عمود لولبي ميكانيكي لتقديم أو تأخير قاعدة المحرك لشد وتعديل السيور ثلاثية المجاري',
          family: 'MEC' as const,
          taskIds: ['task-det-align-courroies'],
          criticality: 'LOW' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-det-carters',
          name: 'هيكل الحماية الخارجي (Carters de protection) - أغطية متينة تخفي جميع الأجزاء المتحركة لحماية بيئة العمل والعمال من الأجزاء الدوارة الثقيلة ورايش الألومنيوم',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        }
      ];
//       await db.standardComponents.bulkAdd(detComponents);

      const detBlueprintV1 = {
        id: 'mchbp-det-v1',
        templateId: 'tpl-det',
        reference: 'DET-V1-01-HYDROPNEUMATIC',
        brand: 'DétourTech',
        model: 'DET-V1-01',
        powerOrForce: 'Broche: 3 kW, Hydraulique: 2.2 kW / Maintien par le vide',
        energySource: 'Électrique 380V, Pneumatique (6 bar), Hydraulique & Aspiration sous Vide',
        technicalSpecs: `Machine de Détourage V1 - Hydropneumatique à Vide (آلة الديتوراج الذكية لقص وتنعيم حواف الأواني).
تحفة ميكاترونيكية تجمع بين الميكانيك الثقيل، النيوماتيك، الهيدروليك، والتحكم الكهربائي:
1. منظومة المحور والتدوير (Système Broche & Transmission): محرك 3kW مع بكرات ثلاثية المجاري وكراسي تحميل مزدوجة برولمينات مخروطية وعادية لامتصاص قوى القطع الأفقية. مزودة بعمود لولبي ميكانيكي (Tendeur à vis) لشد السيور.
2. منظومة التثبيت بالخلأ (Système de Fixation par Vide): مضخة شفط ووصلة دورانية لمنع التسريب وقالب مغناطيسي نيوماتيكي.
3. منظومة التحكم بالدواسة والموزع 5/3 (Système de Pédale & Distributeur): للتحكم المزدوج بالتثبيت والإفلات الآمن.
4. منظومة الكبح والفرملة الأوتوماتيكية (Système de Freinage Automatique): كبّاس نيوماتيكي بقرص يفرمل المحور فور انقطاع الطاقة لحماية المشغّل.
5. المحطة الهيدروليكية (Centrale Hydraulique Noyée): محرك 2.2kW مع مضخة هيدروليكية لتغذية حركة السكاكين الرأسية.
6. لوحة التحكم والتشغيل الكهربائية (Tableau Électrique & FRL): لتنظيم وحماية الدوائر الكهربائية والنيوماتيكية.
7. الحماية الشاملة (Sécurité Globale): أغطية معدنية قوية (Carters) تغلف جميع الأجزاء الدوارة والمضخات لحماية العمال من الرايش.`,
        componentIds: detComponents.map(c => c.id),
        createdAt: new Date().toISOString()
      };
      await db.machineBlueprints.add(detBlueprintV1);

      // DET-V2 Components & Blueprint
      const detV2Components = [
        {
          id: 'comp-det-v2-moteur',
          name: 'المحرك الرئيسي الضخم (Moteur principal Haute Puissance) - محرك كهربائي 5.5kW لتوفير طاقة الدوران العالية للقياسات الكبيرة',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-det-v2-pompe-vide',
          name: 'مضخة الخلأ ذات القدرة العالية (Pompe à vide Haute Capacité) - لتوليد ضغط شفط هائل يتناسب مع حجم الأواني الكبيرة',
          family: 'PNU' as const,
          taskIds: ['task-det-pompe-vide'],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-det-v2-centrale-hyd',
          name: 'المحطة الهيدروليكية الكبيرة (Centrale hydraulique Haute Pression) - مزودة بمحرك 4kW لضمان قوة قص هائلة للسمك الكبير',
          family: 'HYD' as const,
          taskIds: ['task-det-huile-hyd'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        }
      ];
//       await db.standardComponents.bulkAdd(detV2Components);

      const detBlueprintV2 = {
        id: 'mchbp-det-v2',
        templateId: 'tpl-det',
        reference: 'DET-V2-02-HEAVY-DUTY',
        brand: 'DétourTech',
        model: 'DET-V2-HD',
        powerOrForce: 'Broche: 5.5 kW, Hydraulique: 4.0 kW / Maintien par le vide haute capacité',
        energySource: 'Électrique 380V, Pneumatique (6 bar), Hydraulique & Aspiration sous Vide Fort',
        technicalSpecs: `Machine de Détourage V2 - Heavy Duty (آلة الديتوراج الحجم الكبير للخدمة الشاقة).
نسخة مكبرة من V1 بنفس الأنظمة الهندسية ولكن مخصصة للأواني الكبيرة والسميكة:
1. منظومة المحور والتدوير (Système Broche & Transmission): محرك ضخم 5.5kW مع بكرات ثلاثية وكراسي تحميل شديدة التحمل.
2. منظومة التثبيت بالخلأ (Système de Fixation par Vide): مضخة شفط ذات سعة عالية لضمان تثبيت محكم للأواني الكبيرة.
3. منظومة التحكم بالدواسة والموزع 5/3 (Système de Pédale & Distributeur): نفس نظام التحكم في V1.
4. منظومة الكبح والفرملة الأوتوماتيكية (Système de Freinage Automatique): نفس نظام الفرملة.
5. المحطة الهيدروليكية (Centrale Hydraulique Noyée): محطة هيدروليكية ضخمة بمحرك 4kW لقص السمك الكبير.
6. لوحة التحكم والتشغيل الكهربائية (Tableau Électrique & FRL): لتنظيم وحماية الدوائر الكهربائية والنيوماتيكية.
7. الحماية الشاملة (Sécurité Globale): أغطية معدنية قوية (Carters).`,
        componentIds: [
          'comp-det-v2-moteur',
          'comp-det-poulies',
          'comp-det-paliers',
          'comp-det-v2-pompe-vide',
          'comp-det-raccord-tournant',
          'comp-det-pedale-distrib',
          'comp-det-frein',
          'comp-det-v2-centrale-hyd',
          'comp-det-verin-vertical',
          'comp-det-tige-reglage',
          'comp-det-armoire',
          'comp-det-tendeur',
          'comp-det-carters'
        ],
        createdAt: new Date().toISOString()
      };
      await db.machineBlueprints.add(detBlueprintV2);

      // DET-V3 Components & Blueprint
      const detV3Components = [
        {
          id: 'comp-det-v3-axe-vertical',
          name: 'المحور العمودي الرئيسي (Axe / Broche Verticale) - المحور الذي يحمل القالب في وضع أفقي مسطح فوق طاولة العمل',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-det-v3-reducteur',
          name: 'علبة تروس مخفض السرعة (Réducteur de vitesse) - مضافة لتقليل السرعة ومضاعفة عزم الدوران لتدوير القوالب الضخمة',
          family: 'MEC' as const,
          taskIds: ['task-det-v3-graissage-reducteur', 'task-det-v3-vidange-reducteur'],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-det-v3-verin-taqia',
          name: 'فيران الطاقية الهجين (Vérin Oléopneumatique de serrage) - فيران عمودي يضغط من الأعلى لتثبيت الآنية، مزود بحجرة زيت لتخميد الحركة',
          family: 'HYD' as const,
          taskIds: ['task-det-v3-niveau-huile'],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-det-v3-verin-vertical',
          name: 'الفيران الهيدرو-نيوماتيكي العمودي (Vérin Vertical d\'avance) - لحركة صعود ونزول حامل الأدوات للقص العمودي',
          family: 'HYD' as const,
          taskIds: ['task-det-v3-niveau-huile'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-det-v3-verin-horizontal',
          name: 'الفيران الهيدرو-نيوماتيكي الأفقي (Vérin Horizontal d\'avance) - لحركة التقدم والإرجاع الأفقي لأداة القطع',
          family: 'HYD' as const,
          taskIds: ['task-det-v3-niveau-huile'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-det-v3-selecteurs',
          name: 'سويتشات اختيار الفيرانات (Sélecteurs d\'outils) - لاختيار تشغيل الفيران العمودي أو الأفقي أو كلاهما في الوضع الأوتوماتيكي',
          family: 'ELE' as const,
          taskIds: ['task-det-v3-test-securite'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        }
      ];
//       await db.standardComponents.bulkAdd(detV3Components);

      const detBlueprintV3 = {
        id: 'mchbp-det-v3',
        templateId: 'tpl-det',
        reference: 'DET-V3-01-VERTICAL-HYDROPNEUMATIC',
        brand: 'DétourTech',
        model: 'DET-V3-VERTICAL',
        powerOrForce: 'Broche: Verticale avec Réducteur, Serrage: Vérin Taqia',
        energySource: 'Électrique 380V, Pneumatique (6 bar) & Hydraulique (Vérins Oléopneumatiques)',
        technicalSpecs: `Machine de Détourage Verticale - Hydro-pneumatique V3 (آلة الديتوراج الرأسية الهيدرو-نيوماتيكية).
تمثل تطوراً هندسياً هائلاً للأواني والقوالب العملاقة:
1. منظومة المحور الرأسي وعزم التدوير الثقيل (Système Broche Verticale & Réducteur): تحول بالكامل من الهيكل الأفقي إلى العمودي لإلغاء إجهاد الانحناء. دمج علبة تروس (Réducteur) لمضاعفة عزم الدوران.
2. منظومة التثبيت العلوية (Système Taqia): إلغاء نظام الشفط بالكامل واستبداله بفيران هجين (هواء+زيت) يضغط من الأعلى لتثبيت الآنية بقوة هائلة مع نعومة في الحركة.
3. منظومة القص المزدوجة (Système de Coupe Multi-Axes): فيرانين ضخمين هيدرو-نيوماتيكيين (عمودي وأفقي) لتشذيب الجوانب والحواف بسلاسة.
4. لوحة التحكم والمنطق (Tableau de Commande & Logique): سويتشات تتيح اختيار الفيرانات المشتغلة (عمودي/أفقي/معاً)، فيران الطاقية مبرمج ليعمل دائماً أولاً لضمان الأمان. إلغاء نظام تفريغ الهواء وإلغاء الفرامل (علبة التروس توفر كبح ذاتي).`,
        componentIds: [
          'comp-det-v2-moteur', // We reuse the 5.5kW motor from V2 or normal
          'comp-det-poulies',
          'comp-det-paliers',
          'comp-det-v3-axe-vertical',
          'comp-det-v3-reducteur',
          'comp-det-v3-verin-taqia',
          'comp-det-v3-verin-vertical',
          'comp-det-v3-verin-horizontal',
          'comp-det-v3-selecteurs',
          'comp-det-armoire',
          'comp-det-carters'
        ],
        createdAt: new Date().toISOString()
      };
      await db.machineBlueprints.add(detBlueprintV3);

      // DET-V4 Components & Blueprint
      const detV4Components = [
        {
          id: 'comp-det-v4-verin-special',
          name: 'الفيران الأول الهيدروليكي العمودي (Vérin de Détourage / Spécial) - مدمج مع قاعدة حوامل أدوات وريجلت للتعديل الدقيق',
          family: 'HYD' as const,
          taskIds: ['task-det-v4-reglage-vannes'],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-det-v4-verin-long',
          name: 'الفيران الثاني الطويل (Vérin d\'Avance Horizontal) - لدفع وتوجيه منظومة الزخرفة عبر سكة انزلاق',
          family: 'HYD' as const,
          taskIds: ['task-det-v4-graissage-glissiere', 'task-det-v4-reglage-vannes'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-det-v4-verin-guillochage',
          name: 'الفيران الثالث المنسوخ (Vérin de Guillochage) - مزود بحوامل أدوات ميكرومترية للزخرفة الدقيقة',
          family: 'HYD' as const,
          taskIds: ['task-det-v4-serrage-micrometrique', 'task-det-v4-reglage-vannes'],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-det-v4-gabarit',
          name: 'منظومة نسخ وتتبع الأنماط الميكانيكية (Gabarit de profil & Palpeur) - مسطرة حديدية مع ذراع تتبع لنسخ الزخرفة',
          family: 'MEC' as const,
          taskIds: ['task-det-v4-nettoyage-gabarit', 'task-det-v4-graissage-glissiere'],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        }
      ];
//       await db.standardComponents.bulkAdd(detV4Components);

      const detBlueprintV4 = {
        id: 'mchbp-det-v4',
        templateId: 'tpl-det',
        reference: 'DET-V4-01-HORIZONTAL-GUILLOCHAGE',
        brand: 'DétourTech',
        model: 'DET-V4-DECORATION',
        powerOrForce: 'Broche: Horizontale, Tri-Vérins Hydrauliques & Copiage Mécanique',
        energySource: 'Électrique 380V, Pneumatique (Vide) & Hydraulique (Haute Pression)',
        technicalSpecs: `Machine de Détourage et Décoration Horizontale V4 (آلة الديتوراج والزخرفة الأفقية بالنسخ الميكانيكي).
تحتفظ بالبنية الأفقية لكنها مزودة بنظام هيدروليكي מתקدم جداً:
1. منظومة القص والزخرفة الهيدروليكية الثلاثية (Système Hydraulique Tri-Vérins): تعمل بتعاقب أوتوماتيكي ذكي. الفيران الأول لقص الحواف، الثاني لدفع حامل الزخرفة، والثالث للزخرفة (Guillochage).
2. منظومة نسخ وتتبع الأنماط الميكانيكية (Système de Copiage à Gabarit): مسطرة حديدية قابلة للإزالة (Gabarit) مع ذراع تتبع ميكانيكي يجبر الفيران الثالث على رسم دوائر ونقوش دقيقة في قاع المقلاة بدون الحاجة لـ CNC.
3. التعديل الميكرومتري: حوامل أدوات (Porte-outils) مزودة بنظام ضبط ميكرومتري لتقديم قلم القطع بالمليمترات.
4. لوحة تحكم هيدروليكية: صمامات تحكم بصبيب وسرعة الفيرانات الثلاثة لضمان توافق زمني دقيق في الدورة الأوتوماتيكية الكاملة.`,
        componentIds: [
          'comp-det-moteur',
          'comp-det-poulies',
          'comp-det-paliers',
          'comp-det-rac-vide',
          'comp-det-frein',
          'comp-det-v4-verin-special',
          'comp-det-v4-verin-long',
          'comp-det-v4-verin-guillochage',
          'comp-det-v4-gabarit',
          'comp-det-armoire',
          'comp-det-carters'
        ],
        createdAt: new Date().toISOString()
      };
      await db.machineBlueprints.add(detBlueprintV4);

      // SAT-V2 Components & Blueprint
      const sat2Components = [
        {
          id: 'comp-sat-v2-moteur',
          name: 'المحرك الرئيسي للعمود (Moteur principal de broche) - محرك كهربائي 3kW لتوفير طاقة الدوران السريعة لآلة الساتيناج V2',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-sat-v2-poulies',
          name: 'البكرات والسيور ثلاثية المجاري (Poulies & Courroies) - نظام نقل الحركة الميكانيكي مع بكرات لضبط وتوزيع عزم دوران رأس الساتيناج',
          family: 'MEC' as const,
          taskIds: ['task-det-align-courroies'],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-sat-v2-paliers',
          name: 'كراسي التحميل بالرولمينات المخروطية والعادية (Paliers de broche coniques/billes) - لتحمل الإجهاد الأفقي الشديد أثناء دوران رأس الساتيناج',
          family: 'MEC' as const,
          taskIds: ['task-det-align-courroies'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-sat-v2-pompe-vide',
          name: 'مضخة الخلأ ونظام الفلترة (Pompe à vide) - لتوليد ضغط الشفط اللازم لتثبيت الآنية بإحكام على القالب الدوار للساتيناج',
          family: 'PNU' as const,
          taskIds: ['task-det-pompe-vide'],
          criticality: 'CRITICAL' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-sat-v2-raccord-tournant',
          name: 'الوصلة الدورانية للشفط (Raccord tournant pneumatique) - تضمن نقل الشفط من خطوط الإمداد الثابتة إلى القالب الدوار دون تسريب',
          family: 'PNU' as const,
          taskIds: ['task-det-pompe-vide'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-sat-v2-pedale-distrib',
          name: 'الدواسة الكهربائية والموزع النيوماتيكي 5/3 (Pédale & Distributeur 5/3) - للتحكم الكهرونيوماتيكي بتوجيه الشفط وتثبيت وتحرير الآنية',
          family: 'PNU' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-sat-v2-frein',
          name: 'قرص الفرملة والمكابح النيوماتيكية (Système de Freinage Automatique) - لإيقاف دوران العمود فوراً بالتنسيق مع تلامسات الكونتاكتور المساعدة',
          family: 'PNU' as const,
          taskIds: ['task-det-frein'],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-sat-v2-armoire',
          name: 'لوحة التحكم والتشغيل الميدانية ووحدة FRL (Armoire électrique & Unité FRL) - تحتوي على الكونتاكتورات وأجهزة الحماية ومصفاة الهواء والمشحم',
          family: 'ELE' as const,
          taskIds: [],
          criticality: 'HIGH' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-sat-v2-tendeur',
          name: 'منظومة ضبط المحرك السفلي (Tendeur à vis) - عمود لولبي ميكانيكي لتقديم أو تأخير قاعدة المحرك لشد وتعديل السيور ثلاثية المجاري',
          family: 'MEC' as const,
          taskIds: ['task-det-align-courroies'],
          criticality: 'LOW' as const,
          createdAt: new Date().toISOString()
        },
        {
          id: 'comp-sat-v2-carters',
          name: 'هيكل الحماية الخارجي (Carters de protection) - أغطية متينة تخفي جميع الأجزاء المتحركة لحماية بيئة العمل من الأجزاء الدوارة الثقيلة',
          family: 'MEC' as const,
          taskIds: [],
          criticality: 'MEDIUM' as const,
          createdAt: new Date().toISOString()
        }
      ];
//       await db.standardComponents.bulkAdd(sat2Components);

      const satBlueprintV2 = {
        id: 'mchbp-sat-v2',
        templateId: 'tpl-sat',
        reference: 'SAT-V2-PNEUMATIC-VACUUM',
        brand: 'Satin Tech',
        model: 'SAT-V2-01',
        powerOrForce: 'Broche: 3 kW, Sans Hydraulique / Maintien par le vide',
        energySource: 'Électrique 380V, Pneumatique (6 bar) & Aspiration sous Vide',
        technicalSpecs: `Machine de Satinage V2 - Pneumatique à Vide (آلة الساتيناج المتطورة V2 لتلميع وتنعيم الأسطح بالشفط).
نسخة مطورة بالكامل تعتمد على نظام تثبيت بالخلأ وتصميم ميكاترونيكي متكامل، مستوحاة من آلة Détoureuse V1 ولكن بدون المنظومة الهيدروليكية (لا تحتوي على محطة هيدروليكية أو فيران هيدروليكي):
1. منظومة المحور والتدوير (Système Broche & Transmission): محرك 3kW مع بكرات ثلاثية المجاري وكراسي تحميل مزدوجة برولمينات مخروطية وعادية لامتصاص القوى الأفقية والاهتزازات. مزودة بعمود لولبي ميكانيكي (Tendeur à vis) لشد السيور.
2. منظومة التثبيت بالخلأ (Système de Fixation par Vide): مضخة شفط ووصلة دورانية تمنع تسريب الهواء لتأمين تثبيت فائق الدقة.
3. منظومة التحكم بالدواسة والموزع 5/3 (Système de Pédale & Distributeur): للتحكم المزدوج بالتثبيت والإفلات الآمن للأواني.
4. منظومة الكبح والفرملة الأوتوماتيكية (Système de Freinage Automatique): كبّاس نيوماتيكي بقرص فرملة يوقف دوران العمود فوراً لحماية المشغل عند التوقف أو الطوارئ.
5. لوحة التحكم والتشغيل الكهربائية (Tableau Électrique & FRL): لتنظيم وحماية الدوائر الكهربائية والنيوماتيكية ووحدة تصفية وتزييت الهواء.
6. الحماية الشاملة (Sécurité Globale): أغطية معدنية قوية (Carters) تغلف جميع الأجزاء الدوارة لحماية العمال.`,
        componentIds: sat2Components.map(c => c.id),
        createdAt: new Date().toISOString()
      };
      await db.machineBlueprints.add(satBlueprintV2);

      console.log('[SandboxSeeder] Added RVM V1, V2 & V3 Blueprints, Détoureuse V1, and Satinage V2.');

      // -------------------------------------------------------------
      // Create Registered Machines RVA-01 (V1), RVA-02 (V2), RVA-03 (V4) & RVM-01 (V1-01)
      // -------------------------------------------------------------
      const rvaMachinesList = [
        {
          id: 'mach-RVA01',
          blueprintId: 'mchbp-rva-v1',
          referenceCode: 'RVA-01',
          serialNumber: 'SN-RVA01-CLASSIC',
          manufacturingYear: 2018,
          sectorId: 'SEC-06', // Fabrication Mécanique
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-RVA02',
          blueprintId: 'mchbp-rva-v2',
          referenceCode: 'RVA-02',
          serialNumber: 'SN-RVA02-SMART',
          manufacturingYear: 2024,
          sectorId: 'SEC-06', // Fabrication Mécanique
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-RVA03',
          blueprintId: 'mchbp-rva-v4',
          referenceCode: 'RVA-03',
          serialNumber: 'SN-RVA03-MECHATRONIC',
          manufacturingYear: 2026,
          sectorId: 'SEC-06', // Fabrication Mécanique
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-RVM01',
          blueprintId: 'mchbp-rvm-v1',
          referenceCode: 'RVM-01',
          serialNumber: 'SN-RVM01-MANUAL-01',
          manufacturingYear: 2012,
          sectorId: 'SEC-06', // Fabrication Mécanique
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-RVM08',
          blueprintId: 'mchbp-rvm-v1',
          referenceCode: 'RVM-08',
          serialNumber: 'SN-RVM08-MANUAL-08',
          manufacturingYear: 2026,
          sectorId: 'SEC-08', // Finition Emballage 2
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-RVM09',
          blueprintId: 'mchbp-rvm-v2',
          referenceCode: 'RVM-09',
          serialNumber: 'SN-RVM09-HEAVY-01',
          manufacturingYear: 2026,
          sectorId: 'SEC-08', // Finition Emballage 2
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-RVM07',
          blueprintId: 'mchbp-rvm-v3',
          referenceCode: 'RVM-07',
          serialNumber: 'SN-RVM07-COMPACT-01',
          manufacturingYear: 2026,
          sectorId: 'SEC-08', // Finition Emballage 2
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-RVM11',
          blueprintId: 'mchbp-rvm-v3',
          referenceCode: 'RVM-11',
          serialNumber: 'SN-RVM11-COMPACT-02',
          manufacturingYear: 2026,
          sectorId: 'SEC-08', // Finition Emballage 2
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-RVM15',
          blueprintId: 'mchbp-rvm-v3',
          referenceCode: 'RVM-15',
          serialNumber: 'SN-RVM15-COMPACT-03',
          manufacturingYear: 2026,
          sectorId: 'SEC-08', // Finition Emballage 2
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-RVM03',
          blueprintId: 'mchbp-rvm-v3',
          referenceCode: 'RVM-03',
          serialNumber: 'SN-RVM03-COMPACT-04',
          manufacturingYear: 2026,
          sectorId: 'SEC-08', // Finition Emballage 2 (FEMB-02)
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-DET11',
          blueprintId: 'mchbp-det-v3',
          referenceCode: 'DET-11',
          serialNumber: 'SN-DET11-VERT-01',
          manufacturingYear: 2026,
          sectorId: 'SEC-03', // Detourage
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-DET04',
          blueprintId: 'mchbp-det-v4',
          referenceCode: 'DET-04',
          serialNumber: 'SN-DET04-DECO-01',
          manufacturingYear: 2026,
          sectorId: 'SEC-07', // Finition Emballage 1
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-DET05',
          blueprintId: 'mchbp-det-v4',
          referenceCode: 'DET-05',
          serialNumber: 'SN-DET05-DECO-02',
          manufacturingYear: 2026,
          sectorId: 'SEC-07', // Finition Emballage 1
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-DET08',
          blueprintId: 'mchbp-det-v4',
          referenceCode: 'DET-08',
          serialNumber: 'SN-DET08-DECO-03',
          manufacturingYear: 2026,
          sectorId: 'SEC-07', // Finition Emballage 1
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-DET09',
          blueprintId: 'mchbp-det-v4',
          referenceCode: 'DET-09',
          serialNumber: 'SN-DET09-DECO-04',
          manufacturingYear: 2026,
          sectorId: 'SEC-07', // Finition Emballage 1
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-DET01',
          blueprintId: 'mchbp-det-v2',
          referenceCode: 'DET-01',
          serialNumber: 'SN-DET01-HD-01',
          manufacturingYear: 2026,
          sectorId: 'SEC-03', // Detourage
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-DET03',
          blueprintId: 'mchbp-det-v1',
          referenceCode: 'DET-03',
          serialNumber: 'SN-DET03-HYDROPNEUM-03',
          manufacturingYear: 2026,
          sectorId: 'SEC-03', // Detourage
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-DET06',
          blueprintId: 'mchbp-det-v1',
          referenceCode: 'DET-06',
          serialNumber: 'SN-DET06-HYDROPNEUM-06',
          manufacturingYear: 2026,
          sectorId: 'SEC-03', // Detourage
          technicianId: null as any,
          status: 'Active' as const
        },
        // SAT V2 physical machines in Detourage sector SEC-03
        {
          id: 'mach-SAT13',
          blueprintId: 'mchbp-sat-v2',
          referenceCode: 'SAT-13',
          serialNumber: 'SN-SAT13-V2-01',
          manufacturingYear: 2026,
          sectorId: 'SEC-03', // Detourage
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-SAT17',
          blueprintId: 'mchbp-sat-v2',
          referenceCode: 'SAT-17',
          serialNumber: 'SN-SAT17-V2-02',
          manufacturingYear: 2026,
          sectorId: 'SEC-03', // Detourage
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-SAT21',
          blueprintId: 'mchbp-sat-v2',
          referenceCode: 'SAT-21',
          serialNumber: 'SN-SAT21-V2-03',
          manufacturingYear: 2026,
          sectorId: 'SEC-03', // Detourage
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-SAT25',
          blueprintId: 'mchbp-sat-v2',
          referenceCode: 'SAT-25',
          serialNumber: 'SN-SAT25-V2-04',
          manufacturingYear: 2026,
          sectorId: 'SEC-03', // Detourage
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-SAT26',
          blueprintId: 'mchbp-sat-v2',
          referenceCode: 'SAT-26',
          serialNumber: 'SN-SAT26-V2-05',
          manufacturingYear: 2026,
          sectorId: 'SEC-03', // Detourage
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-SAT27',
          blueprintId: 'mchbp-sat-v2',
          referenceCode: 'SAT-27',
          serialNumber: 'SN-SAT27-V2-06',
          manufacturingYear: 2026,
          sectorId: 'SEC-03', // Detourage
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-SAT36',
          blueprintId: 'mchbp-sat-v2',
          referenceCode: 'SAT-36',
          serialNumber: 'SN-SAT36-V2-07',
          manufacturingYear: 2026,
          sectorId: 'SEC-03', // Detourage
          technicianId: null as any,
          status: 'Active' as const
        },
        {
          id: 'mach-SAT41',
          blueprintId: 'mchbp-sat-v2',
          referenceCode: 'SAT-41',
          serialNumber: 'SN-SAT41-V2-08',
          manufacturingYear: 2026,
          sectorId: 'SEC-03', // Detourage
          technicianId: null as any,
          status: 'Active' as const
        }
      ];
      await db.machines.bulkAdd(rvaMachinesList);

      console.log(`[SandboxSeeder] Registered ${rvaMachinesList.length} physical machines (including DET-01, DET-03, DET-06, DET-11, and SAT V2 series).`);

      // Decouple all machines from blueprints right after seeding to satisfy user request
      const seededMachines = await db.machines.toArray();
      const seededBlueprints = await db.machineBlueprints.toArray();
      const blueprintMap = new Map(seededBlueprints.map(b => [b.id, b.templateId]));
      
      for (const machine of seededMachines) {
        if (machine.blueprintId) {
          const templateId = machine.templateId || blueprintMap.get(machine.blueprintId);
          await db.machines.update(machine.id, {
            blueprintId: undefined,
            ...(templateId ? { templateId } : {})
          });
        }
      }
      console.log('[SandboxSeeder] Successfully decoupled all seeded machines from blueprints.');

      localStorage.setItem('BDR_NEXUS_SANDBOX_SEEDED_V55', 'true');
    });
  } catch (error) {
    console.error('[SandboxSeeder] Wiping sandbox failed:', error);
  }
}
