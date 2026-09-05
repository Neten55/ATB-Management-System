import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Plus, Pencil, Trash2, CalendarDays } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, Textarea } from '@/components/ui/Select'
import { TimePicker } from '@/components/ui/TimePicker'
import { Badge } from '@/components/ui/Badge'
import { StaffMultiSelect } from '@/components/StaffMultiSelect'
import { schedulesApi } from '@/services/api'
import { mockSchedules, mockDepartments, delay } from '@/services/mockData'
import { formatTime, formatDate, gregorianIsoDate } from '@/lib/utils'
import type { Schedule, Priority } from '@/types'
import { useAuth } from '@/context/AuthContext'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

interface ScheduleForm {
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  departmentId: string
  location: string
  priority: Priority
}

export function SchedulesPage() {
  const { isAdmin } = useAuth()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Schedule | null>(null)
  const [assignedIds, setAssignedIds] = useState<number[]>([])

  const { register, handleSubmit, reset, setValue, control } = useForm<ScheduleForm>()

  const load = async () => {
    setLoading(true)
    try {
      if (USE_MOCK) setSchedules(await delay([...mockSchedules]))
      else setSchedules((await schedulesApi.getAll()).data)
    } catch {
      setSchedules(USE_MOCK ? mockSchedules : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    reset({ title: '', description: '', date: '', startTime: '09:00', endTime: '17:00', departmentId: '', location: '', priority: 'Medium' })
    setAssignedIds([])
    setShowForm(true)
  }

  const openEdit = (s: Schedule) => {
    setEditing(s)
    setValue('title', s.title)
    setValue('description', s.description || '')
    setValue('date', s.date)
    setValue('startTime', s.startTime)
    setValue('endTime', s.endTime)
    setValue('departmentId', String(s.departmentId || ''))
    setValue('location', s.location || '')
    setValue('priority', s.priority)
    setAssignedIds(s.assignedEmployeeIds || [])
    setShowForm(true)
  }

  const onSubmit = async (data: ScheduleForm) => {
    const payload = {
      ...data,
      date: gregorianIsoDate(data.date),
      departmentId: data.departmentId ? Number(data.departmentId) : undefined,
      assignedEmployeeIds: assignedIds,
    }
    if (USE_MOCK) {
      if (editing) {
        setSchedules((prev) => prev.map((s) => s.id === editing.id ? { ...s, ...payload, id: editing.id } as Schedule : s))
      } else {
        setSchedules((prev) => [...prev, { ...payload, id: Date.now(), createdById: 1, createdAt: new Date().toISOString().split('T')[0], assignedEmployeeIds: assignedIds } as Schedule])
      }
    } else {
      if (editing) await schedulesApi.update(editing.id, payload)
      else await schedulesApi.create(payload)
      await load()
    }
    setShowForm(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this schedule?')) return
    if (USE_MOCK) setSchedules((prev) => prev.filter((s) => s.id !== id))
    else { await schedulesApi.delete(id); await load() }
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Only administrators can manage schedules.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Schedule Management</h1>
          <p className="text-muted-foreground text-sm">Create and manage company work schedules</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" />New Schedule</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">{editing ? 'Edit Schedule' : 'Create Schedule'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Title</Label>
                <Input {...register('title', { required: true })} placeholder="Schedule title" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                <Textarea {...register('description')} placeholder="Optional description" />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" {...register('date', { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select {...register('departmentId')}>
                  <option value="">Select department</option>
                  {mockDepartments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Controller
                  name="startTime"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <TimePicker value={field.value} onChange={field.onChange} onBlur={field.onBlur} required />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Controller
                  name="endTime"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <TimePicker value={field.value} onChange={field.onChange} onBlur={field.onBlur} required />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input {...register('location')} placeholder="Location" />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select {...register('priority')}>
                  {(['Low', 'Medium', 'High', 'Critical'] as Priority[]).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </Select>
              </div>
              <StaffMultiSelect
                selectedIds={assignedIds}
                onChange={setAssignedIds}
                label="Assign employees"
              />
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {schedules.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <CalendarDays className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(s.date)}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(s.startTime)} – {formatTime(s.endTime)}</p>
                      {s.location && <p className="text-xs text-muted-foreground">{s.location}</p>}
                    </div>
                  </div>
                  <Badge variant="outline">{s.priority}</Badge>
                </div>
                <div className="flex gap-1 mt-3">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
