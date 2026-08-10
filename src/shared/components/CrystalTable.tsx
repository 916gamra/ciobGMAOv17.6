import React from 'react';
import { cn } from '@/shared/utils';

export interface CrystalTableColumn<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface CrystalTableProps<T> {
  data: T[];
  columns: CrystalTableColumn<T>[];
  rowKey: (item: T) => string | number;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (item: T) => void;
}

export function CrystalTable<T>({
  data,
  columns,
  rowKey,
  emptyMessage = "لا توجد بيانات متاحة للعرض",
  className,
  onRowClick
}: CrystalTableProps<T>) {
  return (
    <div className={cn("overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl custom-scrollbar", className)}>
      <table className="w-full text-right border-collapse dir-rtl" dir="rtl">
        <thead>
          <tr className="bg-white/[0.04] border-b border-white/10 text-slate-300 font-bold uppercase tracking-wider text-xs">
            {columns.map((col) => (
              <th 
                key={col.key} 
                className={cn("px-6 py-4 text-right font-extrabold select-none whitespace-nowrap", col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500 font-bold">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr 
                key={rowKey(item)}
                onClick={() => onRowClick && onRowClick(item)}
                className={cn(
                  "border-b border-white/5 transition-colors duration-150",
                  onRowClick ? "cursor-pointer hover:bg-white/[0.04]" : "hover:bg-white/[0.02]"
                )}
              >
                {columns.map((col) => (
                  <td 
                    key={col.key} 
                    className={cn("px-6 py-4 text-slate-300 text-sm font-semibold whitespace-nowrap", col.className)}
                  >
                    {col.render ? col.render(item) : (item[col.key as keyof T] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
