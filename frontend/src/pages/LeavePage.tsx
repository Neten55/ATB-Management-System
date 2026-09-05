import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Palmtree, Check, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, Textarea } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { leaveApi } from '@/services/api'
import { mockLeaveRequests, delay } from '@/services/mockData'
import { formatDate, gregorianIsoDate } from '@/lib/utils'
import type { LeaveRequest, LeaveType, LeaveStatus } from '@/types'
import { useAuth } from '@/context/AuthContext'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

const STATUS_VARIANT: Record<LeaveStatus, 'warning' | 'success' | 'destructive'> = {
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'destructive',
}

interface LeaveForm {
  leaveType: LeaveType
  startDate: string
  endDate: string
  reason: string
}

export function LeavePage() {
  const { isAdmin, user } = useAuth()
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const { register, handleSubmit, reset } = useForm<LeaveForm>({
    defaultValues: { leaveType: 'Annual' },
  })

  const load = async () => {
    setLoading(true)
    try {
      if (USE_MOCK) {
        setRequests(await delay([...mockLeaveRequests]))
      } else {
        const res = isAdmin ? await leaveApi.getAll() : await leaveApi.getMy()
        setRequests(res.data)
      }
      } catch {
        setRequests(USE_MOCK ? mockLeaveRequests : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [isAdmin])

  const onSubmit = async (data: LeaveForm) => {
    if (!user?.id) return
    const payload = {
      ...data,
      startDate: gregorianIsoDate(data.startDate),
      endDate: gregorianIsoDate(data.endDate),
      userId: user.id,
      userName: user.fullName,
      status: 'Pending' as LeaveStatus,
    }
    if (USE_MOCK) {
      setRequests((prev) => [...prev, { ...payload, id: Date.now(), createdAt: new Date().toISOString().split('T')[0] }])
    } else {
      await leaveApi.create(payload)
      await load()
    }
    setShowForm(false)
    reset()
  }

  const handleApprove = async (id: number) => {
    if (USE_MOCK) {
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'Approved' as LeaveStatus } : r))
    } else {
      await leaveApi.approve(id)
      await load()
    }
  }

  const handleReject = async (id: number) => {
    if (USE_MOCK) {
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'Rejected' as LeaveStatus } : r))
    } else {
      await leaveApi.reject(id)
      await load()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leave Calendar</h1>
          <p className="text-muted-foreground text-sm">Apply for leave and view team availability</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" />Apply Leave</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Apply for Leave</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Leave Type</Label>
                <Select {...register('leaveType')}>
                  {(['Annual', 'Sick', 'Personal', 'Maternity', 'Paternity', 'Unpaid'] as LeaveType[]).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" {...register('startDate', { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" {...register('endDate', { required: true })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Reason</Label>
                <Textarea {...register('reason')} />
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit">Submit</Button>
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
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No leave requests yet</p>
          ) : (
            requests.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <Palmtree className="h-5 w-5 text-cyan-500 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{r.userName}</p>
                    <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                    <Badge variant="outline">{r.leaveType}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(r.startDate)} – {formatDate(r.endDate)}
                  </p>
                  {r.reason && <p className="text-xs text-muted-foreground mt-1">{r.reason}</p>}
                </div>
                {isAdmin && r.status === 'Pending' && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleApprove(r.id)} title="Approve">
                      <Check className="h-4 w-4 text-emerald-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleReject(r.id)} title="Reject">
                      <X className="h-4 w-4 text-destructive" />
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
