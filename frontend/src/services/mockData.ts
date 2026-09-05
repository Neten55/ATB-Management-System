import type {
  Announcement,
  CalendarEvent,
  CompanyEvent,
  DashboardData,
  Department,
  Holiday,
  LeaveRequest,
  Meeting,
  Reminder,
  Schedule,
  User,
} from '@/types'
import { EVENT_COLORS } from '@/types'

const today = new Date()
const fmt = (d: Date) => d.toISOString().split('T')[0]

export const mockDepartments: Department[] = [
  { id: 1, name: 'Engineering', description: 'Software & IT' },
  { id: 2, name: 'Operations', description: 'Daily operations' },
  { id: 3, name: 'Administration', description: 'HR & Admin' },
  { id: 4, name: 'Sales', description: 'Sales & Marketing' },
]

export const mockUsers: User[] = [
  {
    id: 1,
    email: 'admin@aerotech.bt',
    firstName: 'Karma',
    lastName: 'Wangchuk',
    fullName: 'Karma Wangchuk',
    role: 'Administrator',
    departmentId: 3,
    departmentName: 'Administration',
    jobTitle: 'System Administrator',
    phone: '+975 17123456',
  },
  {
    id: 2,
    email: 'employee@aerotech.bt',
    firstName: 'Sonam',
    lastName: 'Dorji',
    fullName: 'Sonam Dorji',
    role: 'Employee',
    departmentId: 1,
    departmentName: 'Engineering',
    jobTitle: 'Software Engineer',
    phone: '+975 17765432',
  },
  {
    id: 3,
    email: 'pema@aerotech.bt',
    firstName: 'Pema',
    lastName: 'Tshering',
    fullName: 'Pema Tshering',
    role: 'Employee',
    departmentId: 2,
    departmentName: 'Operations',
    jobTitle: 'Operations Manager',
  },
]

export const mockSchedules: Schedule[] = [
  {
    id: 1,
    title: 'Morning Standup',
    description: 'Daily team sync',
    date: fmt(today),
    startTime: '09:00',
    endTime: '09:30',
    departmentId: 1,
    departmentName: 'Engineering',
    location: 'Conference Room A',
    priority: 'Medium',
    reminderTiming: 'FifteenMinutesBefore',
    assignedEmployeeIds: [2],
    createdById: 1,
    createdAt: fmt(today),
  },
  {
    id: 2,
    title: 'Client Site Visit',
    description: 'Paro airport maintenance check',
    date: fmt(new Date(today.getTime() + 86400000)),
    startTime: '10:00',
    endTime: '16:00',
    departmentId: 2,
    departmentName: 'Operations',
    location: 'Paro International Airport',
    priority: 'High',
    assignedEmployeeIds: [3],
    createdById: 1,
    createdAt: fmt(today),
  },
]

export const mockMeetings: Meeting[] = [
  {
    id: 1,
    title: 'Q3 Planning Review',
    description: 'Review quarterly goals and milestones',
    meetingDate: fmt(today),
    startTime: '14:00',
    endTime: '15:30',
    location: 'Board Room',
    participantIds: [1, 2, 3],
    participantNames: ['Karma Wangchuk', 'Sonam Dorji', 'Pema Tshering'],
    reminderTiming: 'ThirtyMinutesBefore',
    createdById: 1,
    createdByName: 'Karma Wangchuk',
    createdAt: fmt(today),
  },
  {
    id: 2,
    title: 'Safety Briefing',
    meetingDate: fmt(new Date(today.getTime() + 2 * 86400000)),
    startTime: '11:00',
    endTime: '12:00',
    location: 'Main Hall',
    participantIds: [2, 3],
    createdById: 1,
    createdAt: fmt(today),
  },
]

export const mockReminders: Reminder[] = [
  {
    id: 1,
    title: 'Submit weekly report',
    description: 'Operations weekly summary due',
    reminderDate: fmt(new Date(today.getTime() + 86400000)),
    timing: 'OneDayBefore',
    isCompanyWide: false,
    userId: 2,
    createdById: 2,
    createdAt: fmt(today),
  },
  {
    id: 2,
    title: 'Training starts today',
    reminderDate: fmt(today),
    reminderTime: '13:00',
    timing: 'OneHourBefore',
    isCompanyWide: true,
    createdById: 1,
    createdAt: fmt(today),
  },
]

export const mockEvents: CompanyEvent[] = [
  {
    id: 1,
    title: 'Team Building Day',
    description: 'Annual team building at Dochula',
    startDate: fmt(new Date(today.getTime() + 7 * 86400000)),
    endDate: fmt(new Date(today.getTime() + 7 * 86400000)),
    startTime: '08:00',
    endTime: '17:00',
    location: 'Dochula Pass',
    category: 'CompanyEvent',
    isAllDay: false,
    createdById: 1,
    createdAt: fmt(today),
  },
  {
    id: 2,
    title: 'Aviation Safety Workshop',
    startDate: fmt(new Date(today.getTime() + 3 * 86400000)),
    endDate: fmt(new Date(today.getTime() + 4 * 86400000)),
    location: 'Training Center',
    category: 'Workshop',
    isAllDay: true,
    createdById: 1,
    createdAt: fmt(today),
  },
]

export const mockLeaveRequests: LeaveRequest[] = [
  {
    id: 1,
    userId: 3,
    userName: 'Pema Tshering',
    leaveType: 'Annual',
    startDate: fmt(today),
    endDate: fmt(new Date(today.getTime() + 2 * 86400000)),
    reason: 'Family visit',
    status: 'Approved',
    reviewedById: 1,
    reviewedByName: 'Karma Wangchuk',
    createdAt: fmt(new Date(today.getTime() - 5 * 86400000)),
  },
  {
    id: 2,
    userId: 2,
    userName: 'Sonam Dorji',
    leaveType: 'Sick',
    startDate: fmt(new Date(today.getTime() + 5 * 86400000)),
    endDate: fmt(new Date(today.getTime() + 6 * 86400000)),
    reason: 'Medical appointment',
    status: 'Pending',
    createdAt: fmt(today),
  },
]

export const mockAnnouncements: Announcement[] = [
  {
    id: 1,
    title: 'Office Closed - National Day',
    content: 'The office will remain closed on December 17th in observance of National Day.',
    isPinned: true,
    isUrgent: false,
    createdById: 1,
    createdByName: 'Karma Wangchuk',
    createdAt: fmt(new Date(today.getTime() - 86400000)),
  },
  {
    id: 2,
    title: 'Internet Maintenance',
    content: 'Scheduled internet maintenance on Saturday from 2 PM to 4 PM. Remote work advised.',
    isPinned: false,
    isUrgent: true,
    createdById: 1,
    createdByName: 'Karma Wangchuk',
    createdAt: fmt(today),
  },
]

export const mockHolidays: Holiday[] = [
  { id: 1, name: 'National Day', date: '2026-12-17', description: 'Bhutan National Day', isRecurring: true },
  { id: 2, name: 'Losar', date: '2026-02-28', description: 'Bhutanese New Year', isRecurring: true },
  { id: 3, name: 'Birth Anniversary of HM', date: '2026-02-21', isRecurring: true },
]

function buildCalendarEvents(): CalendarEvent[] {
  const events: CalendarEvent[] = []

  mockSchedules.forEach((s) => {
    events.push({
      id: s.id,
      title: s.title,
      description: s.description,
      start: `${s.date}T${s.startTime}`,
      end: `${s.date}T${s.endTime}`,
      allDay: false,
      category: 'Schedule',
      color: EVENT_COLORS.Schedule,
      location: s.location,
      departmentId: s.departmentId,
      departmentName: s.departmentName,
      createdById: s.createdById,
    })
  })

  mockMeetings.forEach((m) => {
    events.push({
      id: 100 + m.id,
      title: m.title,
      description: m.description,
      start: `${m.meetingDate}T${m.startTime}`,
      end: `${m.meetingDate}T${m.endTime}`,
      allDay: false,
      category: 'Meeting',
      color: EVENT_COLORS.Meeting,
      location: m.location,
      createdById: m.createdById,
      createdByName: m.createdByName,
    })
  })

  mockEvents.forEach((e) => {
    events.push({
      id: 200 + e.id,
      title: e.title,
      description: e.description,
      start: e.isAllDay ? e.startDate : `${e.startDate}T${e.startTime || '00:00'}`,
      end: e.isAllDay ? e.endDate : `${e.endDate}T${e.endTime || '23:59'}`,
      allDay: e.isAllDay,
      category: e.category,
      color: EVENT_COLORS[e.category],
      location: e.location,
      createdById: e.createdById,
    })
  })

  mockHolidays.forEach((h) => {
    events.push({
      id: 300 + h.id,
      title: h.name,
      description: h.description,
      start: h.date,
      end: h.date,
      allDay: true,
      category: 'Holiday',
      color: EVENT_COLORS.Holiday,
      createdById: 1,
    })
  })

  mockLeaveRequests
    .filter((l) => l.status === 'Approved')
    .forEach((l) => {
      events.push({
        id: 400 + l.id,
        title: `${l.userName} - Leave`,
        description: l.reason,
        start: l.startDate,
        end: l.endDate,
        allDay: true,
        category: 'Leave',
        color: EVENT_COLORS.Leave,
        createdById: l.userId,
        createdByName: l.userName,
      })
    })

  mockReminders.forEach((r) => {
    events.push({
      id: 500 + r.id,
      title: r.title,
      description: r.description,
      start: r.reminderTime ? `${r.reminderDate}T${r.reminderTime}` : r.reminderDate,
      end: r.reminderTime ? `${r.reminderDate}T${r.reminderTime}` : r.reminderDate,
      allDay: !r.reminderTime,
      category: 'Reminder',
      color: EVENT_COLORS.Reminder,
      createdById: r.createdById,
    })
  })

  return events
}

export const mockCalendarEvents = buildCalendarEvents()

export const mockDashboard: DashboardData = {
  todaySchedules: mockSchedules.filter((s) => s.date === fmt(today)),
  upcomingMeetings: mockMeetings.slice(0, 3),
  upcomingEvents: mockEvents.slice(0, 3),
  recentAnnouncements: mockAnnouncements.slice(0, 3),
  todayReminders: mockReminders.filter((r) => r.reminderDate === fmt(today)),
  onLeaveToday: mockLeaveRequests.filter(
    (l) => l.status === 'Approved' && l.startDate <= fmt(today) && l.endDate >= fmt(today),
  ),
  miniCalendarEvents: mockCalendarEvents,
}

export const mockCredentials = {
  'admin@aerotech.bt': { password: 'Admin@123', user: mockUsers[0] },
  'employee@aerotech.bt': { password: 'Employee@123', user: mockUsers[1] },
}

export function delay<T>(data: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms))
}
