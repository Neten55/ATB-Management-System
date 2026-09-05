using System.Text;

namespace CompanyCalendar.Api.Services;

public static class CalendarInviteHelper
{
    public static string? BuildGoogleCalendarUrl(InvitationDetails d)
    {
        if (d.EventDate is null) return null;

        var start = FormatGoogleDate(d.EventDate.Value, d.IsAllDay ? null : d.StartTime, d.IsAllDay);
        var endDate = d.EventDate.Value;
        TimeOnly? endTime = d.EndTime;
        if (d.IsAllDay)
        {
            endDate = endDate.AddDays(1);
            endTime = null;
        }
        else if (endTime is null)
        {
            endTime = (d.StartTime ?? new TimeOnly(9, 0)).AddHours(1);
        }

        var end = FormatGoogleDate(endDate, d.IsAllDay ? null : endTime, d.IsAllDay);
        var query = new StringBuilder("https://calendar.google.com/calendar/render?action=TEMPLATE");
        query.Append("&text=").Append(Uri.EscapeDataString(d.Title));
        query.Append("&dates=").Append(start).Append('/').Append(end);
        if (!string.IsNullOrWhiteSpace(d.Description))
            query.Append("&details=").Append(Uri.EscapeDataString(d.Description));
        if (!string.IsNullOrWhiteSpace(d.Location))
            query.Append("&location=").Append(Uri.EscapeDataString(d.Location));
        return query.ToString();
    }

    public static string? BuildIcs(
        InvitationDetails d,
        string organizerEmail,
        string attendeeName,
        string attendeeEmail)
    {
        if (d.EventDate is null) return null;

        TimeOnly? startTime = d.IsAllDay ? null : d.StartTime ?? new TimeOnly(9, 0);
        TimeOnly? endTime = d.IsAllDay ? null : d.EndTime ?? startTime?.AddHours(1) ?? new TimeOnly(10, 0);
        var endDate = d.IsAllDay ? d.EventDate.Value.AddDays(1) : d.EventDate.Value;
        var uid = $"{Guid.NewGuid():N}@aerotech.bt";
        var now = DateTime.UtcNow.ToString("yyyyMMdd'T'HHmmss'Z'");

        var sb = new StringBuilder();
        sb.AppendLine("BEGIN:VCALENDAR");
        sb.AppendLine("VERSION:2.0");
        sb.AppendLine("PRODID:-//Aerotech Bhutan//Company Calendar//EN");
        sb.AppendLine("CALSCALE:GREGORIAN");
        sb.AppendLine("METHOD:REQUEST");
        sb.AppendLine("BEGIN:VEVENT");
        sb.AppendLine($"UID:{uid}");
        sb.AppendLine($"DTSTAMP:{now}");
        sb.AppendLine(d.IsAllDay
            ? $"DTSTART;VALUE=DATE:{d.EventDate.Value:yyyyMMdd}"
            : $"DTSTART:{d.EventDate.Value:yyyyMMdd}T{startTime:HHmmss}");
        sb.AppendLine(d.IsAllDay
            ? $"DTEND;VALUE=DATE:{endDate:yyyyMMdd}"
            : $"DTEND:{endDate:yyyyMMdd}T{endTime:HHmmss}");
        sb.AppendLine($"SUMMARY:{EscapeIcs(d.Title)}");
        if (!string.IsNullOrWhiteSpace(d.Description))
            sb.AppendLine($"DESCRIPTION:{EscapeIcs(d.Description)}");
        if (!string.IsNullOrWhiteSpace(d.Location))
            sb.AppendLine($"LOCATION:{EscapeIcs(d.Location)}");
        sb.AppendLine($"ORGANIZER;CN={EscapeIcs(d.Organizer)}:mailto:{organizerEmail}");
        sb.AppendLine($"ATTENDEE;CN={EscapeIcs(attendeeName)};RSVP=TRUE:mailto:{attendeeEmail}");
        sb.AppendLine("END:VEVENT");
        sb.AppendLine("END:VCALENDAR");
        return sb.ToString().Replace("\r\n", "\n").Replace("\n", "\r\n");
    }

    public static bool IsHttpUrl(string? value) =>
        !string.IsNullOrWhiteSpace(value)
        && (value.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            || value.StartsWith("https://", StringComparison.OrdinalIgnoreCase));

    public static string InvitationResultMessage(InvitationEmailResult result) => result switch
    {
        InvitationEmailResult.Sent =>
            "Calendar invitation emails were sent to external participants.",
        InvitationEmailResult.Failed =>
            "The item was saved, but invitation emails could not be sent. Check SMTP settings and API logs.",
        InvitationEmailResult.NoRecipients =>
            "No valid external email addresses were provided, so no invitations were sent.",
        _ => string.Empty,
    };

    private static string FormatGoogleDate(DateOnly date, TimeOnly? time, bool allDay) =>
        allDay || time is null ? date.ToString("yyyyMMdd") : $"{date:yyyyMMdd}T{time:HHmmss}";

    private static string EscapeIcs(string value) =>
        value.Replace("\\", "\\\\").Replace(";", "\\;").Replace(",", "\\,").Replace("\r\n", "\\n").Replace("\n", "\\n");
}
