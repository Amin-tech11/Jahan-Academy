import type { RecordData } from "./admin-api";
import { columnText } from "./admin-lead-table";
import { labels } from "./admin-resources";

export async function leadWorkbook(rows: RecordData[], columns: string[]) {
  if (rows.length > 1048575) throw new Error("تعداد رکوردها از ظرفیت یک برگهٔ اکسل بیشتر است؛ بازهٔ فیلتر را محدود کنید.");
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("درخواست‌های مشاوره", { views: [{ rightToLeft: true, state: "frozen", ySplit: 1 }] });
  sheet.columns = columns.map(key => ({ header: labels[key] ?? key, key, width: key === "reference" ? 28 : 24 }));
  rows.forEach(row => sheet.addRow(columns.map(column => columnText(row, column))));
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, rows.length + 1), column: columns.length } };
  sheet.eachRow((row, index) => {
    row.eachCell(cell => {
      // Explicit text cells keep phone prefixes and prevent formula injection.
      cell.numFmt = "@";
      cell.alignment = { horizontal: index === 1 ? "center" : "right", vertical: "middle" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: index === 1 ? "FF123B78" : index % 2 === 1 ? "FFF0F4FA" : "FFFFFFFF" } };
      cell.font = { name: "Arial", size: 11, bold: index === 1, color: { argb: index === 1 ? "FFFFFFFF" : "FF172B4D" } };
    });
    row.height = index === 1 ? 30 : 24;
  });
  return workbook.xlsx.writeBuffer();
}
