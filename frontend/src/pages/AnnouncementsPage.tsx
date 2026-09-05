import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Megaphone, Trash2, Pin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { announcementsApi } from '@/services/api'
import { mockAnnouncements, delay } from '@/services/mockData'
import { formatDate } from '@/lib/utils'
import type { Announcement } from '@/types'
import { useAuth } from '@/context/AuthContext'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

interface AnnouncementForm {
  title: string
  content: string
  isPinned: string
  isUrgent: string
}

export function AnnouncementsPage() {
  const { isAdmin } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const { register, handleSubmit, reset } = useForm<AnnouncementForm>({
    defaultValues: { isPinned: 'false', isUrgent: 'false' },
  })

  useEffect(() => {
    const load = async () => {
      try {
        if (USE_MOCK) setAnnouncements(await delay([...mockAnnouncements]))
        else setAnnouncements((await announcementsApi.getAll()).data)
      } catch {
        setAnnouncements(USE_MOCK ? mockAnnouncements : [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const onSubmit = async (data: AnnouncementForm) => {
    const payload = {
      title: data.title,
      content: data.content,
      isPinned: data.isPinned === 'true',
      isUrgent: data.isUrgent === 'true',
      createdById: 1,
      createdByName: 'Admin',
    }
    if (USE_MOCK) {
      setAnnouncements((prev) => [{ ...payload, id: Date.now(), createdAt: new Date().toISOString().split('T')[0] }, ...prev])
    } else {
      await announcementsApi.create(payload)
      setAnnouncements((await announcementsApi.getAll()).data)
    }
    setShowForm(false)
    reset()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this announcement?')) return
    if (USE_MOCK) setAnnouncements((prev) => prev.filter((a) => a.id !== id))
    else { await announcementsApi.delete(id); setAnnouncements((await announcementsApi.getAll()).data) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="text-muted-foreground text-sm">Company notices and updates</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" />Post Announcement</Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Post Announcement</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input {...register('title', { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea {...register('content', { required: true })} rows={4} />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register('isPinned')} value="true" /> Pin to top
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register('isUrgent')} value="true" /> Mark as urgent
                </label>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Publish</Button>
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
        <div className="space-y-4">
          {announcements.map((a) => (
            <Card key={a.id} className={a.isUrgent ? 'border-destructive/50' : ''}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Megaphone className={`h-5 w-5 mt-0.5 flex-shrink-0 ${a.isUrgent ? 'text-destructive' : 'text-primary'}`} />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{a.title}</h3>
                        {a.isPinned && <Pin className="h-3.5 w-3.5 text-muted-foreground" />}
                        {a.isUrgent && <Badge variant="destructive">Urgent</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{a.content}</p>
                      <p className="text-xs text-muted-foreground mt-3">
                        {a.createdByName} · {formatDate(a.createdAt)}
                      </p>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
