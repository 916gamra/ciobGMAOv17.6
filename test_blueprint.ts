import { db } from './src/core/db';
async function run() {
  await db.pdrBlueprints.add({
    id: 'test-bp',
    templateId: 'temp-CO-A',
    reference: 'COA-001',
    unit: 'Pcs',
    minThreshold: 5,
    model: 'Test Model',
    powerOrForce: 'Test Power',
    technicalSpecs: 'Test Specs',
    createdAt: new Date().toISOString()
  });
  console.log('Added blueprint');
}
run();
