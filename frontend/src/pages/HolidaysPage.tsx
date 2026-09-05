import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Plane, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Select'
import { holidaysApi } from '@/services/api'
import { mockHolidays, delay } from '@/services/mockData'
import { formatDate, gregorianIsoDate } from '@/lib/utils'
import type { Holiday } from '@/types'
import { useAuth } from '@/context/AuthContext'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

interface HolidayForm {
  name: string
  date: string
  description: string
  isRecurring: string
}

export function HolidaysPage() {
  const { isAdmin } = useAuth()
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const { register, handleSubmit, reset } = useForm<HolidayForm>({
    defaultValues: { isRecurring: 'true' },
  })

  useEffect(() => {
    const load = async () => {
      try {
        if (USE_MOCK) setHolidays(await delay([...mockHolidays]))
        else setHolidays((await holidaysApi.getAll()).data)
      } catch {
        setHolidays(USE_MOCK ? mockHolidays : [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const onSubmit = async (data: HolidayForm) => {
    const payload = { ...data, date: gregorianIsoDate(data.date), isRecurring: data.isRecurring === 'true' }
    if (USE_MOCK) {
      setHolidays((prev) => [...prev, { ...payload, id: Date.now() }])
    } else {
      await holidaysApi.create(payload)
      setHolidays((await holidaysApi.getAll()).data)
    }
    setShowForm(false)
    reset()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this holiday?')) return
    if (USE_MOCK) setHolidays((prev) => prev.filter((h) => h.id !== id))
    else { await holidaysApi.delete(id); setHolidays((await holidaysApi.getAll()).data) }
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Holidays</h1>
          <p className="text-muted-foreground text-sm">Company and public holidays</p>
        </div>
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {holidays.map((h) => <HolidayCard key={h.id} holiday={h} />)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Holiday Management</h1>
          <p className="text-muted-foreground text-sm">Manage company holidays</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" />Add Holiday</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Add Holiday</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Name</Label>
                <Input {...register('name', { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" {...register('date', { required: true })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                <Textarea {...register('description')} />
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit">Add</Button>
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {holidays.map((h) => (
            <div key={h.id} className="relative">
              <HolidayCard holiday={h} />
              <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={() => handleDelete(h.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function HolidayCard({ holiday }: { holiday: Holiday }) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <Plane className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">{holiday.name}</p>
          <p className="text-sm text-muted-foreground">{formatDate(holiday.date)}</p>
          {holiday.description && <p className="text-xs text-muted-foreground mt-1">{holiday.description}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
