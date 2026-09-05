using CompanyCalendar.Api.Data;
using CompanyCalendar.Api.DTOs;
using CompanyCalendar.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CompanyCalendar.Api.Services;

public static class ExternalParticipantHelper
{
    public static List<ExternalParticipant> MapParticipants(
        IEnumerable<ExternalParticipantRequest>? requests,
        int? meetingId = null,
        int? companyEventId = null,
        int? reminderId = null)
    {
        if (requests == null) return [];

        return requests
            .Where(r => !string.IsNullOrWhiteSpace(r.Email) && !string.IsNullOrWhiteSpace(r.Name))
            .Select(r => new ExternalParticipant
            {
                Name = r.Name.Trim(),
                Organization = r.Organization?.Trim() ?? string.Empty,
                Email = r.Email.Trim(),
                Phone = string.IsNullOrWhiteSpace(r.Phone) ? null : r.Phone.Trim(),
                MeetingId = meetingId,
                CompanyEventId = companyEventId,
                ReminderId = reminderId,
            })
            .ToList();
    }

    public static async Task<InvitationEmailResult> SendMeetingInvitationEmailsAsync(
        ApplicationDbContext db,
        IExternalNotificationService notificationService,
        IEmailService emailService,
        ILogger logger,
        Meeting meeting,
        InvitationDetails details)
    {
        var externalParticipants = await db.ExternalParticipants
            .Where(p => p.MeetingId == meeting.Id)
            .ToListAsync();

        var externalResult = await SendAsync(
            logger,
            meeting.SendEmailNotification,
            externalParticipants.Count,
            "Meeting",
            meeting.Id,
            () => notificationService.SendInvitationsAsync(externalParticipants, details));

        // Send invitations to internal participants
        await SendInternalMeetingInvitationsAsync(
            db,
            emailService,
            logger,
            meeting,
            details);

        return externalResult;
    }

    public static async Task<InvitationEmailResult> SendReminderInvitationEmailsAsync(
        ApplicationDbContext db,
        IExternalNotificationService notificationService,
        ILogger logger,
        Reminder reminder,
        InvitationDetails details)
    {
        var participants = await db.ExternalParticipants
            .Where(p => p.ReminderId == reminder.Id)
            .ToListAsync();

        return await SendAsync(
            logger,
            reminder.SendEmailNotification,
            participants.Count,
            "Reminder",
            reminder.Id,
            () => notificationService.SendInvitationsAsync(participants, details));
    }

    public static async Task<InvitationEmailResult> SendEventInvitationEmailsAsync(
        ApplicationDbContext db,
        IExternalNotificationService notificationService,
        ILogger logger,
        CompanyEvent companyEvent,
        InvitationDetails details)
    {
        var participants = await db.ExternalParticipants
            .Where(p => p.CompanyEventId == companyEvent.Id)
            .ToListAsync();

        return await SendAsync(
            logger,
            companyEvent.SendEmailNotification,
            participants.Count,
            "CompanyEvent",
            companyEvent.Id,
            () => notificationService.SendInvitationsAsync(participants, details));
    }

    private static async Task SendInternalMeetingInvitationsAsync(
        ApplicationDbContext db,
        IEmailService emailService,
        ILogger logger,
        Meeting meeting,
        InvitationDetails details)
    {
        if (!meeting.SendEmailNotification)
        {
            logger.LogInformation("Skipping internal participant emails: SendEmailNotification is false");
            return;
        }

        var internalParticipants = await db.MeetingParticipants
            .Where(p => p.MeetingId == meeting.Id)
            .Include(p => p.User)
            .Select(p => p.User)
            .Where(u => u != null)
            .ToListAsync();

        if (internalParticipants.Count == 0)
        {
            logger.LogInformation("No internal participants to notify for Meeting {MeetingId}", meeting.Id);
            return;
        }

        logger.LogInformation(
            "Sending meeting invitation emails to {Count} internal participant(s) for Meeting {MeetingId} \"{Title}\"",
            internalParticipants.Count, meeting.Id, meeting.Title);

        foreach (var participant in internalParticipants)
        {
            if (participant == null || string.IsNullOrWhiteSpace(participant.Email))
            {
                logger.LogWarning("Skipping participant: no email address or null participant");
                continue;
            }

            var participantName = $"{participant.FirstName} {participant.LastName}".Trim();
            var ics = CalendarInviteHelper.BuildIcs(
                details,
                details.OrganizerEmail ?? "calendar@aerotech.bt",
                participantName,
                participant.Email);

            var sent = await emailService.SendEmailAsync(
                participant.Email,
                participantName,
                "Meeting Invitation - Aerotech Bhutan",
                BuildInternalInvitationHtml(participant, details),
                ics,
                fromEmail: details.OrganizerEmail,
                fromName: details.Organizer,
                replyToEmail: details.OrganizerEmail);

            logger.LogInformation(
                "Internal participant invitation email for {ParticipantEmail}: Success={Success}",
                participant.Email, sent);
        }
    }

    private static string BuildInternalInvitationHtml(ApplicationUser participant, InvitationDetails details)
    {
        var html = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }}
        .details {{ margin: 20px 0; }}
        .detail-row {{ margin: 10px 0; }}
        .label {{ font-weight: bold; color: #555; }}
        .button {{ display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }}
        .footer {{ color: #777; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h2>Meeting Invitation</h2>
            <p>Dear {participant.FirstName},</p>
            <p>You have been invited to the following meeting:</p>
        </div>
        
        <div class='details'>
            <div class='detail-row'>
                <span class='label'>Title:</span> {details.Title}
            </div>
            <div class='detail-row'>
                <span class='label'>Date:</span> {details.Date}
            </div>
            <div class='detail-row'>
                <span class='label'>Time:</span> {details.Time}
            </div>";
        
        if (!string.IsNullOrWhiteSpace(details.Location))
            html += $@"
            <div class='detail-row'>
                <span class='label'>Location:</span> {details.Location}
            </div>";
        
        html += $@"
            <div class='detail-row'>
                <span class='label'>Organizer:</span> {details.Organizer}
            </div>";
        
        if (!string.IsNullOrWhiteSpace(details.Description))
            html += $@"
            <div class='detail-row'>
                <span class='label'>Description:</span>
                <p>{details.Description}</p>
            </div>";
        
        html += $@"
        </div>
        
        <div class='footer'>
            <p>This is an automated meeting invitation from Aerotech Bhutan Company Calendar.</p>
            <p>The calendar invite has been attached to this email.</p>
        </div>
    </div>
</body>
</html>";
        return html;
    }

    private static async Task<InvitationEmailResult> SendAsync(
        ILogger logger,
        bool sendEmail,
        int participantCount,
        string entityName,
        int entityId,
        Func<Task<bool>> send)
    {
        logger.LogInformation(
            "{Entity} {EntityId} invitation check: SendEmailNotification={SendEmail}, ExternalParticipants={Count}",
            entityName, entityId, sendEmail, participantCount);

        if (!sendEmail)
        {
            logger.LogInformation(
                "Skipping invitation emails for {Entity} {EntityId}: SendEmailNotification is false",
                entityName, entityId);
            return InvitationEmailResult.NotRequested;
        }

        if (participantCount == 0)
        {
            logger.LogInformation(
                "Skipping invitation emails for {Entity} {EntityId}: no external participants in database",
                entityName, entityId);
            return InvitationEmailResult.NoRecipients;
        }

        logger.LogInformation(
            "Calling ExternalNotificationService.SendInvitationsAsync for {Entity} {EntityId} ({Count} recipient(s))",
            entityName, entityId, participantCount);

        var sent = await send();
        logger.LogInformation(
            "{Entity} {EntityId} invitation emails completed. Success={Success}",
            entityName, entityId, sent);

        return sent ? InvitationEmailResult.Sent : InvitationEmailResult.Failed;
    }
}
