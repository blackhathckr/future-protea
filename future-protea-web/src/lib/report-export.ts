/**
 * @fileoverview Export helpers for the Reports page. Same data, three formats:
 *   - CSV  (vanilla Blob, no deps)
 *   - XLSX (xlsx — already in deps)
 *   - PDF  (jspdf + jspdf-autotable)
 *
 * Every generator takes the same shape: `{ filename, columns, rows }` so the
 * Reports tabs can render one table and stay format-agnostic.
 */

import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface ReportColumn<T = any> {
  /** Heading shown in CSV/XLSX/PDF */
  header: string
  /** Either a key of the row, or a function returning the rendered cell. */
  accessor: keyof T | ((row: T) => string | number | null | undefined)
  /** Optional PDF column width in mm. */
  width?: number
}

export interface ReportPayload<T = any> {
  filename: string
  /** Title printed at the top of the PDF and used in the XLSX sheet name. */
  title?: string
  /** Optional subtitle/description printed under the title in the PDF. */
  subtitle?: string
  columns: ReportColumn<T>[]
  rows: T[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Internals
// ─────────────────────────────────────────────────────────────────────────────

function cellOf<T>(row: T, col: ReportColumn<T>): string {
  const raw = typeof col.accessor === 'function'
    ? (col.accessor as (r: T) => any)(row)
    : (row as any)[col.accessor]
  if (raw == null) return ''
  if (raw instanceof Date) return raw.toISOString()
  return String(raw)
}

function toMatrix<T>(rows: T[], columns: ReportColumn<T>[]): string[][] {
  return rows.map((r) => columns.map((c) => cellOf(r, c)))
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function todayStamp(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function escapeCsv(v: string): string {
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`
  return v
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV
// ─────────────────────────────────────────────────────────────────────────────

export function exportCsv<T>(payload: ReportPayload<T>): void {
  const head = payload.columns.map((c) => escapeCsv(c.header)).join(',')
  const body = toMatrix(payload.rows, payload.columns)
    .map((line) => line.map(escapeCsv).join(','))
    .join('\n')
  const csv = `${head}\n${body}`
  // BOM so Excel opens UTF-8 correctly.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `${payload.filename}_${todayStamp()}.csv`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Excel (.xlsx)
// ─────────────────────────────────────────────────────────────────────────────

export function exportXlsx<T>(payload: ReportPayload<T>): void {
  const aoa: string[][] = [
    payload.columns.map((c) => c.header),
    ...toMatrix(payload.rows, payload.columns),
  ]
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  // Sensible default column widths from header length.
  ws['!cols'] = payload.columns.map((c) => ({ wch: Math.max(c.header.length, 12) }))
  const wb = XLSX.utils.book_new()
  const sheetName = (payload.title ?? 'Report').slice(0, 31)
  XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Report')
  XLSX.writeFile(wb, `${payload.filename}_${todayStamp()}.xlsx`)
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF
// ─────────────────────────────────────────────────────────────────────────────

export function exportPdf<T>(payload: ReportPayload<T>): void {
  const orientation = payload.columns.length > 6 ? 'landscape' : 'portrait'
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' })

  // Title block
  const title = payload.title ?? 'Future Protea Report'
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 14, 16)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(110)
  const headerLines = [
    payload.subtitle,
    `Generated ${new Date().toLocaleString()}`,
    `${payload.rows.length} row${payload.rows.length === 1 ? '' : 's'}`,
  ].filter(Boolean) as string[]
  doc.text(headerLines, 14, 22)

  autoTable(doc, {
    startY: 22 + headerLines.length * 4 + 4,
    head: [payload.columns.map((c) => c.header)],
    body: toMatrix(payload.rows, payload.columns),
    styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: [16, 122, 90], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 246] },
    columnStyles: Object.fromEntries(
      payload.columns
        .map((c, i) => (c.width ? [i, { cellWidth: c.width }] : null))
        .filter(Boolean) as [number, { cellWidth: number }][],
    ),
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      const pageSize = doc.internal.pageSize
      const pageHeight = pageSize.height ?? pageSize.getHeight()
      doc.setFontSize(8)
      doc.setTextColor(140)
      doc.text(
        `Page ${data.pageNumber}  ·  Future Protea Cricket Admin`,
        14,
        pageHeight - 8,
      )
    },
  })

  doc.save(`${payload.filename}_${todayStamp()}.pdf`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Public entrypoint used by ReportsPage
// ─────────────────────────────────────────────────────────────────────────────

export type ReportFormat = 'csv' | 'xlsx' | 'pdf'

export function exportReport<T>(format: ReportFormat, payload: ReportPayload<T>): void {
  if (format === 'csv') return exportCsv(payload)
  if (format === 'xlsx') return exportXlsx(payload)
  if (format === 'pdf') return exportPdf(payload)
}
