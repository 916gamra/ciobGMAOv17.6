export interface ExcelTemplate {
  id: string;
  name: string;
  description: string;
  portalId: 'PDR' | 'PREVENTIVE' | 'ORGANIZATION' | 'FACTORY' | 'ANALYTICS' | 'SETTINGS';
  version: string;
  createdAt: Date;
  updatedAt: Date;
  sheets: ExcelSheet[];
}

export interface ExcelSheet {
  name: string;
  tableName: string;
  columns: ExcelColumn[];
  data?: any[];
  validation?: ValidationRule[];
}

export interface ExcelColumn {
  header: string;
  key: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'enum';
  required: boolean;
  width: number;
  format?: string;
  enum?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface ValidationRule {
  column: string;
  type: 'unique' | 'required' | 'range' | 'pattern' | 'enum';
  value?: any;
  message: string;
}

export interface ExcelImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  errors: ImportError[];
  warnings: ImportWarning[];
  timestamp: Date;
}

export interface ImportError {
  row: number;
  column: string;
  value: any;
  message: string;
  severity: 'error' | 'warning';
}

export interface ImportWarning {
  row: number;
  message: string;
}

export interface ExcelSyncState {
  lastSync: Date;
  syncedRows: number;
  conflicts: SyncConflict[];
  status: 'idle' | 'syncing' | 'error';
}

export interface SyncConflict {
  id: string;
  localVersion: any;
  remoteVersion: any;
  resolvedVersion?: any;
  status: 'pending' | 'resolved';
}

export interface ExcelBackup {
  id: string;
  timestamp: Date;
  portalId: string;
  fileName: string;
  fileSize: number;
  rowCount: number;
  checksum: string;
  data?: string;
}
