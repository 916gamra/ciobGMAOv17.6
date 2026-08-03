import ExcelJS from 'exceljs';
import { db } from '../db';

/**
 * Parses and analyzes the physical PDR Excel file
 */
export class ExcelFileAnalyzer {
  static async analyzeGestionPDRFile(file: File) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());

      const analysis = {
        fileName: file.name,
        fileSize: file.size,
        sheets: [] as any[],
        totalRows: 0,
        totalItems: 0,
        issues: [] as any[],
        warnings: [] as any[]
      };

      for (const worksheet of workbook.worksheets) {
        const sheetAnalysis = await this.analyzeSheet(worksheet);
        analysis.sheets.push(sheetAnalysis);
        analysis.totalRows += sheetAnalysis.rowCount;
        analysis.totalItems += sheetAnalysis.itemCount || 0;
      }

      return analysis;
    } catch (error) {
      console.error('Failed to analyze file', error);
      throw error;
    }
  }

  private static async analyzeSheet(worksheet: ExcelJS.Worksheet) {
    const sheetAnalysis = {
      name: worksheet.name,
      rowCount: 0,
      columnCount: 0,
      itemCount: 0,
      columns: [] as any[],
      sampleData: [] as any[],
      issues: [] as any[]
    };

    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];

    headerRow.eachCell((cell, index) => {
      const header = cell.value?.toString().trim() || '';
      headers.push(header);
      sheetAnalysis.columns.push({
        index,
        name: header,
        type: 'unknown'
      });
    });

    sheetAnalysis.columnCount = headers.length;

    let rowIndex = 2;
    const sampleRows: any[] = [];

    worksheet.eachRow((row, index) => {
      if (index === 1) return;

      const rowData: any = {};
      let hasData = false;

      row.eachCell((cell, cellIndex) => {
        const header = headers[cellIndex - 1];
        const value = cell.value;

        if (value) {
          hasData = true;
          rowData[header] = value;

          if (typeof value === 'number') {
            const column = sheetAnalysis.columns[cellIndex - 1];
            if (column.type === 'unknown') column.type = 'number';
          } else if (value instanceof Date) {
            const column = sheetAnalysis.columns[cellIndex - 1];
            column.type = 'date';
          } else if (typeof value === 'string') {
            const column = sheetAnalysis.columns[cellIndex - 1];
            if (column.type === 'unknown') column.type = 'string';
          }
        }
      });

      if (hasData) {
        sheetAnalysis.rowCount++;
        if (sampleRows.length < 3) {
          sampleRows.push(rowData);
        }
        this.detectIssues(rowData, sheetAnalysis, index);
      }
    });

    sheetAnalysis.sampleData = sampleRows;
    return sheetAnalysis;
  }

  private static detectIssues(rowData: any, sheetAnalysis: any, rowIndex: number) {
    for (const [key, value] of Object.entries(rowData)) {
      if (typeof value === 'number' && value < 0) {
        sheetAnalysis.issues.push({
          type: 'negative_value',
          row: rowIndex,
          column: key,
          value,
          severity: 'warning',
          message: `Negative value detected: ${key} = ${value}`
        });
      }

      if (!value && ['Reference', 'Designation', 'Quantité'].includes(key)) {
        sheetAnalysis.issues.push({
          type: 'missing_value',
          row: rowIndex,
          column: key,
          severity: 'critical',
          message: `Required field missing: ${key}`
        });
      }
    }
  }
}

export class ExcelDataConverter {
  static convertStockActuelToInventory(rows: any[]): any[] {
    return rows.map((row, index) => ({
      id: crypto.randomUUID(),
      blueprintId: this.extractBlueprintId(row['Reference'] || row['Reference ']),
      quantityCurrent: Number(row['Quantité Actuelle'] || row['Quantité ']) || 0,
      warehouseId: 'main-warehouse',
      locationDetails: row['Localisation'] || 'Unknown',
      updatedAt: new Date().toISOString()
    }));
  }

  static convertMouvementsToMovements(rows: any[]): any[] {
    return rows.map((row, index) => ({
      id: crypto.randomUUID(),
      stockId: this.extractBlueprintId(row['Reference'] || row['Reference ']),
      type: row['Type Mouvement']?.toString().toUpperCase().includes('ENTRÉE') ? 'IN' : 'OUT',
      quantity: Number(row['Quantité']) || 0,
      performedBy: row['Demandeur'] || 'System Import',
      notes: row['Observations'] || row['Motif'] || '',
      timestamp: this.parseDate(row['Date'])?.toISOString() || new Date().toISOString()
    }));
  }

  static convertBaseDonneeToPdrBlueprints(rows: any[]): any[] {
    return rows.map((row, index) => ({
      id: crypto.randomUUID(),
      templateId: 'system-template-imported', // Fallback
      reference: row['Reference'] || row['Reference '] || `UNKNOWN-${index}`,
      unit: row['Unité'] || 'Pcs',
      minThreshold: Number(row['Stock Min']) || 5,
      createdAt: new Date().toISOString()
    }));
  }

  private static extractBlueprintId(reference: string): string {
    return reference?.toString().replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() || 'unknown';
  }

  private static parseDate(dateValue: any): Date | null {
    if (!dateValue) return null;
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === 'string') {
      const formats = [
        /(\d{2})-(\d{2})-(\d{2})/,
        /(\d{4})-(\d{2})-(\d{2})/,
        /(\d{2})\/(\d{2})\/(\d{4})/
      ];
      for (const format of formats) {
        if (dateValue.match(format)) {
          try {
            return new Date(dateValue);
          } catch {
            continue;
          }
        }
      }
    }
    return null;
  }
}
