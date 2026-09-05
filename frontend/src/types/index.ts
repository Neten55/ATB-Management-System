export type UserRole = 'Administrator' | 'Employee'

export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  fullName: string
  role: UserRole
  departmentId?: number
  departmentName?: string
  phone?: string
  jobTitle?: string
  avatarUrl?: string
}

export interface Department {
  id: number
  name: string
  description?: string
}

export type EventCategory =
  | 'Meeting'
  | 'Reminder'
  | 'CompanyEvent'
  | 'Holiday'
  | 'Leave'
  | 'Deadline'
  | 'Training'
  | 'Workshop'
  | 'Birthday'
  | 'Schedule'
  | 'Announcement'

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected'
export type LeaveType = 'Annual' | 'Sick' | 'Personal' | 'Maternity' | 'Paternity' | 'Unpaid'
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical'
export type ReminderTiming =
  | 'OneDayBefore'
  | 'ThreeHoursBefore'
  | 'OneHourBefore'
  | 'ThirtyMinutesBefore'
  | 'FifteenMinutesBefore'

export interface ExternalParticipant {
  id: number
  name: string
  organization: string
  email: string
  phone?: string
}

export interface ExternalParticipantInput {
  name: string
  organization: string
  email: string
  phone?: string
}

export interface ExternalNotificationPayload {
  externalParticipants?: ExternalParticipantInput[]
  sendEmailNotification?: boolean
  reminderTiming?: ReminderTiming
}

export interface CalendarEvent {
  id: number
  title: string
  description?: string
  start: string
  end: string
  allDay: boolean
  category: EventCategory
  color: string
  location?: string
  departmentId?: number
  departmentName?: string
  createdById: number
  createdByName?: string
}

export interface Schedule {
  id: number
  title: string
  description?: string
  date: string
  startTime: string
  endTime: string
  departmentId?: number
  departmentName?: string
  location?: string
  priority: Priority
  reminderTiming?: ReminderTiming
  assignedEmployeeIds: number[]
  assignedEmployeeNames?: string[]
  createdById: number
  createdAt: string
}

export interface Meeting {
  id: number
  title: string
  description?: string
  meetingDate: string
  startTime: string
  endTime: string
  location?: string
  participantIds: number[]
  participantNames?: string[]
  reminderTiming?: ReminderTiming
  sendEmailNotification?: boolean
  externalParticipants?: ExternalParticipant[]
  createdById: number
  createdByName?: string
  createdAt: string
  invitationEmailsSent?: boolean
  invitationEmailMessage?: string
}

export interface Reminder {
  id: number
  title: string
  description?: string
  reminderDate: string
  reminderTime?: string
  timing: ReminderTiming
  isCompanyWide: boolean
  sendEmailNotification?: boolean
  externalParticipants?: ExternalParticipant[]
  userId?: number
  createdById: number
  createdAt: string
  invitationEmailsSent?: boolean
  invitationEmailMessage?: string
}

export interface CompanyEvent {
  id: number
  title: string
  description?: string
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  location?: string
  category: EventCategory
  isAllDay: boolean
  reminderTiming?: ReminderTiming
  sendEmailNotification?: boolean
  externalParticipants?: ExternalParticipant[]
  createdById: number
  createdAt: string
  invitationEmailsSent?: boolean
  invitationEmailMessage?: string
}

export interface LeaveRequest {
  id: number
  userId: number
  userName: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  reason?: string
  status: LeaveStatus
  reviewedById?: number
  reviewedByName?: string
  reviewNotes?: string
  createdAt: string
}

export interface Announcement {
  id: number
  title: string
  content: string
  isPinned: boolean
  isUrgent: boolean
  createdById: number
  createdByName?: string
  createdAt: string
  expiresAt?: string
}

export interface Holiday {
  id: number
  name: string
  date: string
  description?: string
  isRecurring: boolean
}

export interface DashboardData {
  todaySchedules: Schedule[]
  upcomingMeetings: Meeting[]
  upcomingEvents: CompanyEvent[]
  recentAnnouncements: Announcement[]
  todayReminders: Reminder[]
  onLeaveToday: LeaveRequest[]
  miniCalendarEvents: CalendarEvent[]
  pendingLeave?: LeaveRequest[]
}

export type ProjectStatus = 'Planning' | 'InProgress' | 'OnHold' | 'Completed'
export type ProjectTaskStatus = 'ToDo' | 'InProgress' | 'Done'
export interface ProjectMember { userId: number; fullName: string; departmentName?: string }
export interface ProjectTask { id: number; title: string; description?: string; assigneeId?: number; assigneeName?: string; dueDate?: string; priority: Priority; status: ProjectTaskStatus; createdById: number; createdAt: string }
export interface ProjectDiscussion { id: number; authorId: number; authorName: string; content: string; parentId?: number; createdAt: string }
export interface ProjectNote { id: number; authorId: number; authorName: string; content: string; createdAt: string }
export interface Project { id: number; name: string; description?: string; ownerId: number; ownerName: string; startDate?: string; dueDate?: string; status: ProjectStatus; progress: number; members: ProjectMember[]; tasks?: ProjectTask[]; discussions?: ProjectDiscussion[]; notes?: ProjectNote[] }

export type ReportStatus = 'Draft' | 'Submitted' | 'Reviewed' | 'Approved'

export interface ReportShare {
  userId: number
  fullName: string
  departmentName?: string
  sharedAt: string
}

export interface ReportComment {
  id: number
  authorId: number
  authorName: string
  content: string
  createdAt: string
}

export interface ReportAttachment {
  id: number
  fileName: string
  contentType: string
  fileSizeBytes: number
  uploadedById: number
  uploadedByName: string
  uploadedAt: string
}

export interface ReportVersion {
  id: number
  title: string
  status: ReportStatus
  editedById: number
  editedByName: string
  editedAt: string
}

export interface ReportListItem {
  id: number
  title: string
  status: ReportStatus
  departmentId?: number
  departmentName?: string
  createdById: number
  createdByName: string
  createdAt: string
  updatedAt: string
  shareCount: number
  attachmentCount: number
  commentCount: number
}

export interface Report {
  id: number
  title: string
  content: string
  status: ReportStatus
  departmentId?: number
  departmentName?: string
  createdById: number
  createdByName: string
  createdAt: string
  updatedAt: string
  submittedAt?: string
  reviewedById?: number
  reviewedByName?: string
  reviewedAt?: string
  reviewNotes?: string
  shares: ReportShare[]
  comments: ReportComment[]
  attachments: ReportAttachment[]
  versions: ReportVersion[]
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
  welcomeEmailSent?: boolean
  welcomeEmailMessage?: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  departmentId?: number
  jobTitle?: string
  phone?: string
}

export const EVENT_COLORS: Record<EventCategory, string> = {
  Meeting: '#3b82f6',
  Reminder: '#f59e0b',
  CompanyEvent: '#8b5cf6',
  Holiday: '#ef4444',
  Leave: '#06b6d4',
  Deadline: '#dc2626',
  Training: '#10b981',
  Workshop: '#6366f1',
  Birthday: '#ec4899',
  Schedule: '#0ea5e9',
  Announcement: '#f97316',
}

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  Meeting: 'Meeting',
  Reminder: 'Reminder',
  CompanyEvent: 'Company Event',
  Holiday: 'Holiday',
  Leave: 'Leave',
  Deadline: 'Deadline',
  Training: 'Training',
  Workshop: 'Workshop',
  Birthday: 'Birthday',
  Schedule: 'Schedule',
  Announcement: 'Announcement',
}
