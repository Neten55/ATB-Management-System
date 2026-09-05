using CompanyCalendar.Api.Data;
using CompanyCalendar.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CompanyCalendar.Api.Services;

public class ExternalReminderBackgroundService(
    IServiceProvider serviceProvider,
    ILogger<ExternalReminderBackgroundService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        SafeLogInformation("External reminder email worker started");

        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await RunReminderCycleAsync(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    SafeLogError(ex, "Unhandled error during external reminder cycle");
                }

                try
                {
                    await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
            }
        }
        catch (Exception ex)
        {
            SafeLogError(ex, "Fatal error in external reminder email worker");
        }

        SafeLogInformation("External reminder email worker stopped");
    }

    private async Task RunReminderCycleAsync(CancellationToken stoppingToken)
    {
        if (stoppingToken.IsCancellationRequested)
            return;

        await RunInIsolatedScopeAsync(
            "meeting",
            (db, notificationService) => ProcessMeetingRemindersAsync(db, notificationService));

        if (stoppingToken.IsCancellationRequested)
            return;

        await RunInIsolatedScopeAsync(
            "company event",
            (db, notificationService) => ProcessEventRemindersAsync(db, notificationService));

        if (stoppingToken.IsCancellationRequested)
            return;

        await RunInIsolatedScopeAsync(
            "reminder",
            (db, notificationService) => ProcessReminderRemindersAsync(db, notificationService));
    }

    private async Task RunInIsolatedScopeAsync(
        string entityLabel,
        Func<ApplicationDbContext, IExternalNotificationService, Task> work)
    {
        AsyncServiceScope? scope = null;
        try
        {
            scope = serviceProvider.CreateAsyncScope();
            var db = scope.Value.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var notificationService = scope.Value.ServiceProvider
                .GetRequiredService<IExternalNotificationService>();

            await work(db, notificationService);
        }
        catch (Exception ex)
        {
            SafeLogError(ex, $"Error processing {entityLabel} reminder emails ({ex.GetType().Name}: {ex.Message})");
        }
        finally
        {
            if (scope.HasValue)
                await scope.Value.DisposeAsync();
        }
    }

    private async Task ProcessMeetingRemindersAsync(
        ApplicationDbContext db,
        IExternalNotificationService notificationService)
    {
        List<Meeting> meetings;
        try
        {
            meetings = await db.Meetings
                .AsNoTracking()
                .Include(m => m.CreatedBy)
                .Include(m => m.ExternalParticipants)
                .Where(m => !m.ExternalReminderSent
                    && m.SendEmailNotification
                    && m.ReminderTiming != null
                    && m.ExternalParticipants.Any())
                .ToListAsync(CancellationToken.None);
        }
        catch (Exception ex)
        {
            SafeLogError(ex, $"Failed to query meetings pending external reminders ({ex.GetType().Name}: {ex.Message})");
            return;
        }

        var now = DateTime.UtcNow;
        var changed = false;

        foreach (var meeting in meetings)
        {
            try
            {
                var eventTime = ReminderTimingHelper.GetEventDateTime(meeting.MeetingDate, meeting.StartTime);
                if (!ReminderTimingHelper.ShouldSendReminder(eventTime, meeting.ReminderTiming!.Value, now))
                    continue;

                SafeLogInformation(
                    $"Sending scheduled reminder emails for Meeting Id={meeting.Id} \"{meeting.Title}\"");

                var organizer = meeting.CreatedBy != null
                    ? $"{meeting.CreatedBy.FirstName} {meeting.CreatedBy.LastName}"
                    : "Aerotech Bhutan";

                var details = new InvitationDetails(
                    meeting.Title,
                    meeting.MeetingDate.ToString("dddd, MMMM d, yyyy"),
                    $"{meeting.StartTime:hh\\:mm} – {meeting.EndTime:hh\\:mm}",
                    meeting.Location,
                    organizer,
                    meeting.Description,
                    organizer,
                    EventDate: meeting.MeetingDate,
                    StartTime: meeting.StartTime,
                    EndTime: meeting.EndTime,
                    OrganizerEmail: meeting.CreatedBy?.Email);

                var sent = await notificationService.SendRemindersAsync(
                    meeting.ExternalParticipants,
                    details,
                    ReminderTimingHelper.ToLabel(meeting.ReminderTiming.Value));

                if (!sent)
                {
                    SafeLogWarning(
                        $"ExternalReminderSent not updated for Meeting Id={meeting.Id}; reminder email send failed");
                    continue;
                }

                var tracked = await db.Meetings.FindAsync([meeting.Id], CancellationToken.None);
                if (tracked == null)
                {
                    SafeLogWarning($"Meeting Id={meeting.Id} not found when marking ExternalReminderSent");
                    continue;
                }

                tracked.ExternalReminderSent = true;
                changed = true;
                SafeLogInformation(
                    $"Marked ExternalReminderSent=true for Meeting Id={meeting.Id} after successful send");
            }
            catch (Exception ex)
            {
                SafeLogError(ex,
                    $"Failed processing reminder for Meeting Id={meeting.Id} ({ex.GetType().Name}: {ex.Message})");
            }
        }

        if (changed)
            await SaveChangesSafelyAsync(db, "meeting reminders");
    }

    private async Task ProcessEventRemindersAsync(
        ApplicationDbContext db,
        IExternalNotificationService notificationService)
    {
        List<CompanyEvent> events;
        try
        {
            events = await db.Events
                .AsNoTracking()
                .Include(e => e.CreatedBy)
                .Include(e => e.ExternalParticipants)
                .Where(e => !e.ExternalReminderSent
                    && e.SendEmailNotification
                    && e.ReminderTiming != null
                    && e.ExternalParticipants.Any())
                .ToListAsync(CancellationToken.None);
        }
        catch (Exception ex)
        {
            SafeLogError(ex, $"Failed to query company events pending external reminders ({ex.GetType().Name}: {ex.Message})");
            return;
        }

        var now = DateTime.UtcNow;
        var changed = false;

        foreach (var companyEvent in events)
        {
            try
            {
                var eventTime = ReminderTimingHelper.GetEventDateTime(
                    companyEvent.StartDate,
                    companyEvent.IsAllDay ? null : companyEvent.StartTime);

                if (!ReminderTimingHelper.ShouldSendReminder(eventTime, companyEvent.ReminderTiming!.Value, now))
                    continue;

                SafeLogInformation(
                    $"Sending scheduled reminder emails for CompanyEvent Id={companyEvent.Id} \"{companyEvent.Title}\"");

                var organizer = companyEvent.CreatedBy != null
                    ? $"{companyEvent.CreatedBy.FirstName} {companyEvent.CreatedBy.LastName}"
                    : "Aerotech Bhutan";

                var timeStr = companyEvent.IsAllDay
                    ? "All Day"
                    : $"{companyEvent.StartTime:hh\\:mm} – {companyEvent.EndTime:hh\\:mm}";

                var details = new InvitationDetails(
                    companyEvent.Title,
                    companyEvent.StartDate.ToString("dddd, MMMM d, yyyy"),
                    timeStr,
                    companyEvent.Location,
                    organizer,
                    companyEvent.Description,
                    organizer,
                    EventDate: companyEvent.StartDate,
                    StartTime: companyEvent.StartTime,
                    EndTime: companyEvent.EndTime,
                    IsAllDay: companyEvent.IsAllDay,
                    OrganizerEmail: companyEvent.CreatedBy?.Email);

                var sent = await notificationService.SendRemindersAsync(
                    companyEvent.ExternalParticipants,
                    details,
                    ReminderTimingHelper.ToLabel(companyEvent.ReminderTiming.Value));

                if (!sent)
                {
                    SafeLogWarning(
                        $"ExternalReminderSent not updated for CompanyEvent Id={companyEvent.Id}; reminder email send failed");
                    continue;
                }

                var tracked = await db.Events.FindAsync([companyEvent.Id], CancellationToken.None);
                if (tracked == null)
                {
                    SafeLogWarning($"CompanyEvent Id={companyEvent.Id} not found when marking ExternalReminderSent");
                    continue;
                }

                tracked.ExternalReminderSent = true;
                changed = true;
                SafeLogInformation(
                    $"Marked ExternalReminderSent=true for CompanyEvent Id={companyEvent.Id} after successful send");
            }
            catch (Exception ex)
            {
                SafeLogError(ex,
                    $"Failed processing reminder for CompanyEvent Id={companyEvent.Id} ({ex.GetType().Name}: {ex.Message})");
            }
        }

        if (changed)
            await SaveChangesSafelyAsync(db, "company event reminders");
    }

    private async Task ProcessReminderRemindersAsync(
        ApplicationDbContext db,
        IExternalNotificationService notificationService)
    {
        List<Reminder> reminders;
        try
        {
            reminders = await db.Reminders
                .AsNoTracking()
                .Include(r => r.CreatedBy)
                .Include(r => r.ExternalParticipants)
                .Where(r => !r.ExternalReminderSent
                    && r.SendEmailNotification
                    && r.ExternalParticipants.Any())
                .ToListAsync(CancellationToken.None);
        }
        catch (Exception ex)
        {
            SafeLogError(ex, $"Failed to query reminders pending external emails ({ex.GetType().Name}: {ex.Message})");
            return;
        }

        var now = DateTime.UtcNow;
        var changed = false;

        foreach (var reminder in reminders)
        {
            try
            {
                var eventTime = ReminderTimingHelper.GetEventDateTime(reminder.ReminderDate, reminder.ReminderTime);
                if (!ReminderTimingHelper.ShouldSendReminder(eventTime, reminder.Timing, now))
                    continue;

                SafeLogInformation(
                    $"Sending scheduled reminder emails for Reminder Id={reminder.Id} \"{reminder.Title}\"");

                var organizer = reminder.CreatedBy != null
                    ? $"{reminder.CreatedBy.FirstName} {reminder.CreatedBy.LastName}"
                    : "Aerotech Bhutan";

                var timeStr = reminder.ReminderTime?.ToString("hh\\:mm") ?? "All Day";

                var details = new InvitationDetails(
                    reminder.Title,
                    reminder.ReminderDate.ToString("dddd, MMMM d, yyyy"),
                    timeStr,
                    null,
                    organizer,
                    reminder.Description,
                    organizer,
                    EventDate: reminder.ReminderDate,
                    StartTime: reminder.ReminderTime,
                    IsAllDay: reminder.ReminderTime is null,
                    OrganizerEmail: reminder.CreatedBy?.Email);

                var sent = await notificationService.SendRemindersAsync(
                    reminder.ExternalParticipants,
                    details,
                    ReminderTimingHelper.ToLabel(reminder.Timing));

                if (!sent)
                {
                    SafeLogWarning(
                        $"ExternalReminderSent not updated for Reminder Id={reminder.Id}; reminder email send failed");
                    continue;
                }

                var tracked = await db.Reminders.FindAsync([reminder.Id], CancellationToken.None);
                if (tracked == null)
                {
                    SafeLogWarning($"Reminder Id={reminder.Id} not found when marking ExternalReminderSent");
                    continue;
                }

                tracked.ExternalReminderSent = true;
                changed = true;
                SafeLogInformation(
                    $"Marked ExternalReminderSent=true for Reminder Id={reminder.Id} after successful send");
            }
            catch (Exception ex)
            {
                SafeLogError(ex,
                    $"Failed processing reminder for Reminder Id={reminder.Id} ({ex.GetType().Name}: {ex.Message})");
            }
        }

        if (changed)
            await SaveChangesSafelyAsync(db, "reminder entity emails");
    }

    private async Task SaveChangesSafelyAsync(ApplicationDbContext db, string contextLabel)
    {
        try
        {
            await db.SaveChangesAsync(CancellationToken.None);
        }
        catch (Exception ex)
        {
            SafeLogError(ex, $"Failed to save {contextLabel} ({ex.GetType().Name}: {ex.Message})");
        }
    }

    private void SafeLogInformation(string message)
    {
        try
        {
            logger.LogInformation("{Message}", message);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ExternalReminderBackgroundService] INFO: {message} (logging unavailable: {ex.Message})");
        }
    }

    private void SafeLogWarning(string message)
    {
        try
        {
            logger.LogWarning("{Message}", message);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ExternalReminderBackgroundService] WARN: {message} (logging unavailable: {ex.Message})");
        }
    }

    private void SafeLogError(Exception exception, string message)
    {
        try
        {
            logger.LogError(exception, "{Message}", message);
        }
        catch (Exception logEx)
        {
            Console.WriteLine(
                $"[ExternalReminderBackgroundService] ERROR: {message} | {exception.GetType().Name}: {exception.Message} (logging unavailable: {logEx.Message})");
            Console.WriteLine(exception.StackTrace);
        }
    }
}
