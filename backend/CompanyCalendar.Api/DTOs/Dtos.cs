namespace CompanyCalendar.Api.DTOs;

public record LoginRequest(string Email, string Password);
public record RegisterRequest(string Email, string Password, string FirstName, string LastName, int? DepartmentId, string? JobTitle, string? Phone);
public record LoginResponse(string Token, UserDto User, bool? WelcomeEmailSent = null, string? WelcomeEmailMessage = null);

public record UserDto(
    int Id,
    string Email,
    string FirstName,
    string LastName,
    string FullName,
    string Role,
    int? DepartmentId,
    string? DepartmentName,
    string? Phone,
    string? JobTitle,
    string? AvatarUrl);

public record DepartmentDto(int Id, string Name, string? Description);

public record ExternalParticipantDto(
    int Id,
    string Name,
    string Organization,
    string Email,
    string? Phone);

public class ExternalParticipantRequest
{
    public string Name { get; set; } = string.Empty;
    public string Organization { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
}

public record CalendarEventDto(
    int Id,
    string Title,
    string? Description,
    string Start,
    string End,
    bool AllDay,
    string Category,
    string Color,
    string? Location,
    int? DepartmentId,
    string? DepartmentName,
    int CreatedById,
    string? CreatedByName);

public record ScheduleDto(
    int Id,
    string Title,
    string? Description,
    string Date,
    string StartTime,
    string EndTime,
    int? DepartmentId,
    string? DepartmentName,
    string? Location,
    string Priority,
    string? ReminderTiming,
    int[] AssignedEmployeeIds,
    string[]? AssignedEmployeeNames,
    int CreatedById,
    string CreatedAt);

public record CreateScheduleRequest(
    string Title,
    string? Description,
    string Date,
    string StartTime,
    string EndTime,
    int? DepartmentId,
    string? Location,
    string Priority,
    string? ReminderTiming,
    int[]? AssignedEmployeeIds);

public record MeetingDto(
    int Id,
    string Title,
    string? Description,
    string MeetingDate,
    string StartTime,
    string EndTime,
    string? Location,
    string? ReminderTiming,
    bool SendEmailNotification,
    int[] ParticipantIds,
    string[]? ParticipantNames,
    ExternalParticipantDto[] ExternalParticipants,
    int CreatedById,
    string? CreatedByName,
    string CreatedAt,
    bool? InvitationEmailsSent = null,
    string? InvitationEmailMessage = null);

public class CreateMeetingRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string MeetingDate { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public string? Location { get; set; }
    public string? ReminderTiming { get; set; }
    public bool SendEmailNotification { get; set; }
    public int[]? ParticipantIds { get; set; }
    public List<ExternalParticipantRequest>? ExternalParticipants { get; set; }
}

public record ReminderDto(
    int Id,
    string Title,
    string? Description,
    string ReminderDate,
    string? ReminderTime,
    string Timing,
    bool IsCompanyWide,
    bool SendEmailNotification,
    int? UserId,
    ExternalParticipantDto[] ExternalParticipants,
    int CreatedById,
    string CreatedAt,
    bool? InvitationEmailsSent = null,
    string? InvitationEmailMessage = null);

public class CreateReminderRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ReminderDate { get; set; } = string.Empty;
    public string? ReminderTime { get; set; }
    public string Timing { get; set; } = "OneHourBefore";
    public bool IsCompanyWide { get; set; }
    public bool SendEmailNotification { get; set; }
    public int? UserId { get; set; }
    public List<ExternalParticipantRequest>? ExternalParticipants { get; set; }
}

public record CompanyEventDto(
    int Id,
    string Title,
    string? Description,
    string StartDate,
    string EndDate,
    string? StartTime,
    string? EndTime,
    string? Location,
    string Category,
    bool IsAllDay,
    string? ReminderTiming,
    bool SendEmailNotification,
    ExternalParticipantDto[] ExternalParticipants,
    int CreatedById,
    string CreatedAt,
    bool? InvitationEmailsSent = null,
    string? InvitationEmailMessage = null);

public class CreateCompanyEventRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string StartDate { get; set; } = string.Empty;
    public string EndDate { get; set; } = string.Empty;
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public string? Location { get; set; }
    public string Category { get; set; } = "CompanyEvent";
    public bool IsAllDay { get; set; }
    public string? ReminderTiming { get; set; }
    public bool SendEmailNotification { get; set; }
    public List<ExternalParticipantRequest>? ExternalParticipants { get; set; }
}

public record LeaveRequestDto(
    int Id,
    int UserId,
    string UserName,
    string LeaveType,
    string StartDate,
    string EndDate,
    string? Reason,
    string Status,
    int? ReviewedById,
    string? ReviewedByName,
    string? ReviewNotes,
    string CreatedAt);

public record CreateLeaveRequest(string LeaveType, string StartDate, string EndDate, string? Reason);
public record ReviewLeaveRequest(string? ReviewNotes);

public record AnnouncementDto(
    int Id,
    string Title,
    string Content,
    bool IsPinned,
    bool IsUrgent,
    int CreatedById,
    string? CreatedByName,
    string CreatedAt,
    string? ExpiresAt);

public record CreateAnnouncementRequest(string Title, string Content, bool IsPinned, bool IsUrgent, string? ExpiresAt);

public record HolidayDto(int Id, string Name, string Date, string? Description, bool IsRecurring);
public record CreateHolidayRequest(string Name, string Date, string? Description, bool IsRecurring);

public record DashboardDto(
    IEnumerable<ScheduleDto> TodaySchedules,
    IEnumerable<MeetingDto> UpcomingMeetings,
    IEnumerable<CompanyEventDto> UpcomingEvents,
    IEnumerable<AnnouncementDto> RecentAnnouncements,
    IEnumerable<ReminderDto> TodayReminders,
    IEnumerable<LeaveRequestDto> OnLeaveToday,
    IEnumerable<CalendarEventDto> MiniCalendarEvents,
    IEnumerable<LeaveRequestDto> PendingLeave);

public class UpdateProfileRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? JobTitle { get; set; }
    public string? Email { get; set; }
    public int? DepartmentId { get; set; }
    public string? NewPassword { get; set; }
}

public record ProjectMemberDto(int UserId, string FullName, string? DepartmentName);
public record ProjectTaskDto(int Id, string Title, string? Description, int? AssigneeId, string? AssigneeName, string? DueDate, string Priority, string Status, int CreatedById, string CreatedAt);
public record ProjectDiscussionDto(int Id, int AuthorId, string AuthorName, string Content, int? ParentId, string CreatedAt);
public record ProjectNoteDto(int Id, int AuthorId, string AuthorName, string Content, string CreatedAt);
public record ProjectDto(int Id, string Name, string? Description, int OwnerId, string OwnerName, string? StartDate, string? DueDate, string Status, int Progress, IEnumerable<ProjectMemberDto> Members, IEnumerable<ProjectTaskDto>? Tasks = null, IEnumerable<ProjectDiscussionDto>? Discussions = null, IEnumerable<ProjectNoteDto>? Notes = null);
public class ProjectRequest { public string Name { get; set; } = string.Empty; public string? Description { get; set; } public int? OwnerId { get; set; } public string? StartDate { get; set; } public string? DueDate { get; set; } public string Status { get; set; } = "Planning"; public int[]? MemberIds { get; set; } }
public class ProjectTaskRequest { public string Title { get; set; } = string.Empty; public string? Description { get; set; } public int? AssigneeId { get; set; } public string? DueDate { get; set; } public string Priority { get; set; } = "Medium"; public string Status { get; set; } = "ToDo"; }
public record ProjectDiscussionRequest(string Content, int? ParentId);
public record ProjectNoteRequest(string Content);

public record ReportShareDto(int UserId, string FullName, string? DepartmentName, string SharedAt);
public record ReportCommentDto(int Id, int AuthorId, string AuthorName, string Content, string CreatedAt);
public record ReportAttachmentDto(int Id, string FileName, string ContentType, long FileSizeBytes, int UploadedById, string UploadedByName, string UploadedAt);
public record ReportVersionDto(int Id, string Title, string Status, int EditedById, string EditedByName, string EditedAt);

public record ReportListItemDto(
    int Id,
    string Title,
    string Status,
    int? DepartmentId,
    string? DepartmentName,
    int CreatedById,
    string CreatedByName,
    string CreatedAt,
    string UpdatedAt,
    int ShareCount,
    int AttachmentCount,
    int CommentCount);

public record ReportDto(
    int Id,
    string Title,
    string Content,
    string Status,
    int? DepartmentId,
    string? DepartmentName,
    int CreatedById,
    string CreatedByName,
    string CreatedAt,
    string UpdatedAt,
    string? SubmittedAt,
    int? ReviewedById,
    string? ReviewedByName,
    string? ReviewedAt,
    string? ReviewNotes,
    IEnumerable<ReportShareDto> Shares,
    IEnumerable<ReportCommentDto> Comments,
    IEnumerable<ReportAttachmentDto> Attachments,
    IEnumerable<ReportVersionDto> Versions);

public class CreateReportRequest
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int? DepartmentId { get; set; }
}

public class ReportStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public string? ReviewNotes { get; set; }
}

public class ReportShareRequest
{
    public int[] UserIds { get; set; } = [];
}

public record ReportCommentRequest(string Content);
