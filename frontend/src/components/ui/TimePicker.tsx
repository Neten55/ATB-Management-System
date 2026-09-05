import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/utils'

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

type Meridiem = 'AM' | 'PM'

function parseTime(value?: string) {
  if (!value) return { hour: '', minute: '', ampm: '' as '' | Meridiem }
  const [hStr, mStr] = value.split(':')
  const h = Number.parseInt(hStr ?? '', 10)
  if (Number.isNaN(h)) return { hour: '', minute: '', ampm: '' as '' | Meridiem }
  return {
    hour: String(h % 12 || 12),
    minute: (mStr ?? '00').slice(0, 2).padStart(2, '0'),
    ampm: (h >= 12 ? 'PM' : 'AM') as Meridiem,
  }
}

function to24Hour(hour: string, minute: string, ampm: '' | Meridiem) {
  if (!hour) return ''
  let h = Number.parseInt(hour, 10)
  const period = ampm || 'AM'
  if (period === 'AM') h = h === 12 ? 0 : h
  else h = h === 12 ? 12 : h + 12
  return `${String(h).padStart(2, '0')}:${minute || '00'}`
}

interface TimePickerProps {
  value?: string
  onChange?: (value: string) => void
  onBlur?: () => void
  name?: string
  required?: boolean
  allowEmpty?: boolean
  id?: string
  className?: string
}

export function TimePicker({
  value,
  onChange,
  onBlur,
  name,
  required,
  allowEmpty = !required,
  id,
  className,
}: TimePickerProps) {
  const parsed = parseTime(value)

  const emit = (hour: string, minute: string, ampm: '' | Meridiem) => {
    if (!hour) {
      onChange?.('')
      return
    }
    onChange?.(to24Hour(hour, minute || '00', ampm || 'AM'))
  }

  return (
    <div className={cn('grid grid-cols-[1fr_1fr_5.5rem] gap-2', className)}>
      <Select
        id={id}
        name={name ? `${name}-hour` : undefined}
        aria-label="Hour"
        required={required}
        value={parsed.hour}
        onBlur={onBlur}
        onChange={(e) =>
          emit(e.target.value, parsed.minute || '00', parsed.ampm || 'AM')
        }
      >
        <option value="" disabled={!allowEmpty}>
          Hour
        </option>
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </Select>
      <Select
        aria-label="Minute"
        required={required && !!parsed.hour}
        value={parsed.minute}
        onBlur={onBlur}
        onChange={(e) =>
          emit(parsed.hour || '12', e.target.value, parsed.ampm || 'AM')
        }
      >
        <option value="" disabled={!allowEmpty}>
          Min
        </option>
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </Select>
      <Select
        aria-label="AM or PM"
        required={required && !!parsed.hour}
        value={parsed.ampm}
        onBlur={onBlur}
        onChange={(e) =>
          emit(parsed.hour || '12', parsed.minute || '00', e.target.value as Meridiem)
        }
      >
        <option value="" disabled={!allowEmpty}>
          AM/PM
        </option>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </Select>
    </div>
  )
}
