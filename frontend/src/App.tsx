import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/auth/LoginPage'

const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const CalendarPage = lazy(() => import('@/pages/CalendarPage').then((m) => ({ default: m.CalendarPage })))
const SchedulesPage = lazy(() => import('@/pages/SchedulesPage').then((m) => ({ default: m.SchedulesPage })))
const MeetingsPage = lazy(() => import('@/pages/MeetingsPage').then((m) => ({ default: m.MeetingsPage })))
const RemindersPage = lazy(() => import('@/pages/RemindersPage').then((m) => ({ default: m.RemindersPage })))
const EventsPage = lazy(() => import('@/pages/EventsPage').then((m) => ({ default: m.EventsPage })))
const LeavePage = lazy(() => import('@/pages/LeavePage').then((m) => ({ default: m.LeavePage })))
const AnnouncementsPage = lazy(() => import('@/pages/AnnouncementsPage').then((m) => ({ default: m.AnnouncementsPage })))
const HolidaysPage = lazy(() => import('@/pages/HolidaysPage').then((m) => ({ default: m.HolidaysPage })))
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const EmployeesPage = lazy(() => import('@/pages/EmployeesPage').then((m) => ({ default: m.EmployeesPage })))
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })))
const ReportsPage = lazy(() => import('@/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })))

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/calendar" replace />} />
        <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
        <Route path="calendar" element={<Suspense fallback={<PageLoader />}><CalendarPage /></Suspense>} />
        <Route path="projects" element={<Suspense fallback={<PageLoader />}><ProjectsPage /></Suspense>} />
        <Route path="reports" element={<Suspense fallback={<PageLoader />}><ReportsPage /></Suspense>} />
        <Route path="schedules" element={<Suspense fallback={<PageLoader />}><SchedulesPage /></Suspense>} />
        <Route path="meetings" element={<Suspense fallback={<PageLoader />}><MeetingsPage /></Suspense>} />
        <Route path="reminders" element={<Suspense fallback={<PageLoader />}><RemindersPage /></Suspense>} />
        <Route path="events" element={<Suspense fallback={<PageLoader />}><EventsPage /></Suspense>} />
        <Route path="leave" element={<Suspense fallback={<PageLoader />}><LeavePage /></Suspense>} />
        <Route path="announcements" element={<Suspense fallback={<PageLoader />}><AnnouncementsPage /></Suspense>} />
        <Route path="holidays" element={<Suspense fallback={<PageLoader />}><HolidaysPage /></Suspense>} />
        <Route path="employees" element={<Suspense fallback={<PageLoader />}><EmployeesPage /></Suspense>} />
        <Route path="profile" element={<Suspense fallback={<PageLoader />}><ProfilePage /></Suspense>} />
      </Route>
      <Route path="*" element={<Navigate to="/calendar" replace />} />
    </Routes>
  )
}
