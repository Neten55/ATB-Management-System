import { Plus, Trash2, Mail, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import type { ExternalParticipantInput, ReminderTiming } from '@/types'

export const REMINDER_TIMING_LABELS: Record<ReminderTiming, string> = {
  OneDayBefore: '1 Day Before',
  ThreeHoursBefore: '3 Hours Before',
  OneHourBefore: '1 Hour Before',
  ThirtyMinutesBefore: '30 Minutes Before',
  FifteenMinutesBefore: '15 Minutes Before',
}

export const REMINDER_TIMING_OPTIONS = Object.entries(REMINDER_TIMING_LABELS) as [ReminderTiming, string][]

export interface ExternalParticipantsFormState {
  externalParticipants: ExternalParticipantInput[]
  sendEmailNotification: boolean
  reminderTiming: ReminderTiming | ''
}

export const emptyExternalParticipant = (): ExternalParticipantInput => ({
  name: '',
  organization: '',
  email: '',
  phone: '',
})

export const defaultExternalParticipantsState = (): ExternalParticipantsFormState => ({
  externalParticipants: [],
  sendEmailNotification: true,
  reminderTiming: 'OneHourBefore',
})

interface ExternalParticipantsSectionProps {
  state: ExternalParticipantsFormState
  onChange: (state: ExternalParticipantsFormState) => void
  showReminderTiming?: boolean
}

export function ExternalParticipantsSection({
  state,
  onChange,
  showReminderTiming = true,
}: ExternalParticipantsSectionProps) {
  const addParticipant = () => {
    onChange({
      ...state,
      sendEmailNotification: true,
      externalParticipants: [...state.externalParticipants, emptyExternalParticipant()],
    })
  }

  const updateParticipant = (index: number, field: keyof ExternalParticipantInput, value: string) => {
    const updated = state.externalParticipants.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    )
    onChange({ ...state, externalParticipants: updated })
  }

  const removeParticipant = (index: number) => {
    onChange({
      ...state,
      externalParticipants: state.externalParticipants.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="space-y-4 sm:col-span-2 border-t border-border pt-4 mt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">External Participants</Label>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addParticipant}>
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>

      {state.externalParticipants.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          External partners cannot log in. Add them here and keep email notification on so they receive a calendar invitation and join link.
        </p>
      ) : (
        <div className="space-y-3">
          {state.externalParticipants.map((participant, index) => (
            <div key={index} className="grid gap-3 sm:grid-cols-2 rounded-lg border border-border p-3 bg-muted/30">
              <div className="space-y-1">
                <Label className="text-xs">Name</Label>
                <Input
                  value={participant.name}
                  onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Organization / Company</Label>
                <Input
                  value={participant.organization}
                  onChange={(e) => updateParticipant(index, 'organization', e.target.value)}
                  placeholder="Company name"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email Address</Label>
                <Input
                  type="email"
                  value={participant.email}
                  onChange={(e) => updateParticipant(index, 'email', e.target.value)}
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Phone Number (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    value={participant.phone ?? ''}
                    onChange={(e) => updateParticipant(index, 'phone', e.target.value)}
                    placeholder="+975 ..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeParticipant(index)}
                    aria-label="Remove participant"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="sendEmailNotification"
          checked={state.sendEmailNotification}
          onChange={(e) => onChange({ ...state, sendEmailNotification: e.target.checked })}
          className="h-4 w-4 rounded border-border"
        />
        <Label htmlFor="sendEmailNotification" className="flex items-center gap-1.5 cursor-pointer font-normal">
          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
          Send calendar invitation by email
        </Label>
      </div>

      {showReminderTiming && state.sendEmailNotification && (
        <div className="space-y-2">
          <Label>Email Reminder</Label>
          <Select
            value={state.reminderTiming}
            onChange={(e) =>
              onChange({ ...state, reminderTiming: e.target.value as ReminderTiming })
            }
          >
            {REMINDER_TIMING_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground">
            Partners receive an invitation now, then an automatic reminder before the meeting. Put a Zoom/Meet URL in Location to include a join link.
          </p>
        </div>
      )}
    </div>
  )
}

export function buildExternalPayload(state: ExternalParticipantsFormState) {
  const participants = state.externalParticipants.filter((p) => p.name && p.email)
  return {
    externalParticipants: participants.length > 0 ? participants : undefined,
    sendEmailNotification: state.sendEmailNotification && participants.length > 0,
    reminderTiming: state.sendEmailNotification && state.reminderTiming
      ? state.reminderTiming
      : undefined,
  }
}
