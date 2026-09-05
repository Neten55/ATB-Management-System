using CompanyCalendar.Api.Models;

namespace CompanyCalendar.Api.Services;

public interface IExternalNotificationService
{
    Task<bool> SendInvitationsAsync(IEnumerable<ExternalParticipant> participants, InvitationDetails details);
    Task<bool> SendRemindersAsync(IEnumerable<ExternalParticipant> participants, InvitationDetails details, string reminderLabel);
}

public class ExternalNotificationService(
    IEmailService emailService,
    IConfiguration configuration,
    ILogger<ExternalNotificationService> logger) : IExternalNotificationService
{
    private const string InvitationSubject = "Meeting Invitation - Aerotech Bhutan";
    private const string ReminderSubject = "Meeting Reminder - Aerotech Bhutan";

    public async Task<bool> SendInvitationsAsync(IEnumerable<ExternalParticipant> participants, InvitationDetails details)
    {
        var list = participants.ToList();
        if (list.Count == 0) return true;

        logger.LogInformation(
            "Sending {Count} invitation email(s) for \"{Title}\"",
            list.Count, details.Title);

        var results = new List<bool>();
        foreach (var participant in list)
        {
            logger.LogInformation(
                "Before EmailService.SendEmailAsync for invitation to {RecipientEmail} ({RecipientName})",
                participant.Email, participant.Name);

            var sent = await emailService.SendEmailAsync(
                participant.Email,
                participant.Name,
                InvitationSubject,
                BuildInvitationHtml(participant, details),
                BuildIcs(participant, details),
                fromEmail: details.OrganizerEmail,
                fromName: details.Organizer,
                replyToEmail: details.OrganizerEmail);

            logger.LogInformation(
                "After EmailService.SendEmailAsync for invitation to {RecipientEmail}. Success={Success}",
                participant.Email, sent);

            results.Add(sent);
        }

        var allSent = results.All(r => r);
        if (allSent)
            logger.LogInformation("All invitation emails sent successfully for \"{Title}\"", details.Title);
        else
            logger.LogWarning(
                "One or more invitation emails failed for \"{Title}\" ({SuccessCount}/{TotalCount} sent)",
                details.Title, results.Count(r => r), list.Count);

        return allSent;
    }

    public async Task<bool> SendRemindersAsync(
        IEnumerable<ExternalParticipant> participants,
        InvitationDetails details,
        string reminderLabel)
    {
        var list = participants.ToList();
        if (list.Count == 0) return true;

        logger.LogInformation(
            "Sending {Count} reminder email(s) for \"{Title}\" ({ReminderLabel} before)",
            list.Count, details.Title, reminderLabel);

        var results = new List<bool>();
        foreach (var participant in list)
        {
            logger.LogInformation(
                "Before EmailService.SendEmailAsync for reminder to {RecipientEmail} ({RecipientName})",
                participant.Email, participant.Name);

            var sent = await emailService.SendEmailAsync(
                participant.Email,
                participant.Name,
                ReminderSubject,
                BuildReminderHtml(participant, details, reminderLabel),
                BuildIcs(participant, details),
                fromEmail: details.OrganizerEmail,
                fromName: details.Organizer,
                replyToEmail: details.OrganizerEmail);

            logger.LogInformation(
                "After EmailService.SendEmailAsync for reminder to {RecipientEmail}. Success={Success}",
                participant.Email, sent);

            results.Add(sent);
        }

        var allSent = results.All(r => r);
        if (allSent)
            logger.LogInformation("All reminder emails sent successfully for \"{Title}\"", details.Title);
        else
            logger.LogWarning(
                "One or more reminder emails failed for \"{Title}\" ({SuccessCount}/{TotalCount} sent)",
                details.Title, results.Count(r => r), list.Count);

        return allSent;
    }

    private string? BuildIcs(ExternalParticipant participant, InvitationDetails details) =>
        CalendarInviteHelper.BuildIcs(
            details,
            details.OrganizerEmail
                ?? configuration["Smtp:FromEmail"]
                ?? configuration["Smtp:Username"]
                ?? "calendar@aerotech.bt",
            participant.Name,
            participant.Email);

    private static string BuildInvitationHtml(ExternalParticipant participant, InvitationDetails d) =>
        WrapHtml($"""
            <h2 style="color:#1e40af;margin:0 0 16px;">Meeting Invitation</h2>
            <p>Dear {Escape(participant.Name)},</p>
            <p>You are invited to the following meeting hosted by <strong>{Escape(d.CompanyName)}</strong>.</p>
            {BuildActionButtons(d)}
            {BuildDetailsTable(d, participant.Organization)}
            <p style="margin-top:24px;color:#64748b;font-size:13px;">
              You do not need a portal account. Open the calendar attachment or use the button above to save this meeting.
              If you have questions, please contact {Escape(d.ContactPerson)}.
            </p>
            """);

    private static string BuildReminderHtml(ExternalParticipant participant, InvitationDetails d, string reminderLabel) =>
        WrapHtml($"""
            <h2 style="color:#b45309;margin:0 0 16px;">Meeting Reminder</h2>
            <p>Dear {Escape(participant.Name)},</p>
            <p>This is a friendly reminder that your meeting with <strong>{Escape(d.CompanyName)}</strong> is scheduled in <strong>{Escape(reminderLabel)}</strong>.</p>
            {BuildActionButtons(d)}
            {BuildDetailsTable(d, participant.Organization)}
            <p style="margin-top:24px;color:#64748b;font-size:13px;">
              Contact: {Escape(d.ContactPerson)}
            </p>
            """);

    private static string BuildActionButtons(InvitationDetails d)
    {
        var parts = new List<string>();
        if (CalendarInviteHelper.IsHttpUrl(d.Location))
        {
            parts.Add($"""
                <a href="{Escape(d.Location)}" style="display:inline-block;background:#1e40af;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:6px;font-size:14px;">
                  Join meeting
                </a>
                """);
        }

        var calendarUrl = CalendarInviteHelper.BuildGoogleCalendarUrl(d);
        if (!string.IsNullOrWhiteSpace(calendarUrl))
        {
            parts.Add($"""
                <a href="{Escape(calendarUrl)}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:6px;font-size:14px;">
                  Add to Google Calendar
                </a>
                """);
        }

        if (parts.Count == 0) return string.Empty;
        return $"""<p style="margin:20px 0;">{string.Join("&nbsp;", parts)}</p>""";
    }

    private static string BuildDetailsTable(InvitationDetails d, string organization)
    {
        var locationCell = CalendarInviteHelper.IsHttpUrl(d.Location)
            ? $"""<a href="{Escape(d.Location)}">{Escape(d.Location)}</a>"""
            : Escape(d.Location ?? "TBD");

        return $"""
        <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
          <tr><td style="padding:8px 0;color:#64748b;width:140px;">Title</td><td style="padding:8px 0;"><strong>{Escape(d.Title)}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Date</td><td style="padding:8px 0;">{Escape(d.Date)}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Time</td><td style="padding:8px 0;">{Escape(d.Time)}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Location / Link</td><td style="padding:8px 0;">{locationCell}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Organizer</td><td style="padding:8px 0;">{Escape(d.Organizer)}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Organizer email</td><td style="padding:8px 0;">{Escape(d.OrganizerEmail ?? "—")}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Organization</td><td style="padding:8px 0;">{Escape(organization)}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;vertical-align:top;">Description</td><td style="padding:8px 0;">{Escape(d.Description ?? "—")}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Contact Person</td><td style="padding:8px 0;">{Escape(d.ContactPerson)}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Company</td><td style="padding:8px 0;">{Escape(d.CompanyName)}</td></tr>
        </table>
        """;
    }

    private static string WrapHtml(string body) => $"""
        <!DOCTYPE html>
        <html>
        <body style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#1e293b;max-width:600px;margin:0 auto;padding:24px;">
          <div style="border-bottom:3px solid #1e40af;padding-bottom:12px;margin-bottom:24px;">
            <strong style="font-size:18px;color:#1e40af;">Aerotech Bhutan</strong>
            <span style="color:#64748b;font-size:13px;display:block;">Company Calendar & Staff Coordination Portal</span>
          </div>
          {body}
          <p style="margin-top:32px;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0;padding-top:16px;">
            This is an automated invitation from Aerotech Bhutan. Replies go to the organizer.
          </p>
        </body>
        </html>
        """;

    private static string Escape(string? value) =>
        System.Net.WebUtility.HtmlEncode(value ?? string.Empty);
}
