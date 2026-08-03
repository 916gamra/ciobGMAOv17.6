import ExcelJS from 'exceljs';
import { ExcelFileAnalyzer, ExcelDataConverter } from './fileAnalyzer';
import { db } from '../db';
import { toast } from 'sonner';

export class RealFileImporter {
  static async importGestionPDRFile(file: File) {
    try {
      const analysis = await ExcelFileAnalyzer.analyzeGestionPDRFile(file);
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());

      const result = {
        success: true,
        summary: {
          totalRows: 0,
          importedRows: 0,
          errors: [] as any[],
          warnings: [] as any[]
        },
        details: {
          stockActuel: { imported: 0, errors: [] as any[] },
          mouvements: { imported: 0, errors: [] as any[] },
          baseDonnee: { imported: 0, errors: [] as any[] }
        }
      };

      const stockActuelSheet = workbook.getWorksheet('Stock_Actuel') || workbook.worksheets.find(w => w.name.includes('Stock'));
      if (stockActuelSheet) {
        const stockResult = await this.importStockActuel(stockActuelSheet);
        result.details.stockActuel = stockResult;
        result.summary.importedRows += stockResult.imported;
        result.summary.errors.push(...stockResult.errors);
      }

      const mouvementsSheet = workbook.getWorksheet('Mouvements');
      if (mouvementsSheet) {
        const mouvResult = await this.importMouvements(mouvementsSheet);
        result.details.mouvements = mouvResult;
        result.summary.importedRows += mouvResult.imported;
        result.summary.errors.push(...mouvResult.errors);
      }

      const baseDonneeSheet = workbook.getWorksheet('Base de donnee') || workbook.worksheets.find(w => w.name.includes('Base'));
      if (baseDonneeSheet) {
        const baseResult = await this.importBaseDonnee(baseDonneeSheet);
        result.details.baseDonnee = baseResult;
        result.summary.importedRows += baseResult.imported;
        result.summary.errors.push(...baseResult.errors);
      }

      result.success = result.summary.errors.length === 0;
      return result;
    } catch (error) {
      console.error('Failed to import real file', error);
      throw error;
    }
  }

  private static async importStockActuel(worksheet: ExcelJS.Worksheet) {
    const result = { imported: 0, errors: [] as any[] };
    try {
      const rows: any[] = [];
      const headers: string[] = [];

      worksheet.getRow(1).eachCell((cell) => {
        headers.push(cell.value?.toString().trim() || '');
      });

      worksheet.eachRow((row, index) => {
        if (index === 1) return;
        const rowData: any = {};
        row.eachCell((cell, cellIndex) => {
          rowData[headers[cellIndex - 1]] = cell.value;
        });
        if (rowData['Reference'] || rowData['Reference ']) {
          rows.push(rowData);
        }
      });

      const inventoryItems = ExcelDataConverter.convertStockActuelToInventory(rows);

      for (const item of inventoryItems) {
        try {
          if (item.quantityCurrent < 0) {
            result.errors.push({
              row: result.imported + 2,
              type: 'negative_stock',
              reference: item.blueprintId,
              value: item.quantityCurrent,
              message: `Negative stock: ${item.blueprintId} = ${item.quantityCurrent}`
            });
          }
          await db.inventory.add(item as any);
          result.imported++;
        } catch (error) {
          result.errors.push({
            row: result.imported + 2,
            reference: item.blueprintId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      return result;
    } catch (error) {
      result.errors.push({ type: 'sheet_error', message: error instanceof Error ? error.message : 'Unknown' });
      return result;
    }
  }

  private static async importMouvements(worksheet: ExcelJS.Worksheet) {
    const result = { imported: 0, errors: [] as any[] };
    try {
      const rows: any[] = [];
      const headers: string[] = [];

      worksheet.getRow(1).eachCell((cell) => {
        headers.push(cell.value?.toString().trim() || '');
      });

      worksheet.eachRow((row, index) => {
        if (index === 1) return;
        const rowData: any = {};
        row.eachCell((cell, cellIndex) => {
          rowData[headers[cellIndex - 1]] = cell.value;
        });
        if (rowData['Reference'] || rowData['Date'] || rowData['Reference ']) {
          rows.push(rowData);
        }
      });

      const movements = ExcelDataConverter.convertMouvementsToMovements(rows);

      for (const movement of movements) {
        try {
          await db.movements.add(movement as any);
          result.imported++;
        } catch (error) {
          result.errors.push({
             reference: movement.stockId,
             error: error instanceof Error ? error.message : 'Unknown'
          });
        }
      }
      return result;
    } catch (error) {
      result.errors.push({ type: 'sheet_error', message: error instanceof Error ? error.message : 'Unknown' });
      return result;
    }
  }

  private static async importBaseDonnee(worksheet: ExcelJS.Worksheet) {
    const result = { imported: 0, errors: [] as any[] };
    try {
      const rows: any[] = [];
      const headers: string[] = [];

      worksheet.getRow(1).eachCell((cell) => {
        headers.push(cell.value?.toString().trim() || '');
      });

      worksheet.eachRow((row, index) => {
        if (index === 1) return;
        const rowData: any = {};
        row.eachCell((cell, cellIndex) => {
          rowData[headers[cellIndex - 1]] = cell.value;
        });
        if (rowData['Reference'] || rowData['Reference ']) {
          rows.push(rowData);
        }
      });

      const blueprints = ExcelDataConverter.convertBaseDonneeToPdrBlueprints(rows);

      for (const blueprint of blueprints) {
        try {
          await db.pdrBlueprints.add(blueprint as any);
          result.imported++;
        } catch (error) {
          result.errors.push({
            reference: blueprint.reference,
            error: error instanceof Error ? error.message : 'Unknown err'
          });
        }
      }
      return result;
    } catch (error) {
      result.errors.push({ type: 'sheet_error', message: error instanceof Error ? error.message : 'Unknown err' });
      return result;
    }
  }
}
