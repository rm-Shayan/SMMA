import React from "react";

interface Column<T> {
 key: string;
 header: string;
 render?: (row: T, index: number) => React.ReactNode;
 align?: "left" | "center" | "right";
 className?: string;
}

interface DataTableProps<T> {
 columns: Column<T>[];
 data: T[];
 keyExtractor: (row: T, index: number) => string;
 loading?: boolean;
 emptyState?: React.ReactNode;
 className?: string;
}

export function DataTable<T>({
 columns,
 data,
 keyExtractor,
 loading = false,
 emptyState,
 className = "",
}: DataTableProps<T>) {
 if (loading) {
 return (
 <div className="w-full bg-surface-container-lowest rounded-xl border border-outline-variant/40 p-8 flex flex-col items-center justify-center gap-3">
 <div className="w-6 h-6 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
 <span className="font-label-sm text-secondary">Loading records...</span>
 </div>
 );
 }

 if (data.length === 0 && emptyState) {
 return <>{emptyState}</>;
 }

 return (
 <div
 className={`w-full bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-xs overflow-hidden flex flex-col ${className}`}
 >
 <div className="w-full overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-surface-container-low text-secondary font-label-xs text-label-xs uppercase tracking-wider border-b border-outline-variant/30">
 {columns.map((col) => (
 <th
 key={col.key}
 className={`py-3 px-space-md font-semibold ${
 col.align === "right"
 ? "text-right"
 : col.align === "center"
 ? "text-center"
 : "text-left"
 } ${col.className || ""}`}
 >
 {col.header}
 </th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-outline-variant/10 text-on-surface">
 {data.map((row, index) => (
 <tr
 key={keyExtractor(row, index)}
 className="hover:bg-surface-container-low/60 transition-colors group"
 >
 {columns.map((col) => (
 <td
 key={col.key}
 className={`py-3.5 px-space-md text-xs ${
 col.align === "right"
 ? "text-right"
 : col.align === "center"
 ? "text-center"
 : "text-left"
 } ${col.className || ""}`}
 >
 {col.render
 ? col.render(row, index)
 : String((row as Record<string, unknown>)[col.key] ?? "")}
 </td>
 ))}
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 );
}
