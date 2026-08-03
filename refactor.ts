import * as fs from 'fs';
import * as path from 'path';

function transformFile(src: string, dest: string) {
  let content = fs.readFileSync(src, 'utf-8');
  
  // Specific Type & Hook Replacements First
  content = content.replace(/PdrLibraryPage/g, 'EngineeringLabView');
  content = content.replace(/PdrModals/g, 'MachineModals');
  content = content.replace(/PdrCard/g, 'MachineLibraryCard');
  content = content.replace(/usePdrLibrary/g, 'useMachineLibrary');
  
  // DB & Interfaces
  content = content.replace(/PdrFamily/g, 'MachineFamily');
  content = content.replace(/PdrTemplate/g, 'MachineTemplate');
  content = content.replace(/PdrBlueprint/g, 'MachineBlueprint');
  content = content.replace(/pdrFamilies/g, 'machineFamilies');
  content = content.replace(/pdrTemplates/g, 'machineTemplates');
  content = content.replace(/pdrBlueprints/g, 'machineBlueprints');

  // Directories & Components
  content = content.replace(/\.\.\/hooks\/useMachineLibrary/g, '../hooks/useMachineLibrary');
  content = content.replace(/\.\.\/components\/MachineModals/g, './MachineModals');
  content = content.replace(/\.\.\/components\/MachineLibraryCard/g, './MachineLibraryCard');

  // Text changes
  content = content.replace(/Master PDR Library/g, 'Engineering Lab');
  content = content.replace(/Spare Parts/g, 'Machine Master Data');
  content = content.replace(/Master Part Library/g, 'Machine Archetypes & Blueprints');
  content = content.replace(/PDR Catalog/g, 'Blueprint Registry');
  
  // Modal specific
  content = content.replace(/open-add-pdr-family/g, 'open-add-machine-family');
  content = content.replace(/open-add-pdr-template/g, 'open-add-machine-template');
  content = content.replace(/open-add-pdr-blueprint/g, 'open-add-machine-blueprint');

  // Ensure consistent file saving
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content);
}

transformFile('src/features/pdr-engine/views/PdrLibraryPage.tsx', 'src/features/organization/views/EngineeringLabView.tsx');
transformFile('src/features/pdr-engine/components/PdrModals.tsx', 'src/features/organization/views/MachineModals.tsx');
transformFile('src/features/pdr-engine/components/PdrCard.tsx', 'src/features/organization/views/MachineLibraryCard.tsx');

console.log('Transformed files');

