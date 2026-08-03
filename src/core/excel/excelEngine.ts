import ExcelJS from 'exceljs';
import { ExcelTemplate, ExcelSheet, ExcelColumn, ExcelImportResult, ImportError } from './types';
import { logger } from '../logger';

export class ExcelEngine {
  static async readExcelFile(file: File, template: ExcelTemplate): Promise<ExcelImportResult> {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());

      const result: ExcelImportResult = {
        success: true,
        totalRows: 0,
        importedRows: 0,
        skippedRows: 0,
        errors: [],
        warnings: [],
        timestamp: new Date()
      };

      for (const sheet of template.sheets) {
        const worksheet = workbook.getWorksheet(sheet.name);
        if (!worksheet) {
          logger.warn(`Sheet ${sheet.name} not found`);
          continue;
        }

        const sheetData = await this.parseSheet(worksheet, sheet, result);
        sheet.data = sheetData;
      }

      result.success = result.errors.filter(e => e.severity === 'error').length === 0;
      return result;
    } catch (error) {
      logger.error({ error }, 'Failed to read Excel file');
      throw new Error('Failed to read Excel file');
    }
  }

  private static async parseSheet(
    worksheet: ExcelJS.Worksheet,
    sheet: ExcelSheet,
    result: ExcelImportResult
  ): Promise<any[]> {
    const data: any[] = [];
    const headerRow = worksheet.getRow(1);
    const columnMap = this.mapColumns(headerRow, sheet.columns);

    let rowIndex = 2;
    worksheet.eachRow((row, index) => {
      if (index === 1) return; // skip header

      const rowData: any = {};
      let hasError = false;

      for (const column of sheet.columns) {
        const cellIndex = columnMap[column.key];
        if (!cellIndex) continue;

        const cell = row.getCell(cellIndex);
        const value = cell.value;

        const validation = this.validateCell(value, column, rowIndex);
        if (!validation.valid) {
          result.errors.push({
            row: rowIndex,
            column: column.header,
            value,
            message: validation.message,
            severity: column.required ? 'error' : 'warning'
          });

          if (column.required) {
            hasError = true;
          }
        }

        rowData[column.key] = this.convertValue(value, column);
      }

      if (!hasError) {
        data.push(rowData);
        result.importedRows++;
      } else {
        result.skippedRows++;
      }

      result.totalRows++;
      rowIndex++;
    });

    return data;
  }

  private static mapColumns(
    headerRow: ExcelJS.Row,
    columns: ExcelColumn[]
  ): Record<string, number> {
    const map: Record<string, number> = {};

    headerRow.eachCell((cell, index) => {
      const header = cell.value?.toString().trim();
      const column = columns.find(c => c.header === header);
      if (column) {
        map[column.key] = index as number;
      }
    });

    return map;
  }

  private static validateCell(
    value: any,
    column: ExcelColumn,
    rowIndex: number
  ): { valid: boolean; message: string } {
    if (column.required && (value === null || value === undefined || value === '')) {
      return { valid: false, message: `Field ${column.header} is required` };
    }

    if (value === null || value === undefined || value === '') return { valid: true, message: '' };

    switch (column.type) {
      case 'number':
        if (isNaN(Number(value))) {
          return { valid: false, message: `${column.header} must be a number` };
        }
        if (column.validation?.min && Number(value) < column.validation.min) {
          return { valid: false, message: `${column.header} must be >= ${column.validation.min}` };
        }
        if (column.validation?.max && Number(value) > column.validation.max) {
          return { valid: false, message: `${column.header} must be <= ${column.validation.max}` };
        }
        break;

      case 'date':
        if (!(value instanceof Date) && isNaN(Date.parse(value))) {
          return { valid: false, message: `${column.header} must be a valid date` };
        }
        break;

      case 'enum':
        if (column.enum && !column.enum.includes(value)) {
          return { valid: false, message: `${column.header} must be one of: ${column.enum.join(', ')}` };
        }
        break;

      case 'string':
        if (column.validation?.pattern) {
          const regex = new RegExp(column.validation.pattern);
          if (!regex.test(value.toString())) {
            return { valid: false, message: `${column.header} format is invalid` };
          }
        }
        break;
    }

    return { valid: true, message: '' };
  }

  private static convertValue(value: any, column: ExcelColumn): any {
    if (value === null || value === undefined || value === '') return null;

    switch (column.type) {
      case 'number':
        return Number(value);
      case 'date':
        return new Date(value);
      case 'boolean':
        return value === true || value === 'true' || value === 1 || value === '1';
      default:
        return value.toString();
    }
  }

  static async writeExcelFile(
    template: ExcelTemplate,
    fileName: string
  ): Promise<ArrayBuffer> {
    try {
      const workbook = new ExcelJS.Workbook();

      for (const sheet of template.sheets) {
        const worksheet = workbook.addWorksheet(sheet.name);

        const headerRow = worksheet.addRow(sheet.columns.map(c => c.header));
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF366092' }
        };

        sheet.columns.forEach((column, index) => {
          worksheet.getColumn(index + 1).width = column.width;
        });

        if (sheet.data) {
          for (const row of sheet.data) {
            const values = sheet.columns.map(c => row[c.key]);
            const excelRow = worksheet.addRow(values);

            excelRow.eachCell((cell, index) => {
              const column = sheet.columns[index - 1]; // index is 1-based
              if (column && column.format) {
                cell.numFmt = column.format;
              }
            });
          }
        }

        this.addDataValidation(worksheet, sheet);
      }

      const buffer = await workbook.xlsx.writeBuffer();
      return buffer as unknown as ArrayBuffer;
    } catch (error) {
      logger.error({ error }, 'Failed to write Excel file');
      throw new Error('Failed to write Excel file');
    }
  }

  private static addDataValidation(worksheet: ExcelJS.Worksheet, sheet: ExcelSheet) {
    for (let i = 0; i < sheet.columns.length; i++) {
      const column = sheet.columns[i];
      const columnLetter = String.fromCharCode(65 + i);
      const ws = worksheet as any;

      if (column.enum) {
        ws.dataValidations.add(`${columnLetter}2:${columnLetter}1000`, {
          type: 'list',
          allowBlank: true,
          formulae: [`"${column.enum.join(',')}"`],
          showErrorMessage: true,
          errorTitle: 'Invalid Value',
          error: `Must choose from: ${column.enum.join(', ')}`
        });
      }

      if (column.validation?.min !== undefined || column.validation?.max !== undefined) {
        ws.dataValidations.add(`${columnLetter}2:${columnLetter}1000`, {
          type: 'decimal',
          operator: 'between',
          allowBlank: true,
          formulae: [column.validation?.min || 0, column.validation?.max || 999999],
          showErrorMessage: true,
          errorTitle: 'Value out of range',
          error: `Must be between ${column.validation?.min} and ${column.validation?.max}`
        });
      }
    }
  }
}
