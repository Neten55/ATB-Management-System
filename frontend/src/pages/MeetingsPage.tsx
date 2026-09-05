import { useCallback, useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Plus, Users, MapPin, Clock, Mail, Pencil, Trash2, ChevronLeft, ChevronRight, Save } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, Textarea } from '@/components/ui/Select'
import { TimePicker } from '@/components/ui/TimePicker'
import { Dialog } from '@/components/ui/Dialog'
import { meetingsApi } from '@/services/api'
import { apiErrorMessage } from '@/lib/api'
import { mockMeetings, delay } from '@/services/mockData'
import { formatTime, formatDate, gregorianIsoDate } from '@/lib/utils'
import type { Meeting } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { StaffMultiSelect } from '@/components/StaffMultiSelect'
import {
  ExternalParticipantsSection,
  buildExternalPayload,
  defaultExternalParticipantsState,
  type ExternalParticipantsFormState,
} from '@/components/ExternalParticipantsSection'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

const STEPS = ['Details', 'Venue', 'Participants'] as const

interface MeetingForm {
  title: string
  description: string
  meetingDate: string
  startTime: string
  endTime: string
  venue: 'online' | 'offline'
  location: string
}

const emptyForm: MeetingForm = {
  title: '',
  description: '',
  meetingDate: '',
  startTime: '10:00',
  endTime: '11:00',
  venue: 'online',
  location: '',
}

function inferVenue(location?: string): 'online' | 'offline' {
  if (!location) return 'online'
  const value = location.trim().toLowerCase()
  if (value.startsWith('http://') || value.startsWith('https://')) return 'online'
  if (value.includes('zoom.') || value.includes('meet.') || value.includes('teams.')) return 'online'
  return 'offline'
}

export function MeetingsPage() {
  const { isAdmin, user } = useAuth()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [editing, setEditing] = useState<Meeting | null>(null)
  const [saving, setSaving] = useState(false)
  const [externalState, setExternalState] = useState<ExternalParticipantsFormState>(
    defaultExternalParticipantsState()
  )
  const [notice, setNotice] = useState('')
  const [noticeError, setNoticeError] = useState(false)
  const [participantIds, setParticipantIds] = useState<number[]>([])

  const { register, handleSubmit, reset, control, watch, setValue, getValues } = useForm<MeetingForm>({
    defaultValues: emptyForm,
    shouldUnregister: false,
  })
  const venue = watch('venue')
  const [stepError, setStepError] = useState('')

  const reloadMeetings = async () => {
    if (USE_MOCK) {
      setMeetings(await delay([...mockMeetings]))
      return
    }
    const list = (await meetingsApi.getAll()).data
    setMeetings(Array.isArray(list) ? list : [])
  }

  const load = async () => {
    setLoading(true)
    try {
      await reloadMeetings()
    } catch {
      setMeetings(USE_MOCK ? mockMeetings : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const closeModal = useCallback(() => {
    setOpen(false)
    setEditing(null)
    setStep(0)
    setStepError('')
    reset(emptyForm)
    setExternalState(defaultExternalParticipantsState())
    setParticipantIds([])
  }, [reset])

  const openCreate = () => {
    setEditing(null)
    setStep(0)
    setStepError('')
    reset(emptyForm)
    setParticipantIds(user?.id ? [user.id] : [])
    setExternalState(defaultExternalParticipantsState())
    setOpen(true)
  }

  const openEdit = (meeting: Meeting) => {
    setEditing(meeting)
    setStep(0)
    setStepError('')
    reset({
      title: meeting.title,
      description: meeting.description || '',
      meetingDate: meeting.meetingDate.slice(0, 10),
      startTime: meeting.startTime.slice(0, 5),
      endTime: meeting.endTime.slice(0, 5),
      venue: inferVenue(meeting.location),
      location: meeting.location || '',
    })
    setParticipantIds(meeting.participantIds || [])
    setExternalState({
      ...defaultExternalParticipantsState(),
      sendEmailNotification: meeting.sendEmailNotification ?? true,
      reminderTiming: meeting.reminderTiming || 'OneHourBefore',
      externalParticipants: (meeting.externalParticipants || []).map((p) => ({
        name: p.name,
        organization: p.organization,
        email: p.email,
        phone: p.phone || '',
      })),
    })
    setOpen(true)
  }

  const validateStep = (current: number) => {
    const values = getValues()
    if (current === 0) {
      if (!values.title?.trim()) {
        setStepError('Enter a meeting title.')
        return false
      }
      if (!values.meetingDate) {
        setStepError('Choose a date.')
        return false
      }
      if (!values.startTime || !values.endTime) {
        setStepError('Choose a start and end time.')
        return false
      }
    }
    if (current === 1) {
      if (!values.location?.trim()) {
        setStepError(values.venue === 'offline' ? 'Enter a location.' : 'Enter a Zoom or Meet link.')
        return false
      }
    }
    setStepError('')
    return true
  }

  const goNext = () => {
    if (!validateStep(step)) return
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const goBack = () => {
    setStepError('')
    setStep((s) => Math.max(s - 1, 0))
  }

  const onSave = async (data: MeetingForm) => {
    if (!validateStep(0) || !validateStep(1)) {
      if (!getValues().title?.trim() || !getValues().meetingDate) setStep(0)
      else setStep(1)
      return
    }
    const external = buildExternalPayload(externalState)
    const { venue: _venue, ...fields } = data
    const attendees = user?.id && !participantIds.includes(user.id)
      ? [...participantIds, user.id]
      : participantIds
    const payload = {
      ...fields,
      meetingDate: gregorianIsoDate(data.meetingDate),
      participantIds: attendees,
      ...external,
    }
    setNotice('')
    setNoticeError(false)
    setSaving(true)
    try {
      if (USE_MOCK) {
        if (editing) {
          setMeetings((prev) => prev.map((m) => m.id === editing.id ? { ...m, ...payload, id: editing.id } as Meeting : m))
          setNotice('Meeting updated.')
        } else {
          setMeetings((prev) => [...prev, {
            ...payload,
            id: Date.now(),
            createdById: 1,
            participantIds,
            createdAt: new Date().toISOString().split('T')[0],
            externalParticipants: external.externalParticipants?.map((p, i) => ({ ...p, id: i + 1 })),
          } satisfies Meeting])
          setNotice('Meeting created.')
        }
      } else if (editing) {
        await meetingsApi.update(editing.id, payload)
        await reloadMeetings()
        setNotice('Meeting updated.')
      } else {
        const res = await meetingsApi.create(payload)
        try {
          await reloadMeetings()
        } catch {
          if (res.data) setMeetings((prev) => [...prev.filter((m) => m.id !== res.data.id), res.data])
        }
        if (res.data.invitationEmailMessage) {
          setNoticeError(res.data.invitationEmailsSent === false && !!external.externalParticipants?.length)
          setNotice(res.data.invitationEmailMessage)
        } else {
          setNotice('Meeting created.')
        }
      }
      closeModal()
    } catch (error) {
      setNoticeError(true)
      setNotice(apiErrorMessage(error, editing ? 'Could not update the meeting.' : 'Could not create the meeting. Check the form and try again.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this meeting?')) return
    try {
      if (USE_MOCK) setMeetings((prev) => prev.filter((m) => m.id !== id))
      else {
        await meetingsApi.delete(id)
        await load()
      }
      setNotice('Meeting deleted.')
      setNoticeError(false)
    } catch {
      setNoticeError(true)
      setNotice('Could not delete the meeting.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meetings</h1>
          <p className="text-muted-foreground text-sm">
            {isAdmin ? 'View and schedule team meetings' : 'Create a meeting and invite other employees'}
          </p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" />New Meeting</Button>
      </div>

      {notice && (
        <div className={`rounded-md px-3 py-2 text-sm ${noticeError ? 'bg-destructive/10 text-destructive' : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>
          {notice}
        </div>
      )}

      <Dialog
        open={open}
        onClose={closeModal}
        title={editing ? 'Edit meeting' : 'New meeting'}
        description={`${STEPS[step]} · Step ${step + 1} of ${STEPS.length}`}
      >
        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault()
            if (step < STEPS.length - 1) goNext()
            else handleSubmit(onSave)()
          }}
        >
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="mb-4 flex gap-2">
              {STEPS.map((label, i) => (
                <div key={label} className="flex-1">
                  <div className={`h-1.5 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
                  <p className={`mt-1.5 text-xs ${i === step ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{label}</p>
                </div>
              ))}
            </div>

            {stepError && (
              <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{stepError}</p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {step === 0 && (
                <>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Title</Label>
                    <Input {...register('title')} placeholder="Meeting title" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Description</Label>
                    <Textarea {...register('description')} placeholder="What is this meeting about?" />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" {...register('meetingDate')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Controller
                      name="startTime"
                      control={control}
                      render={({ field }) => (
                        <TimePicker value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                      )}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>End Time</Label>
                    <Controller
                      name="endTime"
                      control={control}
                      render={({ field }) => (
                        <TimePicker value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                      )}
                    />
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Venue</Label>
                    <Select
                      {...register('venue', {
                        onChange: () => setValue('location', ''),
                      })}
                    >
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>{venue === 'offline' ? 'Location' : 'Meeting link'}</Label>
                    <Input
                      {...register('location')}
                      placeholder={venue === 'offline' ? 'Enter location' : 'Enter Zoom or Meet link'}
                    />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <StaffMultiSelect
                    selectedIds={participantIds}
                    onChange={setParticipantIds}
                    label="Invite employees"
                  />
                  <ExternalParticipantsSection state={externalState} onChange={setExternalState} />
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-6 py-4">
            <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={goBack} disabled={step === 0}>
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button type="submit">
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save meeting'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Dialog>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {isAdmin ? 'No meetings yet' : 'You have no meetings yet'}
            </p>
          ) : (
            meetings.map((m) => (
              <Card key={m.id}>
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-2.5">
                    <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{m.title}</p>
                    {m.description && <p className="text-sm text-muted-foreground mt-1">{m.description}</p>}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(m.meetingDate)} · {formatTime(m.startTime)} – {formatTime(m.endTime)}</span>
                      {m.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{m.location}</span>}
                    </div>
                    {m.participantNames && m.participantNames.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">Participants: {m.participantNames.join(', ')}</p>
                    )}
                    {m.externalParticipants && m.externalParticipants.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        External: {m.externalParticipants.map((p) => p.name).join(', ')}
                        {m.sendEmailNotification && ' (invited by email)'}
                      </p>
                    )}
                  </div>
                  {(isAdmin || m.createdById === user?.id) && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(m)} title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)} title="Delete">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
