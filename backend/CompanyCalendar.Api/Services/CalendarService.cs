using CompanyCalendar.Api.Data;
using CompanyCalendar.Api.DTOs;
using CompanyCalendar.Api.Models;
using CompanyCalendar.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace CompanyCalendar.Api.Services;

public class CalendarService(ApplicationDbContext db)
{
    public async Task<List<CalendarEventDto>> GetEventsAsync(DateOnly start, DateOnly end, string? categories, int userId, bool isAdmin)
    {
        var allowed = categories?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(c => Enum.Parse<EventCategory>(c, true))
            .ToHashSet();

        var viewer = await db.Users.FindAsync(userId);
        var departmentId = viewer?.DepartmentId;
        var events = new List<CalendarEventDto>();

        IQueryable<Schedule> schedulesQuery = db.Schedules
            .Include(s => s.Department)
            .Include(s => s.Assignments)
            .Where(s => s.Date >= start && s.Date <= end);
        if (!isAdmin)
            schedulesQuery = schedulesQuery.Where(s =>
                s.Assignments.Any(a => a.UserId == userId)
                || (!s.Assignments.Any() && departmentId != null && s.DepartmentId == departmentId));

        var schedules = await schedulesQuery.ToListAsync();

        foreach (var s in schedules)
        {
            if (allowed != null && !allowed.Contains(EventCategory.Schedule)) continue;
            events.Add(MappingExtensions.ToCalendarEvent(
                s.Id, s.Title, s.Description,
                $"{s.Date:yyyy-MM-dd}T{s.StartTime:HH:mm}",
                $"{s.Date:yyyy-MM-dd}T{s.EndTime:HH:mm}",
                false, EventCategory.Schedule, s.Location, s.DepartmentId, s.Department?.Name, s.CreatedById));
        }

        IQueryable<Meeting> meetingsQuery = db.Meetings
            .Include(m => m.CreatedBy)
            .Include(m => m.Participants)
            .Where(m => m.MeetingDate >= start && m.MeetingDate <= end);
        if (!isAdmin)
            meetingsQuery = meetingsQuery.Where(m =>
                m.CreatedById == userId || m.Participants.Any(p => p.UserId == userId));

        var meetings = await meetingsQuery.ToListAsync();

        foreach (var m in meetings)
        {
            if (allowed != null && !allowed.Contains(EventCategory.Meeting)) continue;
            events.Add(MappingExtensions.ToCalendarEvent(
                1000 + m.Id, m.Title, m.Description,
                $"{m.MeetingDate:yyyy-MM-dd}T{m.StartTime:HH:mm}",
                $"{m.MeetingDate:yyyy-MM-dd}T{m.EndTime:HH:mm}",
                false, EventCategory.Meeting, m.Location,
                createdById: m.CreatedById,
                createdByName: m.CreatedBy != null ? $"{m.CreatedBy.FirstName} {m.CreatedBy.LastName}" : null));
        }

        IQueryable<Reminder> remindersQuery = db.Reminders
            .Where(r => r.ReminderDate >= start && r.ReminderDate <= end);
        if (!isAdmin)
            remindersQuery = remindersQuery.Where(r =>
                r.IsCompanyWide || r.UserId == userId || r.CreatedById == userId);

        var reminders = await remindersQuery.ToListAsync();

        foreach (var r in reminders)
        {
            if (allowed != null && !allowed.Contains(EventCategory.Reminder)) continue;
            var startStr = r.ReminderTime.HasValue
                ? $"{r.ReminderDate:yyyy-MM-dd}T{r.ReminderTime:HH:mm}"
                : r.ReminderDate.ToString("yyyy-MM-dd");
            events.Add(MappingExtensions.ToCalendarEvent(
                5000 + r.Id, r.Title, r.Description, startStr, startStr,
                !r.ReminderTime.HasValue, EventCategory.Reminder, createdById: r.CreatedById));
        }

        var companyEvents = await db.Events
            .Where(e => e.StartDate <= end && e.EndDate >= start)
            .ToListAsync();

        foreach (var e in companyEvents)
        {
            if (allowed != null && !allowed.Contains(e.Category)) continue;
            var startStr = e.IsAllDay ? e.StartDate.ToString("yyyy-MM-dd") : $"{e.StartDate:yyyy-MM-dd}T{e.StartTime:HH:mm}";
            var endStr = e.IsAllDay ? e.EndDate.ToString("yyyy-MM-dd") : $"{e.EndDate:yyyy-MM-dd}T{e.EndTime:HH:mm}";
            events.Add(MappingExtensions.ToCalendarEvent(
                2000 + e.Id, e.Title, e.Description, startStr, endStr, e.IsAllDay, e.Category, e.Location, createdById: e.CreatedById));
        }

        var holidays = await db.Holidays
            .Where(h => h.Date >= start && h.Date <= end)
            .ToListAsync();

        foreach (var h in holidays)
        {
            if (allowed != null && !allowed.Contains(EventCategory.Holiday)) continue;
            events.Add(MappingExtensions.ToCalendarEvent(
                3000 + h.Id, h.Name, h.Description, h.Date.ToString("yyyy-MM-dd"), h.Date.ToString("yyyy-MM-dd"),
                true, EventCategory.Holiday));
        }

        IQueryable<LeaveRequest> leavesQuery = db.LeaveRequests
            .Include(l => l.User)
            .Where(l => l.Status == LeaveStatus.Approved && l.StartDate <= end && l.EndDate >= start);
        if (!isAdmin)
            leavesQuery = leavesQuery.Where(l => l.UserId == userId);

        var leaves = await leavesQuery.ToListAsync();

        foreach (var l in leaves)
        {
            if (allowed != null && !allowed.Contains(EventCategory.Leave)) continue;
            var name = l.User != null ? $"{l.User.FirstName} {l.User.LastName}" : "Unknown";
            events.Add(MappingExtensions.ToCalendarEvent(
                4000 + l.Id, $"{name} - Leave", l.Reason,
                l.StartDate.ToString("yyyy-MM-dd"), l.EndDate.ToString("yyyy-MM-dd"),
                true, EventCategory.Leave, createdById: l.UserId, createdByName: name));
        }

        return events;
    }

    public async Task<List<CalendarEventDto>> SearchEventsAsync(string query, int userId, bool isAdmin)
    {
        var q = query.Trim();
        var viewer = await db.Users.FindAsync(userId);
        var departmentId = viewer?.DepartmentId;
        var events = new List<CalendarEventDto>();

        IQueryable<Schedule> schedulesQuery = db.Schedules
            .Include(s => s.Department)
            .Include(s => s.Assignments)
            .Where(s => s.Title.Contains(q) || (s.Description != null && s.Description.Contains(q)));
        if (!isAdmin)
            schedulesQuery = schedulesQuery.Where(s =>
                s.Assignments.Any(a => a.UserId == userId)
                || (!s.Assignments.Any() && departmentId != null && s.DepartmentId == departmentId));

        foreach (var s in await schedulesQuery.ToListAsync())
            events.Add(MappingExtensions.ToCalendarEvent(
                s.Id, s.Title, s.Description,
                $"{s.Date:yyyy-MM-dd}T{s.StartTime:HH:mm}",
                $"{s.Date:yyyy-MM-dd}T{s.EndTime:HH:mm}",
                false, EventCategory.Schedule, s.Location, s.DepartmentId, s.Department?.Name, s.CreatedById));

        IQueryable<Meeting> meetingsQuery = db.Meetings
            .Include(m => m.CreatedBy)
            .Include(m => m.Participants)
            .Where(m => m.Title.Contains(q) || (m.Description != null && m.Description.Contains(q)));
        if (!isAdmin)
            meetingsQuery = meetingsQuery.Where(m =>
                m.CreatedById == userId || m.Participants.Any(p => p.UserId == userId));

        foreach (var m in await meetingsQuery.ToListAsync())
            events.Add(MappingExtensions.ToCalendarEvent(
                1000 + m.Id, m.Title, m.Description,
                $"{m.MeetingDate:yyyy-MM-dd}T{m.StartTime:HH:mm}",
                $"{m.MeetingDate:yyyy-MM-dd}T{m.EndTime:HH:mm}",
                false, EventCategory.Meeting, m.Location,
                createdById: m.CreatedById,
                createdByName: m.CreatedBy != null ? $"{m.CreatedBy.FirstName} {m.CreatedBy.LastName}" : null));

        IQueryable<Reminder> remindersQuery = db.Reminders
            .Where(r => r.Title.Contains(q) || (r.Description != null && r.Description.Contains(q)));
        if (!isAdmin)
            remindersQuery = remindersQuery.Where(r =>
                r.IsCompanyWide || r.UserId == userId || r.CreatedById == userId);

        foreach (var r in await remindersQuery.ToListAsync())
        {
            var startStr = r.ReminderTime.HasValue
                ? $"{r.ReminderDate:yyyy-MM-dd}T{r.ReminderTime:HH:mm}"
                : r.ReminderDate.ToString("yyyy-MM-dd");
            events.Add(MappingExtensions.ToCalendarEvent(
                5000 + r.Id, r.Title, r.Description, startStr, startStr,
                !r.ReminderTime.HasValue, EventCategory.Reminder, createdById: r.CreatedById));
        }

        var companyEvents = await db.Events
            .Where(e => e.Title.Contains(q) || (e.Description != null && e.Description.Contains(q)))
            .ToListAsync();

        foreach (var e in companyEvents)
        {
            var startStr = e.IsAllDay ? e.StartDate.ToString("yyyy-MM-dd") : $"{e.StartDate:yyyy-MM-dd}T{e.StartTime:HH:mm}";
            var endStr = e.IsAllDay ? e.EndDate.ToString("yyyy-MM-dd") : $"{e.EndDate:yyyy-MM-dd}T{e.EndTime:HH:mm}";
            events.Add(MappingExtensions.ToCalendarEvent(
                2000 + e.Id, e.Title, e.Description, startStr, endStr, e.IsAllDay, e.Category, e.Location, createdById: e.CreatedById));
        }

        var holidays = await db.Holidays
            .Where(h => h.Name.Contains(q) || (h.Description != null && h.Description.Contains(q)))
            .ToListAsync();

        foreach (var h in holidays)
            events.Add(MappingExtensions.ToCalendarEvent(
                3000 + h.Id, h.Name, h.Description, h.Date.ToString("yyyy-MM-dd"), h.Date.ToString("yyyy-MM-dd"),
                true, EventCategory.Holiday));

        IQueryable<LeaveRequest> leavesQuery = db.LeaveRequests
            .Include(l => l.User)
            .Where(l => l.Status == LeaveStatus.Approved);
        if (!isAdmin)
            leavesQuery = leavesQuery.Where(l => l.UserId == userId);

        foreach (var l in await leavesQuery.ToListAsync())
        {
            var name = l.User != null ? $"{l.User.FirstName} {l.User.LastName}" : "Unknown";
            var title = $"{name} - Leave";
            var matches = title.Contains(q, StringComparison.OrdinalIgnoreCase)
                || (l.Reason != null && l.Reason.Contains(q, StringComparison.OrdinalIgnoreCase));
            if (!matches) continue;
            events.Add(MappingExtensions.ToCalendarEvent(
                4000 + l.Id, title, l.Reason,
                l.StartDate.ToString("yyyy-MM-dd"), l.EndDate.ToString("yyyy-MM-dd"),
                true, EventCategory.Leave, createdById: l.UserId, createdByName: name));
        }

        return events.OrderBy(e => e.Start).Take(50).ToList();
    }

    public async Task<DashboardDto> GetDashboardAsync(int userId, bool isAdmin)
    {
        var today = DateParsing.Today();
        var viewer = await db.Users.FindAsync(userId);
        var departmentId = viewer?.DepartmentId;

        IQueryable<Schedule> todaySchedulesQuery = db.Schedules
            .Include(s => s.Department)
            .Include(s => s.Assignments).ThenInclude(a => a.User)
            .Where(s => s.Date == today);
        if (!isAdmin)
            todaySchedulesQuery = todaySchedulesQuery.Where(s =>
                s.Assignments.Any(a => a.UserId == userId)
                || (!s.Assignments.Any() && departmentId != null && s.DepartmentId == departmentId));

        var todaySchedules = await todaySchedulesQuery
            .OrderBy(s => s.StartTime)
            .ToListAsync();

        IQueryable<Meeting> upcomingMeetingsQuery = db.Meetings
            .Include(m => m.CreatedBy)
            .Include(m => m.Participants).ThenInclude(p => p.User)
            .Include(m => m.ExternalParticipants)
            .Where(m => m.MeetingDate >= today);
        if (!isAdmin)
            upcomingMeetingsQuery = upcomingMeetingsQuery.Where(m =>
                m.CreatedById == userId || m.Participants.Any(p => p.UserId == userId));

        var upcomingMeetings = await upcomingMeetingsQuery
            .OrderBy(m => m.MeetingDate)
            .ThenBy(m => m.StartTime)
            .Take(8)
            .ToListAsync();

        var upcomingEvents = await db.Events
            .Where(e => e.EndDate >= today)
            .OrderBy(e => e.StartDate)
            .Take(8)
            .ToListAsync();

        var announcements = await db.Announcements
            .Include(a => a.CreatedBy)
            .Where(a => a.ExpiresAt == null || a.ExpiresAt >= DateTime.UtcNow)
            .OrderByDescending(a => a.IsPinned)
            .ThenByDescending(a => a.CreatedAt)
            .Take(5)
            .ToListAsync();

        IQueryable<Reminder> todayRemindersQuery = db.Reminders.Where(r => r.ReminderDate == today);
        if (!isAdmin)
            todayRemindersQuery = todayRemindersQuery.Where(r =>
                r.IsCompanyWide || r.UserId == userId || r.CreatedById == userId);

        var todayReminders = await todayRemindersQuery
            .OrderBy(r => r.ReminderTime)
            .ToListAsync();

        IQueryable<LeaveRequest> onLeaveQuery = db.LeaveRequests
            .Include(l => l.User)
            .Where(l => l.Status == LeaveStatus.Approved && l.StartDate <= today && l.EndDate >= today);
        if (!isAdmin)
            onLeaveQuery = onLeaveQuery.Where(l => l.UserId == userId);

        var onLeave = await onLeaveQuery.ToListAsync();

        IQueryable<LeaveRequest> pendingLeaveQuery = db.LeaveRequests
            .Include(l => l.User)
            .Where(l => l.Status == LeaveStatus.Pending);
        if (!isAdmin)
            pendingLeaveQuery = pendingLeaveQuery.Where(l => l.UserId == userId);

        var pendingLeave = await pendingLeaveQuery
            .OrderBy(l => l.StartDate)
            .Take(8)
            .ToListAsync();

        var monthStart = new DateOnly(today.Year, today.Month, 1).AddMonths(-1);
        var monthEnd = new DateOnly(today.Year, today.Month, 1).AddMonths(3).AddDays(-1);
        var miniEvents = await GetEventsAsync(monthStart, monthEnd, null, userId, isAdmin);

        return new DashboardDto(
            todaySchedules.Select(s => s.ToDto()),
            upcomingMeetings.Select(m => m.ToDto()),
            upcomingEvents.Select(e => e.ToDto()),
            announcements.Select(a => a.ToDto()),
            todayReminders.Select(r => r.ToDto()),
            onLeave.Select(l => l.ToDto()),
            miniEvents,
            pendingLeave.Select(l => l.ToDto()));
    }
}
