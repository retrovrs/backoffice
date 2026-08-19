'use client'

import * as React from 'react'
import { Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface DateInputUSProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  /** ISO value in `YYYY-MM-DD` — the same shape the surrounding form state uses. */
  value: string
  /** Fires with the new value in `YYYY-MM-DD`, or `''` while the date is incomplete. */
  onValueChange: (isoDate: string) => void
  /**
   * Classes for the outer wrapper (width/margin, e.g. `max-w-xs`). `className`
   * itself is applied to the text input so its visual styling (colors,
   * borders) still targets what's actually visible — but width/margin on the
   * input alone wouldn't constrain the calendar button, which is positioned
   * against the wrapper.
   */
  wrapperClassName?: string
}

function isoToDisplay(iso: string): string {
  const [year, month, day] = iso.split('-')
  if (!year || !month || !day) return ''
  return `${month}/${day}/${year}`
}

function digitsToDisplay(digits: string): string {
  const mm = digits.slice(0, 2)
  const dd = digits.slice(2, 4)
  const yyyy = digits.slice(4, 8)
  return [mm, dd, yyyy].filter(Boolean).join('/')
}

/**
 * A text input always displayed and typed as US MM/DD/YYYY, regardless of the
 * browser/OS locale — `<input type="date">` cannot be forced into a fixed
 * display format, it always follows the system locale.
 *
 * A calendar button next to it opens the browser's native date picker (kept
 * as a visually-hidden `<input type="date">`) so users can still pick a date
 * visually; picking one fills the text field in US format. The value emitted
 * (and accepted) is ISO `YYYY-MM-DD` either way, so callers don't need to
 * change how they store or submit the date.
 */
export const DateInputUS = React.forwardRef<HTMLInputElement, DateInputUSProps>(
  ({ value, onValueChange, className, wrapperClassName, onBlur, id, ...props }, ref) => {
    const [text, setText] = React.useState(() => isoToDisplay(value))
    const pickerRef = React.useRef<HTMLInputElement>(null)

    // Keep the displayed text in sync when the value changes from outside
    // (e.g. loading the post, or a reset), but not while the user is typing.
    const isFocusedRef = React.useRef(false)
    React.useEffect(() => {
      if (!isFocusedRef.current) {
        setText(isoToDisplay(value))
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
      setText(digitsToDisplay(digits))

      if (digits.length === 8) {
        const mm = digits.slice(0, 2)
        const dd = digits.slice(2, 4)
        const yyyy = digits.slice(4, 8)
        onValueChange(`${yyyy}-${mm}-${dd}`)
      } else {
        onValueChange('')
      }
    }

    const openPicker = () => {
      const picker = pickerRef.current
      if (!picker) return
      if (typeof picker.showPicker === 'function') {
        picker.showPicker()
      } else {
        picker.focus()
      }
    }

    return (
      <div className={cn('relative', wrapperClassName)}>
        <Input
          {...props}
          id={id}
          ref={ref}
          type="text"
          inputMode="numeric"
          placeholder="MM/DD/YYYY"
          value={text}
          onChange={handleChange}
          onFocus={() => { isFocusedRef.current = true }}
          onBlur={(e) => {
            isFocusedRef.current = false
            setText(isoToDisplay(value))
            onBlur?.(e)
          }}
          className={cn('w-full pr-8 font-mono tabular-nums', className)}
        />
        <button
          type="button"
          aria-label="Open calendar"
          onClick={openPicker}
          tabIndex={-1}
          className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <Calendar className="h-4 w-4" />
        </button>
        <input
          ref={pickerRef}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          value={value || ''}
          onChange={(e) => onValueChange(e.target.value)}
          className="absolute inset-0 h-full w-full opacity-0 pointer-events-none"
        />
      </div>
    )
  }
)
DateInputUS.displayName = 'DateInputUS'
