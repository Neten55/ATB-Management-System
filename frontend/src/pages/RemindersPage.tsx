import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Plus, Bell, Trash2, Mail } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, Textarea } from '@/components/ui/Select'
import { TimePicker } from '@/components/ui/TimePicker'
import { Badge } from '@/components/ui/Badge'
import { remindersApi } from '@/services/api'
import { mockReminders, delay } from '@/services/mockData'
import { formatDate, gregorianIsoDate } from '@/lib/utils'
import type { Reminder, ReminderTiming } from '@/types'
import { useAuth } from '@/context/AuthContext'
import {
  ExternalParticipantsSection,
  REMINDER_TIMING_LABELS,
  buildExternalPayload,
  defaultExternalParticipantsState,
  type ExternalParticipantsFormState,
} from '@/components/ExternalParticipantsSection'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

interface ReminderForm {
  title: string
  description: string
  reminderDate: string
  reminderTime: string
  timing: ReminderTiming
  isCompanyWide: string
}

export function RemindersPage() {
  const { isAdmin, user } = useAuth()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [externalState, setExternalState] = useState<ExternalParticipantsFormState>(
    defaultExternalParticipantsState()
  )

  const { register, handleSubmit, reset, control } = useForm<ReminderForm>({
    defaultValues: { timing: 'OneHourBefore', isCompanyWide: 'false' },
  })

  useEffect(() => {
    const load = async () => {
      try {
        if (USE_MOCK) setReminders(await delay([...mockReminders]))
        else setReminders((await remindersApi.getAll()).data)
      } catch {
        setReminders(USE_MOCK ? mockReminders : [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const onSubmit = async (data: ReminderForm) => {
    const external = buildExternalPayload(externalState)
    const payload = {
      title: data.title,
      description: data.description,
      reminderDate: gregorianIsoDate(data.reminderDate),
      reminderTime: data.reminderTime || undefined,
      timing: external.reminderTiming || data.timing,
      isCompanyWide: data.isCompanyWide === 'true',
      userId: data.isCompanyWide === 'true' ? undefined : user?.id,
      ...external,
    }
    if (USE_MOCK) {
      setReminders((prev) => [...prev, {
        ...payload,
        id: Date.now(),
        createdById: user?.id || 1,
        createdAt: new Date().toISOString().split('T')[0],
        externalParticipants: external.externalParticipants?.map((p, i) => ({ ...p, id: i + 1 })),
      } satisfies Reminder])
      if (external.externalParticipants?.length) {
        window.alert('Demo mode cannot send email. Start the API with SMTP configured so partners receive the calendar invitation.')
      }
    } else {
      const res = await remindersApi.create(payload)
      setReminders((await remindersApi.getAll()).data)
      if (res.data.invitationEmailMessage) window.alert(res.data.invitationEmailMessage)
    }
    setShowForm(false)
    reset()
    setExternalState(defaultExternalParticipantsState())
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this reminder?')) return
    if (USE_MOCK) setReminders((prev) => prev.filter((r) => r.id !== id))
    else { await remindersApi.delete(id); setReminders((await remindersApi.getAll()).data) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reminders</h1>
          <p className="text-muted-foreground text-sm">Personal and company reminders</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" />New Reminder</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Create Reminder</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Title</Label>
                <Input {...register('title', { required: true })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                <Textarea {...register('description')} />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" {...register('reminderDate', { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>Time (optional)</Label>
                <Controller
                  name="reminderTime"
                  control={control}
                  render={({ field }) => (
                    <TimePicker value={field.value} onChange={field.onChange} onBlur={field.onBlur} allowEmpty />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Notify (Portal)</Label>
                <Select {...register('timing')}>
                  {Object.entries(REMINDER_TIMING_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </Select>
              </div>
              {isAdmin && (
                <div className="space-y-2">
                  <Label>Scope</Label>
                  <Select {...register('isCompanyWide')}>
                    <option value="false">Personal</option>
                    <option value="true">Company-wide</option>
                  </Select>
                </div>
              )}
              {isAdmin && (
                <ExternalParticipantsSection state={externalState} onChange={setExternalState} />
              )}
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit">Create</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <Bell className="h-5 w-5 text-amber-500 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{r.title}</p>
                    {r.isCompanyWide && <Badge variant="secondary">Company</Badge>}
                  </div>
                  {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(r.reminderDate)}{r.reminderTime && ` at ${r.reminderTime}`} · Notify {REMINDER_TIMING_LABELS[r.timing]}
                  </p>
                  {r.externalParticipants && r.externalParticipants.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      External: {r.externalParticipants.map((p) => p.name).join(', ')}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
