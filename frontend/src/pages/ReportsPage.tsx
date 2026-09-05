import { useEffect, useRef, useState } from 'react'
import {
  type LucideIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  File as FileIcon,
  FileImage,
  FileSpreadsheet,
  FileText,
  History,
  MessageSquare,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Trash2,
  Undo2,
  Upload,
  Users,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, Textarea } from '@/components/ui/Select'
import { departmentsApi, reportsApi, usersApi } from '@/services/api'
import { apiErrorMessage } from '@/lib/api'
import type { Department, Report, ReportListItem, ReportStatus, User } from '@/types'
import { formatDate, getInitials } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { AerotechMark } from '@/components/brand/AerotechLogo'

const statuses: ReportStatus[] = ['Draft', 'Submitted', 'Reviewed', 'Approved']
const statusClass: Record<ReportStatus, string> = {
  Draft: 'border border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300',
  Submitted: 'border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
  Reviewed: 'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300',
  Approved: 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
}
const statusAccent: Record<ReportStatus, string> = {
  Draft: 'bg-slate-400',
  Submitted: 'bg-blue-500',
  Reviewed: 'bg-amber-500',
  Approved: 'bg-emerald-500',
}
const statusIcon: Record<ReportStatus, LucideIcon> = {
  Draft: Pencil,
  Submitted: Send,
  Reviewed: ShieldCheck,
  Approved: CheckCircle2,
}

function StatusBadge({ status }: { status: ReportStatus }) {
  const Icon = statusIcon[status]
  return (
    <Badge className={`gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusClass[status]}`}>
      <Icon className="h-3 w-3" />{status}
    </Badge>
  )
}

function SectionIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <Icon className="h-3.5 w-3.5" />
    </span>
  )
}

type ReportForm = { title: string; content: string; departmentId: string }
const blankForm: ReportForm = { title: '', content: '', departmentId: '' }

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function fileKindIcon(fileName: string): LucideIcon {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  if (['xls', 'xlsx', 'csv'].includes(ext)) return FileSpreadsheet
  if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return FileText
  if (['png', 'jpg', 'jpeg'].includes(ext)) return FileImage
  return FileIcon
}

export function ReportsPage() {
  const { user, isAdmin } = useAuth()
  const [reports, setReports] = useState<ReportListItem[]>([])
  const [staff, setStaff] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [selected, setSelected] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [scope, setScope] = useState<'mine' | 'shared' | 'all' | ''>('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<ReportForm>(blankForm)

  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDept, setUploadDept] = useState('')
  const [uploadNote, setUploadNote] = useState('')
  const [uploading, setUploading] = useState(false)

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<ReportForm>(blankForm)

  const [comment, setComment] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')
  const [shareIds, setShareIds] = useState<number[]>([])
  const [expandedDepts, setExpandedDepts] = useState<number[]>([])
  const [showVersions, setShowVersions] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(true); setError('')
    try {
      const { data } = await reportsApi.getAll({ search: search || undefined, status: statusFilter || undefined, scope: scope || undefined })
      setReports(data)
    } catch { setError('Reports could not be loaded. Please ensure the API is running.') } finally { setLoading(false) }
  }

  useEffect(() => {
    usersApi.getAll().then((res) => setStaff(res.data)).catch(() => undefined)
    departmentsApi.getAll().then((res) => setDepartments(res.data)).catch(() => undefined)
  }, [])
  useEffect(() => { load() }, [search, statusFilter, scope])

  const refreshWorkspace = async (id: number) => {
    const { data } = await reportsApi.get(id)
    setSelected(data)
  }

  const openReport = async (item: ReportListItem) => {
    setError('')
    try { await refreshWorkspace(item.id) } catch { setError('This report is only available to its owner, shared employees, and Administrators.') }
  }

  const isOwner = !!selected && selected.createdById === user?.id
  const canManage = isOwner || isAdmin
  const canEditContent = isOwner && selected?.status !== 'Approved'
  const canReview = isAdmin && !!selected && selected.status !== 'Draft'

  const submitCreate = async (event: React.FormEvent) => {
    event.preventDefault(); setError('')
    if (!form.title.trim()) { setError('Report title is required.'); return }
    try {
      await reportsApi.create({ title: form.title, content: form.content, departmentId: form.departmentId ? Number(form.departmentId) : undefined })
      setShowForm(false); setForm(blankForm); await load()
    } catch (err) { setError(apiErrorMessage(err, 'Could not create the report.')) }
  }

  const pickUploadFile = (file: File | null) => {
    setUploadFile(file)
    if (file && !uploadTitle.trim()) setUploadTitle(file.name.replace(/\.[^/.]+$/, ''))
  }

  const submitUpload = async (event: React.FormEvent) => {
    event.preventDefault(); setError('')
    if (!uploadFile) { setError('Choose a PDF, Word, or Excel file to upload.'); return }
    if (!uploadTitle.trim()) { setError('Give the document a title.'); return }
    setUploading(true)
    try {
      const { data: created } = await reportsApi.create({ title: uploadTitle, content: uploadNote, departmentId: uploadDept ? Number(uploadDept) : undefined })
      setShowUploadForm(false)
      setUploadFile(null); setUploadTitle(''); setUploadDept(''); setUploadNote('')
      await load()
      try {
        const { data: withFile } = await reportsApi.uploadAttachments(created.id, [uploadFile])
        setSelected(withFile)
      } catch (uploadErr) {
        await refreshWorkspace(created.id)
        setError(apiErrorMessage(uploadErr, 'The document record was created, but the file upload failed. Try uploading it again below.'))
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create the document.'))
    } finally {
      setUploading(false)
    }
  }

  const startEdit = () => {
    if (!selected) return
    setEditForm({ title: selected.title, content: selected.content, departmentId: selected.departmentId ? String(selected.departmentId) : '' })
    setEditing(true)
  }

  const saveEdit = async (event: React.FormEvent) => {
    event.preventDefault(); if (!selected) return; setError('')
    if (!editForm.title.trim()) { setError('Report title is required.'); return }
    try {
      await reportsApi.update(selected.id, { title: editForm.title, content: editForm.content, departmentId: editForm.departmentId ? Number(editForm.departmentId) : undefined })
      setEditing(false); await refreshWorkspace(selected.id); await load()
    } catch (err) { setError(apiErrorMessage(err, 'Could not save the report.')) }
  }

  const submitForReview = async () => {
    if (!selected) return; setError('')
    if (selected.shares.length === 0) { setError('Share the report with at least one employee before submitting.'); return }
    try { await reportsApi.submit(selected.id); await refreshWorkspace(selected.id); await load() }
    catch (err) { setError(apiErrorMessage(err, 'Could not submit the report.')) }
  }

  const changeStatus = async (status: ReportStatus) => {
    if (!selected) return; setError(''); setNotice('')
    try {
      await reportsApi.updateStatus(selected.id, status, reviewNotes || undefined)
      setReviewNotes(''); await refreshWorkspace(selected.id); await load()
      setNotice(`Report marked ${status}.`)
    } catch (err) { setError(apiErrorMessage(err, 'Could not update the report status.')) }
  }

  const deleteReport = async () => {
    if (!selected || !confirm(`Delete "${selected.title}"? This cannot be undone.`)) return
    try { await reportsApi.delete(selected.id); setSelected(null); await load() }
    catch (err) { setError(apiErrorMessage(err, 'Could not delete the report.')) }
  }

  const submitComment = async (event: React.FormEvent) => {
    event.preventDefault(); if (!selected || !comment.trim()) return
    try { await reportsApi.addComment(selected.id, comment); setComment(''); await refreshWorkspace(selected.id) }
    catch (err) { setError(apiErrorMessage(err, 'Could not post the comment.')) }
  }

  const toggleShare = (id: number) => setShareIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  const toggleExpandDept = (deptId: number) => setExpandedDepts((prev) => prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId])
  const deptSelectionState = (members: User[]) => {
    const selectedCount = members.filter((m) => shareIds.includes(m.id)).length
    if (selectedCount === 0) return 'none'
    return selectedCount === members.length ? 'all' : 'partial'
  }
  const toggleDepartment = (deptId: number, members: User[]) => {
    const memberIds = members.map((m) => m.id)
    if (deptSelectionState(members) === 'all') {
      setShareIds((prev) => prev.filter((id) => !memberIds.includes(id)))
    } else {
      setShareIds((prev) => Array.from(new Set([...prev, ...memberIds])))
      setExpandedDepts((prev) => prev.includes(deptId) ? prev : [...prev, deptId])
    }
  }
  const submitShare = async () => {
    if (!selected || shareIds.length === 0) return
    setError(''); setNotice('')
    const names = staff.filter((s) => shareIds.includes(s.id)).map((s) => s.fullName)
    try {
      const { data } = await reportsApi.share(selected.id, shareIds)
      setSelected(data)
      setShareIds([])
      setNotice(`Successfully shared with ${names.join(', ')}.`)
    } catch (err) { setError(apiErrorMessage(err, 'Could not share the report.')) }
  }
  const revokeShare = async (userId: number) => {
    if (!selected) return
    try { await reportsApi.unshare(selected.id, userId); await refreshWorkspace(selected.id) }
    catch (err) { setError(apiErrorMessage(err, 'Could not revoke access.')) }
  }

  const handleFiles = async (fileList: FileList | null) => {
    if (!selected || !fileList || fileList.length === 0) return; setError('')
    try { await reportsApi.uploadAttachments(selected.id, Array.from(fileList)); await refreshWorkspace(selected.id); await load() }
    catch (err) { setError(apiErrorMessage(err, 'Could not upload the file(s). Check file type and 10 MB size limit.')) }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
  const deleteAttachment = async (attachmentId: number) => {
    if (!selected) return
    try { await reportsApi.deleteAttachment(selected.id, attachmentId); await refreshWorkspace(selected.id); await load() }
    catch (err) { setError(apiErrorMessage(err, 'Could not delete the attachment.')) }
  }
  const downloadAttachment = async (attachmentId: number, fileName: string) => {
    if (!selected) return
    try { await reportsApi.downloadAttachment(selected.id, attachmentId, fileName) }
    catch { setError('Could not download the attachment.') }
  }

  const sharedUserIds = new Set(selected?.shares.map((s) => s.userId))
  const eligibleStaff = staff.filter((s) => s.id !== selected?.createdById && !sharedUserIds.has(s.id))
  const deptShareGroups = departments
    .map((d) => ({ id: d.id, name: d.name, members: eligibleStaff.filter((s) => s.departmentId === d.id) }))
  const noDeptShareMembers = eligibleStaff.filter((s) => !s.departmentId)

  const accessGroupMap = new Map<string, Report['shares']>()
  selected?.shares.forEach((s) => {
    const key = s.departmentName || 'No department'
    if (!accessGroupMap.has(key)) accessGroupMap.set(key, [])
    accessGroupMap.get(key)!.push(s)
  })
  const accessGroups = Array.from(accessGroupMap.entries()).map(([name, members]) => ({ name, members }))

  if (selected) return (
    <div className="space-y-5">
      <button type="button" onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        <ChevronLeft className="h-4 w-4" />All reports
      </button>
      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {notice && <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">{notice}</p>}

      <Card className="overflow-hidden rounded-2xl shadow-[0_8px_24px_rgba(15,56,110,0.06)] dark:shadow-none">
        <div className={`h-1 w-full ${statusAccent[selected.status]}`} />
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary/70">
                <AerotechMark className="h-3.5 w-3.5" />Aerotech Bhutan · Internal Report
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{selected.title}</h1>
                <StatusBadge status={selected.status} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                By {selected.createdByName} · Created {formatDate(selected.createdAt)} · Updated {formatDate(selected.updatedAt)}
                {selected.departmentName && ` · ${selected.departmentName}`}
              </p>
              {isOwner && selected.status === 'Draft' && selected.shares.length === 0 && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">Share this report with at least one employee before you can submit it.</p>
              )}
              {selected.reviewedByName && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {selected.status} by {selected.reviewedByName}{selected.reviewedAt && ` on ${formatDate(selected.reviewedAt)}`}
                  {selected.reviewNotes && ` — "${selected.reviewNotes}"`}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {selected.attachments.length > 0 && (
                <Button size="sm" variant="outline" onClick={() => downloadAttachment(selected.attachments[0].id, selected.attachments[0].fileName)}>
                  <Download className="h-3.5 w-3.5" />Download
                </Button>
              )}
              {canEditContent && !editing && <Button size="sm" variant="outline" onClick={startEdit}>Edit</Button>}
              {isOwner && selected.status === 'Draft' && (
                <Button size="sm" onClick={submitForReview} disabled={selected.shares.length === 0} title={selected.shares.length === 0 ? 'Share the report with at least one employee before submitting.' : undefined}>
                  <Send className="h-3.5 w-3.5" />Submit
                </Button>
              )}
              {canManage && <Button size="sm" variant="destructive" onClick={deleteReport}><Trash2 className="h-3.5 w-3.5" />Delete</Button>}
            </div>
          </div>

          {canReview && (
            <div className="mt-5 flex flex-wrap items-end gap-2 border-t border-border pt-4">
              <div className="flex-1 min-w-52 space-y-1">
                <Label className="text-xs">Review notes (optional)</Label>
                <Input value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder="Feedback for the author…" />
              </div>
              {selected.status === 'Submitted' && <Button size="sm" variant="secondary" onClick={() => changeStatus('Reviewed')}><ShieldCheck className="h-3.5 w-3.5" />Mark reviewed</Button>}
              {selected.status !== 'Approved' && <Button size="sm" onClick={() => changeStatus('Approved')}><CheckCircle2 className="h-3.5 w-3.5" />Approve</Button>}
              <Button size="sm" variant="outline" onClick={() => changeStatus('Draft')}><Undo2 className="h-3.5 w-3.5" />Send back to draft</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
        <div className="space-y-5">
          <Card className="rounded-2xl">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2.5 text-base"><SectionIcon icon={Paperclip} />Document{selected.attachments.length !== 1 ? 's' : ''}</CardTitle>
              {canManage && (
                <>
                  <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                  <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}><Plus className="h-3.5 w-3.5" />Upload</Button>
                </>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {selected.attachments.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No files attached yet. {canManage ? 'Upload a PDF, Word, or Excel file above.' : ''}</p>
              ) : selected.attachments.map((a) => {
                const Icon = fileKindIcon(a.fileName)
                return (
                  <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.fileName}</p>
                      <p className="text-xs text-muted-foreground">{formatSize(a.fileSizeBytes)} · {a.uploadedByName} · {formatDate(a.uploadedAt)}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => downloadAttachment(a.id, a.fileName)}><Download className="h-3.5 w-3.5" /></Button>
                    {canManage && <Button variant="ghost" size="icon" onClick={() => deleteAttachment(a.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2.5 text-base"><SectionIcon icon={FileText} />Written notes <span className="text-xs font-normal text-muted-foreground">(optional)</span></CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <form onSubmit={saveEdit} className="space-y-3">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Department tag</Label>
                    <Select value={editForm.departmentId} onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}>
                      <option value="">No department</option>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Textarea rows={12} value={editForm.content} onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Save draft</Button>
                    <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </form>
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{selected.content || 'No written notes — this can stay empty for document-only shares.'}</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="flex items-center gap-2.5 text-base"><SectionIcon icon={MessageSquare} />Comments</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <form onSubmit={submitComment} className="space-y-2">
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment…" rows={2} />
                <Button size="sm" type="submit">Post comment</Button>
              </form>
              <div className="max-h-72 space-y-3 overflow-y-auto">
                {selected.comments.length === 0 ? <p className="py-2 text-center text-sm text-muted-foreground">No comments yet.</p> : selected.comments.map((c) => (
                  <div key={c.id} className="rounded-xl bg-muted/50 p-3">
                    <p className="text-sm">{c.content}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{c.authorName} · {formatDate(c.createdAt)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          {canManage && (
            <Card className="rounded-2xl">
              <CardHeader><CardTitle className="flex items-center gap-2.5 text-base"><SectionIcon icon={Share2} />Share</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">Select whole departments or individual employees. You can expand a department to fine-tune who's included.</p>
                <div className="max-h-64 divide-y divide-border overflow-y-auto rounded-md border border-border">
                  {deptShareGroups.map((group) => {
                    const state = deptSelectionState(group.members)
                    const isExpanded = expandedDepts.includes(group.id)
                    return (
                      <div key={group.id}>
                        <div className="flex items-center gap-2.5 px-3 py-2 hover:bg-accent/50">
                          <input
                            type="checkbox"
                            checked={state === 'all'}
                            disabled={group.members.length === 0}
                            ref={(el) => { if (el) el.indeterminate = state === 'partial' }}
                            onChange={() => toggleDepartment(group.id, group.members)}
                          />
                          <button type="button" onClick={() => toggleExpandDept(group.id)} className="flex flex-1 items-center gap-1.5 text-left text-sm font-medium">
                            <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            {group.name}
                          </button>
                          <span className="text-xs text-muted-foreground">{group.members.filter((m) => shareIds.includes(m.id)).length}/{group.members.length}</span>
                        </div>
                        {isExpanded && (
                          <div className="divide-y divide-border bg-muted/30">
                            {group.members.length === 0 ? (
                              <p className="py-2 pl-9 pr-3 text-xs text-muted-foreground">No eligible employees in this department.</p>
                            ) : group.members.map((m) => (
                              <label key={m.id} className="flex cursor-pointer items-center gap-2.5 py-2 pl-9 pr-3 text-sm hover:bg-accent/50">
                                <input type="checkbox" checked={shareIds.includes(m.id)} onChange={() => toggleShare(m.id)} />
                                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">{getInitials(m.fullName)}</span>
                                {m.fullName}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {noDeptShareMembers.length > 0 && (
                    <div>
                      <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">No department</p>
                      {noDeptShareMembers.map((s) => (
                        <label key={s.id} className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent/50">
                          <input type="checkbox" checked={shareIds.includes(s.id)} onChange={() => toggleShare(s.id)} />
                          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">{getInitials(s.fullName)}</span>
                          {s.fullName}
                          <span className="ml-auto text-xs text-muted-foreground">{s.role}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {deptShareGroups.length === 0 && noDeptShareMembers.length === 0 && (
                    <p className="px-3 py-2 text-sm text-muted-foreground">Everyone eligible already has access.</p>
                  )}
                </div>
                <Button size="sm" onClick={submitShare} disabled={shareIds.length === 0}>
                  Share with {shareIds.length > 0 && <strong>{shareIds.length}</strong>} selected
                </Button>
                <div className="space-y-2.5 border-t border-border pt-3">
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground"><Users className="h-3.5 w-3.5" />Has access{selected.shares.length > 0 && ` (${selected.shares.length})`}</p>
                  {accessGroups.length === 0 ? <p className="text-xs text-muted-foreground">Not shared with anyone yet.</p> : accessGroups.map((group) => (
                    <div key={group.name} className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">{group.name} · {group.members.length}</p>
                      {group.members.map((s) => (
                        <div key={s.userId} className="flex items-start justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">{getInitials(s.fullName)}</span>
                            <span>
                              <span className="block">{s.fullName}</span>
                              <span className="block text-[11px] text-muted-foreground">Shared {formatDate(s.sharedAt)}</span>
                            </span>
                          </span>
                          <button type="button" onClick={() => revokeShare(s.userId)} className="mt-1 text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-2xl">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2.5 text-base"><SectionIcon icon={History} />Version history</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setShowVersions((v) => !v)}>{showVersions ? 'Hide' : `Show (${selected.versions.length})`}</Button>
            </CardHeader>
            {showVersions && (
              <CardContent className="max-h-72 space-y-0 overflow-y-auto">
                {selected.versions.map((v, i) => (
                  <div key={v.id} className="relative flex items-start gap-3 pb-4 pl-1 text-sm last:pb-0">
                    {i < selected.versions.length - 1 && <span className="absolute left-[7px] top-4 h-full w-px bg-border" />}
                    <span className={`mt-1 h-3.5 w-3.5 flex-shrink-0 rounded-full ring-4 ring-card ${statusAccent[v.status]}`} />
                    <div className="min-w-0">
                      <p><StatusBadge status={v.status} /> <span className="text-muted-foreground">saved by</span> {v.editedByName}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{formatDate(v.editedAt)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary/70">
            <AerotechMark className="h-3.5 w-3.5" />Aerotech Bhutan · Internal Documents
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Reports &amp; Documents</h1>
          <p className="text-sm text-muted-foreground">Upload, share, and track company documents — or write a report from scratch.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setForm(blankForm); setShowForm(true) }}><Pencil className="h-4 w-4" />Write report</Button>
          <Button onClick={() => { setUploadFile(null); setUploadTitle(''); setUploadDept(''); setUploadNote(''); setShowUploadForm(true) }}><Upload className="h-4 w-4" />Upload document</Button>
        </div>
      </div>
      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reports" />
        </div>
        <Select className="sm:w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select className="sm:w-48" value={scope} onChange={(e) => setScope(e.target.value as typeof scope)}>
          <option value="">Mine &amp; shared with me</option>
          <option value="mine">Mine only</option>
          <option value="shared">Shared with me</option>
          {isAdmin && <option value="all">All reports</option>}
        </Select>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : reports.length === 0 ? (
        <Card><CardContent className="py-14 text-center"><FileText className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">No documents or reports yet. Upload a file or write a report to get started.</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reports.map((report) => (
            <button type="button" key={report.id} onClick={() => openReport(report)} className="text-left">
              <Card className="h-full overflow-hidden rounded-2xl transition-shadow hover:shadow-md">
                <div className={`h-1 w-full ${statusAccent[report.status]}`} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold">{report.title}</h2>
                    <StatusBadge status={report.status} />
                  </div>
                  {report.attachmentCount > 0 ? (
                    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-primary">
                      <Paperclip className="h-3 w-3" />{report.attachmentCount} file{report.attachmentCount === 1 ? '' : 's'} attached
                    </p>
                  ) : (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground"><Pencil className="h-3 w-3" />Written report</p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">{report.createdByName}{report.departmentName && ` · ${report.departmentName}`}</p>
                  <p className="mt-4 text-xs text-muted-foreground">Updated {formatDate(report.updatedAt)}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{report.shareCount}</span>
                    <span className="flex items-center gap-1"><Paperclip className="h-3.5 w-3.5" />{report.attachmentCount}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{report.commentCount}</span>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      <Dialog open={showUploadForm} onClose={() => setShowUploadForm(false)} title="Upload document" description="Share an existing PDF, Word, or Excel file with your colleagues.">
        <form onSubmit={submitUpload} className="grid gap-4 overflow-y-auto p-6">
          <div className="space-y-2">
            <Label>File</Label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              onChange={(e) => pickUploadFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
              required
            />
            <p className="text-xs text-muted-foreground">PDF, Word, or Excel — up to 10 MB.</p>
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Department tag (optional)</Label>
            <Select value={uploadDept} onChange={(e) => setUploadDept(e.target.value)}>
              <option value="">No department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Textarea rows={3} value={uploadNote} onChange={(e) => setUploadNote(e.target.value)} placeholder="Add context for people you'll share this with…" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={uploading}>{uploading ? 'Uploading…' : 'Upload & continue'}</Button>
            <Button type="button" variant="outline" onClick={() => setShowUploadForm(false)}>Cancel</Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={showForm} onClose={() => setShowForm(false)} title="Write report" description="Start a new draft. You can save, attach files, and share it later.">
        <form onSubmit={submitCreate} className="grid gap-4 overflow-y-auto p-6">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Department tag (optional)</Label>
            <Select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
              <option value="">No department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Write the report body…" />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Save as draft</Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
