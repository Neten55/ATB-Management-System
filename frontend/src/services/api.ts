import api from '@/lib/api'
import type {
  Announcement,
  CalendarEvent,
  CompanyEvent,
  DashboardData,
  Department,
  ExternalNotificationPayload,
  Holiday,
  LeaveRequest,
  LoginRequest,
  LoginResponse,
  Meeting,
  RegisterRequest,
  Reminder,
  Schedule,
  Project,
  ProjectTask,
  Report,
  ReportListItem,
  ReportStatus,
  User,
} from '@/types'

export const authApi = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
  register: (data: RegisterRequest) => api.post<LoginResponse>('/auth/register', data),
  me: () => api.get<User>('/auth/me'),
}

export const dashboardApi = {
  get: () => api.get<DashboardData>('/dashboard'),
}

export const calendarApi = {
  getEvents: (start: string, end: string, categories?: string) =>
    api.get<CalendarEvent[]>('/calendar/events', { params: { start, end, categories } }),
  search: (q: string) => api.get<CalendarEvent[]>('/calendar/search', { params: { q } }),
}

export const schedulesApi = {
  getAll: () => api.get<Schedule[]>('/schedules'),
  getById: (id: number) => api.get<Schedule>(`/schedules/${id}`),
  create: (data: Partial<Schedule>) => api.post<Schedule>('/schedules', data),
  update: (id: number, data: Partial<Schedule>) => api.put<Schedule>(`/schedules/${id}`, data),
  delete: (id: number) => api.delete(`/schedules/${id}`),
}

export const meetingsApi = {
  getAll: () => api.get<Meeting[]>('/meetings'),
  getById: (id: number) => api.get<Meeting>(`/meetings/${id}`),
  create: (data: Omit<Partial<Meeting>, 'externalParticipants'> & ExternalNotificationPayload) =>
    api.post<Meeting>('/meetings', data),
  update: (id: number, data: Omit<Partial<Meeting>, 'externalParticipants'> & ExternalNotificationPayload) =>
    api.put<Meeting>(`/meetings/${id}`, data),
  delete: (id: number) => api.delete(`/meetings/${id}`),
}

export const remindersApi = {
  getAll: () => api.get<Reminder[]>('/reminders'),
  create: (data: Omit<Partial<Reminder>, 'externalParticipants'> & ExternalNotificationPayload) =>
    api.post<Reminder>('/reminders', data),
  update: (id: number, data: Omit<Partial<Reminder>, 'externalParticipants'> & ExternalNotificationPayload) =>
    api.put<Reminder>(`/reminders/${id}`, data),
  delete: (id: number) => api.delete(`/reminders/${id}`),
}

export const eventsApi = {
  getAll: () => api.get<CompanyEvent[]>('/events'),
  create: (data: Omit<Partial<CompanyEvent>, 'externalParticipants'> & ExternalNotificationPayload) =>
    api.post<CompanyEvent>('/events', data),
  update: (id: number, data: Omit<Partial<CompanyEvent>, 'externalParticipants'> & ExternalNotificationPayload) =>
    api.put<CompanyEvent>(`/events/${id}`, data),
  delete: (id: number) => api.delete(`/events/${id}`),
}

export const leaveApi = {
  getAll: () => api.get<LeaveRequest[]>('/leave'),
  getMy: () => api.get<LeaveRequest[]>('/leave/my'),
  create: (data: Partial<LeaveRequest>) => api.post<LeaveRequest>('/leave', data),
  approve: (id: number, notes?: string) => api.put<LeaveRequest>(`/leave/${id}/approve`, { reviewNotes: notes }),
  reject: (id: number, notes?: string) => api.put<LeaveRequest>(`/leave/${id}/reject`, { reviewNotes: notes }),
}

export const announcementsApi = {
  getAll: () => api.get<Announcement[]>('/announcements'),
  create: (data: Partial<Announcement>) => api.post<Announcement>('/announcements', data),
  update: (id: number, data: Partial<Announcement>) => api.put<Announcement>(`/announcements/${id}`, data),
  delete: (id: number) => api.delete(`/announcements/${id}`),
}

export const holidaysApi = {
  getAll: () => api.get<Holiday[]>('/holidays'),
  create: (data: Partial<Holiday>) => api.post<Holiday>('/holidays', data),
  update: (id: number, data: Partial<Holiday>) => api.put<Holiday>(`/holidays/${id}`, data),
  delete: (id: number) => api.delete(`/holidays/${id}`),
}

export const usersApi = {
  getAll: () => api.get<User[]>('/users'),
  getById: (id: number) => api.get<User>(`/users/${id}`),
  update: (
    id: number,
    data: Partial<User> & { newPassword?: string },
  ) => api.put<User>(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
}

export const departmentsApi = {
  getAll: () => api.get<Department[]>('/departments'),
}

export const projectsApi = {
  getAll: (params?: { search?: string; status?: string }) => api.get<Project[]>('/projects', { params }),
  get: (id: number) => api.get<Project>(`/projects/${id}`),
  create: (data: Partial<Project> & { memberIds?: number[] }) => api.post<Project>('/projects', data),
  update: (id: number, data: Partial<Project> & { memberIds?: number[] }) => api.put<Project>(`/projects/${id}`, data),
  delete: (id: number) => api.delete(`/projects/${id}`),
  createTask: (projectId: number, data: Partial<ProjectTask>) => api.post<Project>(`/projects/${projectId}/tasks`, data),
  updateTask: (projectId: number, taskId: number, data: Partial<ProjectTask>) => api.put<Project>(`/projects/${projectId}/tasks/${taskId}`, data),
  deleteTask: (projectId: number, taskId: number) => api.delete(`/projects/${projectId}/tasks/${taskId}`),
  addDiscussion: (projectId: number, content: string, parentId?: number) => api.post<Project>(`/projects/${projectId}/discussions`, { content, parentId }),
  addNote: (projectId: number, content: string) => api.post<Project>(`/projects/${projectId}/notes`, { content }),
}

export const reportsApi = {
  getAll: (params?: { search?: string; status?: string; scope?: 'mine' | 'shared' | 'all' }) =>
    api.get<ReportListItem[]>('/reports', { params }),
  get: (id: number) => api.get<Report>(`/reports/${id}`),
  create: (data: { title: string; content: string; departmentId?: number }) => api.post<Report>('/reports', data),
  update: (id: number, data: { title: string; content: string; departmentId?: number }) => api.put<Report>(`/reports/${id}`, data),
  delete: (id: number) => api.delete(`/reports/${id}`),
  submit: (id: number) => api.post<Report>(`/reports/${id}/submit`),
  updateStatus: (id: number, status: ReportStatus, reviewNotes?: string) =>
    api.put<Report>(`/reports/${id}/status`, { status, reviewNotes }),
  share: (id: number, userIds: number[]) => api.post<Report>(`/reports/${id}/share`, { userIds }),
  unshare: (id: number, userId: number) => api.delete<Report>(`/reports/${id}/share/${userId}`),
  addComment: (id: number, content: string) => api.post<Report>(`/reports/${id}/comments`, { content }),
  getVersions: (id: number) => api.get<Report['versions']>(`/reports/${id}/versions`),
  uploadAttachments: (id: number, files: File[]) => {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    return api.post<Report>(`/reports/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  deleteAttachment: (id: number, attachmentId: number) => api.delete<Report>(`/reports/${id}/attachments/${attachmentId}`),
  downloadAttachment: async (id: number, attachmentId: number, fileName: string) => {
    const res = await api.get(`/reports/${id}/attachments/${attachmentId}/download`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(res.data as Blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}
