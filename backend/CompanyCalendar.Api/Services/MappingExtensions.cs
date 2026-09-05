using CompanyCalendar.Api.DTOs;
using CompanyCalendar.Api.Models;

namespace CompanyCalendar.Api.Services;

public static class MappingExtensions
{
    private static readonly Dictionary<EventCategory, string> EventColors = new()
    {
        [EventCategory.Meeting] = "#3b82f6",
        [EventCategory.Reminder] = "#f59e0b",
        [EventCategory.CompanyEvent] = "#8b5cf6",
        [EventCategory.Holiday] = "#ef4444",
        [EventCategory.Leave] = "#06b6d4",
        [EventCategory.Deadline] = "#dc2626",
        [EventCategory.Training] = "#10b981",
        [EventCategory.Workshop] = "#6366f1",
        [EventCategory.Birthday] = "#ec4899",
        [EventCategory.Schedule] = "#0ea5e9",
        [EventCategory.Announcement] = "#f97316",
    };

    public static UserDto ToDto(this ApplicationUser user) => new(
        user.Id,
        user.Email,
        user.FirstName,
        user.LastName,
        $"{user.FirstName} {user.LastName}",
        user.Role.ToString(),
        user.DepartmentId,
        user.Department?.Name,
        user.Phone,
        user.JobTitle,
        user.AvatarUrl);

    public static DepartmentDto ToDto(this Department d) => new(d.Id, d.Name, d.Description);

    public static ExternalParticipantDto ToDto(this ExternalParticipant p) => new(
        p.Id, p.Name, p.Organization, p.Email, p.Phone);

    public static ScheduleDto ToDto(this Schedule s) => new(
        s.Id,
        s.Title,
        s.Description,
        s.Date.ToString("yyyy-MM-dd"),
        s.StartTime.ToString("HH:mm"),
        s.EndTime.ToString("HH:mm"),
        s.DepartmentId,
        s.Department?.Name,
        s.Location,
        s.Priority.ToString(),
        s.ReminderTiming?.ToString(),
        s.Assignments.Select(a => a.UserId).ToArray(),
        s.Assignments.Select(a => $"{a.User!.FirstName} {a.User.LastName}").ToArray(),
        s.CreatedById,
        s.CreatedAt.ToString("yyyy-MM-dd"));

    public static MeetingDto ToDto(this Meeting m) => new(
        m.Id,
        m.Title,
        m.Description,
        m.MeetingDate.ToString("yyyy-MM-dd"),
        m.StartTime.ToString("HH:mm"),
        m.EndTime.ToString("HH:mm"),
        m.Location,
        m.ReminderTiming?.ToString(),
        m.SendEmailNotification,
        m.Participants.Select(p => p.UserId).ToArray(),
        m.Participants.Select(p => p.User != null
            ? $"{p.User.FirstName} {p.User.LastName}"
            : $"User {p.UserId}").ToArray(),
        m.ExternalParticipants.Select(p => p.ToDto()).ToArray(),
        m.CreatedById,
        m.CreatedBy != null ? $"{m.CreatedBy.FirstName} {m.CreatedBy.LastName}" : null,
        m.CreatedAt.ToString("yyyy-MM-dd"));

    public static ReminderDto ToDto(this Reminder r) => new(
        r.Id,
        r.Title,
        r.Description,
        r.ReminderDate.ToString("yyyy-MM-dd"),
        r.ReminderTime?.ToString("HH:mm"),
        r.Timing.ToString(),
        r.IsCompanyWide,
        r.SendEmailNotification,
        r.UserId,
        r.ExternalParticipants.Select(p => p.ToDto()).ToArray(),
        r.CreatedById,
        r.CreatedAt.ToString("yyyy-MM-dd"));

    public static CompanyEventDto ToDto(this CompanyEvent e) => new(
        e.Id,
        e.Title,
        e.Description,
        e.StartDate.ToString("yyyy-MM-dd"),
        e.EndDate.ToString("yyyy-MM-dd"),
        e.StartTime?.ToString("HH:mm"),
        e.EndTime?.ToString("HH:mm"),
        e.Location,
        e.Category.ToString(),
        e.IsAllDay,
        e.ReminderTiming?.ToString(),
        e.SendEmailNotification,
        e.ExternalParticipants.Select(p => p.ToDto()).ToArray(),
        e.CreatedById,
        e.CreatedAt.ToString("yyyy-MM-dd"));

    public static LeaveRequestDto ToDto(this LeaveRequest l) => new(
        l.Id,
        l.UserId,
        l.User != null ? $"{l.User.FirstName} {l.User.LastName}" : "",
        l.LeaveType.ToString(),
        l.StartDate.ToString("yyyy-MM-dd"),
        l.EndDate.ToString("yyyy-MM-dd"),
        l.Reason,
        l.Status.ToString(),
        l.ReviewedById,
        l.ReviewedBy != null ? $"{l.ReviewedBy.FirstName} {l.ReviewedBy.LastName}" : null,
        l.ReviewNotes,
        l.CreatedAt.ToString("yyyy-MM-dd"));

    public static AnnouncementDto ToDto(this Announcement a) => new(
        a.Id,
        a.Title,
        a.Content,
        a.IsPinned,
        a.IsUrgent,
        a.CreatedById,
        a.CreatedBy != null ? $"{a.CreatedBy.FirstName} {a.CreatedBy.LastName}" : null,
        a.CreatedAt.ToString("yyyy-MM-dd"),
        a.ExpiresAt?.ToString("yyyy-MM-dd"));

    public static HolidayDto ToDto(this Holiday h) => new(
        h.Id,
        h.Name,
        h.Date.ToString("yyyy-MM-dd"),
        h.Description,
        h.IsRecurring);

    public static ProjectDto ToDto(this Project p, bool includeDetails = false) => new(
        p.Id, p.Name, p.Description, p.OwnerId,
        p.Owner != null ? $"{p.Owner.FirstName} {p.Owner.LastName}" : "",
        p.StartDate?.ToString("yyyy-MM-dd"), p.DueDate?.ToString("yyyy-MM-dd"), p.Status.ToString(),
        p.Tasks.Count == 0 ? 0 : (int)Math.Round(p.Tasks.Count(t => t.Status == ProjectTaskStatus.Done) * 100d / p.Tasks.Count),
        p.Members.Select(m => new ProjectMemberDto(m.UserId, m.User != null ? $"{m.User.FirstName} {m.User.LastName}" : $"User {m.UserId}", m.User?.Department?.Name)),
        includeDetails ? p.Tasks.OrderBy(t => t.Status).ThenBy(t => t.DueDate).Select(t => new ProjectTaskDto(t.Id, t.Title, t.Description, t.AssigneeId, t.Assignee != null ? $"{t.Assignee.FirstName} {t.Assignee.LastName}" : null, t.DueDate?.ToString("yyyy-MM-dd"), t.Priority.ToString(), t.Status.ToString(), t.CreatedById, t.CreatedAt.ToString("O"))) : null,
        includeDetails ? p.Discussions.OrderBy(d => d.CreatedAt).Select(d => new ProjectDiscussionDto(d.Id, d.AuthorId, d.Author != null ? $"{d.Author.FirstName} {d.Author.LastName}" : "", d.Content, d.ParentId, d.CreatedAt.ToString("O"))) : null,
        includeDetails ? p.Notes.OrderByDescending(n => n.CreatedAt).Select(n => new ProjectNoteDto(n.Id, n.AuthorId, n.Author != null ? $"{n.Author.FirstName} {n.Author.LastName}" : "", n.Content, n.CreatedAt.ToString("O"))) : null);

    public static CalendarEventDto ToCalendarEvent(
        int id, string title, string? description,
        string start, string end, bool allDay,
        EventCategory category, string? location = null,
        int? departmentId = null, string? departmentName = null,
        int createdById = 0, string? createdByName = null) => new(
        id, title, description, start, end, allDay,
        category.ToString(),
        EventColors.GetValueOrDefault(category, "#6b7280"),
        location, departmentId, departmentName, createdById, createdByName);

    public static TEnum ParseEnum<TEnum>(string value) where TEnum : struct, Enum =>
        Enum.Parse<TEnum>(value, true);

    public static ReportShareDto ToDto(this ReportShare s) => new(
        s.UserId,
        s.User != null ? $"{s.User.FirstName} {s.User.LastName}" : $"User {s.UserId}",
        s.User?.Department?.Name,
        s.SharedAt.ToString("O"));

    public static ReportCommentDto ToDto(this ReportComment c) => new(
        c.Id, c.AuthorId, c.Author != null ? $"{c.Author.FirstName} {c.Author.LastName}" : "", c.Content, c.CreatedAt.ToString("O"));

    public static ReportAttachmentDto ToDto(this ReportAttachment a) => new(
        a.Id, a.FileName, a.ContentType, a.FileSizeBytes, a.UploadedById,
        a.UploadedBy != null ? $"{a.UploadedBy.FirstName} {a.UploadedBy.LastName}" : "", a.UploadedAt.ToString("O"));

    public static ReportVersionDto ToDto(this ReportVersion v) => new(
        v.Id, v.Title, v.Status.ToString(), v.EditedById,
        v.EditedBy != null ? $"{v.EditedBy.FirstName} {v.EditedBy.LastName}" : "", v.EditedAt.ToString("O"));

    public static ReportListItemDto ToListDto(this Report r) => new(
        r.Id, r.Title, r.Status.ToString(), r.DepartmentId, r.Department?.Name, r.CreatedById,
        r.CreatedBy != null ? $"{r.CreatedBy.FirstName} {r.CreatedBy.LastName}" : "",
        r.CreatedAt.ToString("O"), r.UpdatedAt.ToString("O"),
        r.Shares.Count, r.Attachments.Count, r.Comments.Count);

    public static ReportDto ToDto(this Report r) => new(
        r.Id, r.Title, r.Content, r.Status.ToString(), r.DepartmentId, r.Department?.Name, r.CreatedById,
        r.CreatedBy != null ? $"{r.CreatedBy.FirstName} {r.CreatedBy.LastName}" : "",
        r.CreatedAt.ToString("O"), r.UpdatedAt.ToString("O"), r.SubmittedAt?.ToString("O"),
        r.ReviewedById, r.ReviewedBy != null ? $"{r.ReviewedBy.FirstName} {r.ReviewedBy.LastName}" : null,
        r.ReviewedAt?.ToString("O"), r.ReviewNotes,
        r.Shares.Select(s => s.ToDto()),
        r.Comments.OrderBy(c => c.CreatedAt).Select(c => c.ToDto()),
        r.Attachments.OrderByDescending(a => a.UploadedAt).Select(a => a.ToDto()),
        r.Versions.OrderByDescending(v => v.EditedAt).Select(v => v.ToDto()));
}
