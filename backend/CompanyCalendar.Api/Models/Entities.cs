namespace CompanyCalendar.Api.Models;

public class Department
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ICollection<ApplicationUser> Users { get; set; } = [];
    public ICollection<Schedule> Schedules { get; set; } = [];
}

public enum UserRole
{
    Administrator,
    Employee
}

public class ApplicationUser
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Employee;
    public int? DepartmentId { get; set; }
    public Department? Department { get; set; }
    public string? Phone { get; set; }
    public string? JobTitle { get; set; }
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<ScheduleAssignment> ScheduleAssignments { get; set; } = [];
    public ICollection<MeetingParticipant> MeetingParticipants { get; set; } = [];
    public ICollection<LeaveRequest> LeaveRequests { get; set; } = [];
    public ICollection<Reminder> Reminders { get; set; } = [];
}

public enum Priority { Low, Medium, High, Critical }

public enum ReminderTiming
{
    OneDayBefore,
    ThreeHoursBefore,
    OneHourBefore,
    ThirtyMinutesBefore,
    FifteenMinutesBefore
}

public enum EventCategory
{
    Meeting,
    Reminder,
    CompanyEvent,
    Holiday,
    Leave,
    Deadline,
    Training,
    Workshop,
    Birthday,
    Schedule,
    Announcement
}

public enum LeaveStatus { Pending, Approved, Rejected }

public enum LeaveType { Annual, Sick, Personal, Maternity, Paternity, Unpaid }
public enum ProjectStatus { Planning, InProgress, OnHold, Completed }
public enum ProjectTaskStatus { ToDo, InProgress, Done }

public class Schedule
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateOnly Date { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int? DepartmentId { get; set; }
    public Department? Department { get; set; }
    public string? Location { get; set; }
    public Priority Priority { get; set; } = Priority.Medium;
    public ReminderTiming? ReminderTiming { get; set; }
    public int CreatedById { get; set; }
    public ApplicationUser? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<ScheduleAssignment> Assignments { get; set; } = [];
}

public class ScheduleAssignment
{
    public int ScheduleId { get; set; }
    public Schedule? Schedule { get; set; }
    public int UserId { get; set; }
    public ApplicationUser? User { get; set; }
}

public class Meeting
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateOnly MeetingDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string? Location { get; set; }
    public ReminderTiming? ReminderTiming { get; set; }
    public bool SendEmailNotification { get; set; }
    public bool ExternalReminderSent { get; set; }
    public int CreatedById { get; set; }
    public ApplicationUser? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<MeetingParticipant> Participants { get; set; } = [];
    public ICollection<ExternalParticipant> ExternalParticipants { get; set; } = [];
}

public class MeetingParticipant
{
    public int MeetingId { get; set; }
    public Meeting? Meeting { get; set; }
    public int UserId { get; set; }
    public ApplicationUser? User { get; set; }
}

public class Reminder
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateOnly ReminderDate { get; set; }
    public TimeOnly? ReminderTime { get; set; }
    public ReminderTiming Timing { get; set; } = ReminderTiming.OneHourBefore;
    public bool IsCompanyWide { get; set; }
    public int? UserId { get; set; }
    public ApplicationUser? User { get; set; }
    public bool SendEmailNotification { get; set; }
    public bool ExternalReminderSent { get; set; }
    public int CreatedById { get; set; }
    public ApplicationUser? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<ExternalParticipant> ExternalParticipants { get; set; } = [];
}

public class CompanyEvent
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public string? Location { get; set; }
    public EventCategory Category { get; set; } = EventCategory.CompanyEvent;
    public bool IsAllDay { get; set; }
    public ReminderTiming? ReminderTiming { get; set; }
    public bool SendEmailNotification { get; set; }
    public bool ExternalReminderSent { get; set; }
    public int CreatedById { get; set; }
    public ApplicationUser? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<ExternalParticipant> ExternalParticipants { get; set; } = [];
}

public class ExternalParticipant
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Organization { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public int? MeetingId { get; set; }
    public Meeting? Meeting { get; set; }
    public int? CompanyEventId { get; set; }
    public CompanyEvent? CompanyEvent { get; set; }
    public int? ReminderId { get; set; }
    public Reminder? Reminder { get; set; }
}

public class LeaveRequest
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public ApplicationUser? User { get; set; }
    public LeaveType LeaveType { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string? Reason { get; set; }
    public LeaveStatus Status { get; set; } = LeaveStatus.Pending;
    public int? ReviewedById { get; set; }
    public ApplicationUser? ReviewedBy { get; set; }
    public string? ReviewNotes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Announcement
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsPinned { get; set; }
    public bool IsUrgent { get; set; }
    public int CreatedById { get; set; }
    public ApplicationUser? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
}

public class Holiday
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public string? Description { get; set; }
    public bool IsRecurring { get; set; }
}

public class Notification
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public ApplicationUser? User { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Project
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int OwnerId { get; set; }
    public ApplicationUser? Owner { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? DueDate { get; set; }
    public ProjectStatus Status { get; set; } = ProjectStatus.Planning;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<ProjectMember> Members { get; set; } = [];
    public ICollection<ProjectTask> Tasks { get; set; } = [];
    public ICollection<ProjectDiscussion> Discussions { get; set; } = [];
    public ICollection<ProjectNote> Notes { get; set; } = [];
}

public class ProjectMember
{
    public int ProjectId { get; set; }
    public Project? Project { get; set; }
    public int UserId { get; set; }
    public ApplicationUser? User { get; set; }
}

public class ProjectTask
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public Project? Project { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? AssigneeId { get; set; }
    public ApplicationUser? Assignee { get; set; }
    public DateOnly? DueDate { get; set; }
    public Priority Priority { get; set; } = Priority.Medium;
    public ProjectTaskStatus Status { get; set; } = ProjectTaskStatus.ToDo;
    public int CreatedById { get; set; }
    public ApplicationUser? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class ProjectDiscussion
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public Project? Project { get; set; }
    public int AuthorId { get; set; }
    public ApplicationUser? Author { get; set; }
    public string Content { get; set; } = string.Empty;
    public int? ParentId { get; set; }
    public ProjectDiscussion? Parent { get; set; }
    public ICollection<ProjectDiscussion> Replies { get; set; } = [];
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class ProjectNote
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public Project? Project { get; set; }
    public int AuthorId { get; set; }
    public ApplicationUser? Author { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum ReportStatus { Draft, Submitted, Reviewed, Approved }

public class Report
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public ReportStatus Status { get; set; } = ReportStatus.Draft;
    public int? DepartmentId { get; set; }
    public Department? Department { get; set; }
    public int CreatedById { get; set; }
    public ApplicationUser? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? SubmittedAt { get; set; }
    public int? ReviewedById { get; set; }
    public ApplicationUser? ReviewedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewNotes { get; set; }
    public ICollection<ReportShare> Shares { get; set; } = [];
    public ICollection<ReportComment> Comments { get; set; } = [];
    public ICollection<ReportAttachment> Attachments { get; set; } = [];
    public ICollection<ReportVersion> Versions { get; set; } = [];
}

public class ReportShare
{
    public int ReportId { get; set; }
    public Report? Report { get; set; }
    public int UserId { get; set; }
    public ApplicationUser? User { get; set; }
    public DateTime SharedAt { get; set; } = DateTime.UtcNow;
}

public class ReportComment
{
    public int Id { get; set; }
    public int ReportId { get; set; }
    public Report? Report { get; set; }
    public int AuthorId { get; set; }
    public ApplicationUser? Author { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class ReportAttachment
{
    public int Id { get; set; }
    public int ReportId { get; set; }
    public Report? Report { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public int UploadedById { get; set; }
    public ApplicationUser? UploadedBy { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}

public class ReportVersion
{
    public int Id { get; set; }
    public int ReportId { get; set; }
    public Report? Report { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public ReportStatus Status { get; set; }
    public int EditedById { get; set; }
    public ApplicationUser? EditedBy { get; set; }
    public DateTime EditedAt { get; set; } = DateTime.UtcNow;
}
