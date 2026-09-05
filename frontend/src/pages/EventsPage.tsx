import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, PartyPopper, Trash2, Mail } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, Textarea } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { eventsApi } from '@/services/api'
import { mockEvents, delay } from '@/services/mockData'
import { formatDate, gregorianIsoDate } from '@/lib/utils'
import type { CompanyEvent, EventCategory } from '@/types'
import { EVENT_CATEGORY_LABELS } from '@/types'
import { useAuth } from '@/context/AuthContext'
import {
  ExternalParticipantsSection,
  buildExternalPayload,
  defaultExternalParticipantsState,
  type ExternalParticipantsFormState,
} from '@/components/ExternalParticipantsSection'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

interface EventForm {
  title: string
  description: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  location: string
  category: EventCategory
  isAllDay: string
}

export function EventsPage() {
  const { isAdmin } = useAuth()
  const [events, setEvents] = useState<CompanyEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [externalState, setExternalState] = useState<ExternalParticipantsFormState>(
    defaultExternalParticipantsState()
  )

  const { register, handleSubmit, reset } = useForm<EventForm>({
    defaultValues: { category: 'CompanyEvent', isAllDay: 'false' },
  })

  useEffect(() => {
    const load = async () => {
      try {
        if (USE_MOCK) setEvents(await delay([...mockEvents]))
        else setEvents((await eventsApi.getAll()).data)
      } catch {
        setEvents(USE_MOCK ? mockEvents : [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const onSubmit = async (data: EventForm) => {
    const external = buildExternalPayload(externalState)
    const payload = {
      ...data,
      startDate: gregorianIsoDate(data.startDate),
      endDate: gregorianIsoDate(data.endDate),
      isAllDay: data.isAllDay === 'true',
      ...external,
    }
    if (USE_MOCK) {
      setEvents((prev) => [...prev, {
        ...payload,
        id: Date.now(),
        createdById: 1,
        createdAt: new Date().toISOString().split('T')[0],
        externalParticipants: external.externalParticipants?.map((p, i) => ({ ...p, id: i + 1 })),
      } satisfies CompanyEvent])
      if (external.externalParticipants?.length) {
        window.alert('Demo mode cannot send email. Start the API with SMTP configured so partners receive the calendar invitation.')
      }
    } else {
      const res = await eventsApi.create(payload)
      setEvents((await eventsApi.getAll()).data)
      if (res.data.invitationEmailMessage) window.alert(res.data.invitationEmailMessage)
    }
    setShowForm(false)
    reset()
    setExternalState(defaultExternalParticipantsState())
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this event?')) return
    if (USE_MOCK) setEvents((prev) => prev.filter((e) => e.id !== id))
    else { await eventsApi.delete(id); setEvents((await eventsApi.getAll()).data) }
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Company Events</h1>
          <p className="text-muted-foreground text-sm">Upcoming company events and activities</p>
        </div>
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Company Events</h1>
          <p className="text-muted-foreground text-sm">Manage company-wide events</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" />New Event</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Create Event</CardTitle></CardHeader>
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
                <Label>Start Date</Label>
                <Input type="date" {...register('startDate', { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" {...register('endDate', { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select {...register('category')}>
                  {(['CompanyEvent', 'Training', 'Workshop', 'Holiday'] as EventCategory[]).map((c) => (
                    <option key={c} value={c}>{EVENT_CATEGORY_LABELS[c]}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input {...register('location')} />
              </div>
              <div className="space-y-2">
                <Label>All Day</Label>
                <Select {...register('isAllDay')}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </Select>
              </div>
              <ExternalParticipantsSection state={externalState} onChange={setExternalState} />
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
          {events.map((e) => (
            <div key={e.id} className="relative">
              <EventCard event={e} />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 top-3"
                onClick={() => handleDelete(e.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EventCard({ event }: { event: CompanyEvent }) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-4">
        <div className="rounded-lg bg-violet-100 dark:bg-violet-900/30 p-2.5">
          <PartyPopper className="h-5 w-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{event.title}</p>
            <Badge variant="secondary">{EVENT_CATEGORY_LABELS[event.category]}</Badge>
          </div>
          {event.description && <p className="text-sm text-muted-foreground mt-1">{event.description}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            {formatDate(event.startDate)} – {formatDate(event.endDate)}
            {event.location && ` · ${event.location}`}
          </p>
          {event.externalParticipants && event.externalParticipants.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Mail className="h-3 w-3" />
              External: {event.externalParticipants.map((p) => p.name).join(', ')}
              {event.sendEmailNotification && ' (invited by email)'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
