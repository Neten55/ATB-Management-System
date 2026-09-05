namespace CompanyCalendar.Api.Services;

public enum InvitationEmailResult
{
    NotRequested,
    NoRecipients,
    Sent,
    Failed
}

public record InvitationDetails(
    string Title,
    string Date,
    string Time,
    string? Location,
    string Organizer,
    string? Description,
    string ContactPerson,
    string CompanyName = "Aerotech Bhutan",
    DateOnly? EventDate = null,
    TimeOnly? StartTime = null,
    TimeOnly? EndTime = null,
    bool IsAllDay = false,
    string? OrganizerEmail = null);
