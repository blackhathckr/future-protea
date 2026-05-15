/**
 * @fileoverview Toast-based confirmation dialog
 *
 * Replaces the native `window.confirm()` (which shows the ugly browser-styled
 * "localhost:5173 says" dialog) with a styled sonner toast that has explicit
 * Confirm and Cancel buttons.
 *
 * Usage:
 *   const ok = await confirm({ title: 'Delete this team?', confirmLabel: 'Delete' })
 *   if (!ok) return
 */

import { toast } from 'sonner'

export interface ConfirmOptions {
  /** Main prompt — shown as the toast title. */
  title: string
  /** Optional secondary line of context. */
  description?: string
  /** Text of the confirm button. Defaults to "Confirm". */
  confirmLabel?: string
  /** Text of the cancel button. Defaults to "Cancel". */
  cancelLabel?: string
  /**
   * If true, the confirm button is styled as a destructive (red) action.
   * Auto-detected when confirmLabel contains "Delete" / "Remove" / "Discard".
   */
  destructive?: boolean
  /** How long before auto-dismissing as cancel. Defaults to 10s. */
  durationMs?: number
}

const DESTRUCTIVE_KEYWORDS = /\b(delete|remove|discard|undo|abandon)\b/i

/**
 * Show a confirmation toast and resolve to:
 *   - `true`  when the user clicks Confirm
 *   - `false` when the user clicks Cancel, dismisses, or the toast auto-expires
 */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  const {
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    destructive: explicitDestructive,
    durationMs = 10_000,
  } = options

  const isDestructive =
    explicitDestructive ?? DESTRUCTIVE_KEYWORDS.test(confirmLabel + ' ' + title)

  return new Promise<boolean>((resolve) => {
    let settled = false
    const settle = (result: boolean) => {
      if (settled) return
      settled = true
      resolve(result)
    }

    const id = toast(title, {
      description,
      duration: durationMs,
      action: {
        label: confirmLabel,
        onClick: () => settle(true),
      },
      cancel: {
        label: cancelLabel,
        onClick: () => settle(false),
      },
      onDismiss: () => settle(false),
      onAutoClose: () => settle(false),
      classNames: isDestructive
        ? {
            actionButton:
              '!bg-red-600 hover:!bg-red-700 !text-white !border-0',
          }
        : undefined,
    })

    // Return-value escape hatch: ignore the id, sonner handles dismissal.
    void id
  })
}
