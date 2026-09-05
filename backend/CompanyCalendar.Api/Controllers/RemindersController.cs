using System.Security.Claims;
using CompanyCalendar.Api.Data;
using CompanyCalendar.Api.DTOs;
using CompanyCalendar.Api.Models;
using CompanyCalendar.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CompanyCalendar.Api.Controllers;

[ApiController]
[Route("api/reminders")]
[Authorize]
public class RemindersController(
    ApplicationDbContext db,
    IExternalNotificationService notificationService,
    ILogger<RemindersController> logger) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isAdmin = User.IsInRole("Administrator");

        var reminders = await db.Reminders
            .Include(r => r.ExternalParticipants)
            .Where(r => r.IsCompanyWide || r.UserId == userId || r.CreatedById == userId || isAdmin)
            .OrderByDescending(r => r.ReminderDate)
            .ToListAsync();

        return Ok(reminders.Select(r => r.ToDto()));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateReminderRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isAdmin = User.IsInRole("Administrator");

        if (request.IsCompanyWide && !isAdmin)
            return Forbid();

        var organizer = await db.Users.FindAsync(userId);

        var reminder = new Reminder
        {
            Title = request.Title,
            Description = request.Description,
            ReminderDate = DateParsing.ParseDate(request.ReminderDate),
            ReminderTime = DateParsing.ParseOptionalTime(request.ReminderTime),
            Timing = MappingExtensions.ParseEnum<ReminderTiming>(request.Timing),
            IsCompanyWide = request.IsCompanyWide,
            SendEmailNotification = request.SendEmailNotification,
            UserId = request.IsCompanyWide ? null : (request.UserId ?? userId),
            CreatedById = userId,
        };

        db.Reminders.Add(reminder);
        await db.SaveChangesAsync();

        foreach (var participant in ExternalParticipantHelper.MapParticipants(
            request.ExternalParticipants, reminderId: reminder.Id))
            reminder.ExternalParticipants.Add(participant);

        await db.SaveChangesAsync();

        var organizerName = organizer != null
            ? $"{organizer.FirstName} {organizer.LastName}"
            : "Aerotech Bhutan";

        var emailResult = await ExternalParticipantHelper.SendReminderInvitationEmailsAsync(
            db,
            notificationService,
            logger,
            reminder,
            new InvitationDetails(
                reminder.Title,
                reminder.ReminderDate.ToString("dddd, MMMM d, yyyy"),
                reminder.ReminderTime?.ToString("HH:mm") ?? "All Day",
                null,
                organizerName,
                reminder.Description,
                organizerName,
                EventDate: reminder.ReminderDate,
                StartTime: reminder.ReminderTime,
                IsAllDay: reminder.ReminderTime is null,
                OrganizerEmail: organizer?.Email));

        await db.Entry(reminder).Collection(r => r.ExternalParticipants).LoadAsync();
        return Ok(reminder.ToDto() with
        {
            InvitationEmailsSent = emailResult == InvitationEmailResult.Sent,
            InvitationEmailMessage = CalendarInviteHelper.InvitationResultMessage(emailResult),
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var reminder = await db.Reminders.FindAsync(id);
        if (reminder == null) return NotFound();

        var isAdmin = User.IsInRole("Administrator");
        if (reminder.CreatedById != userId && !isAdmin) return Forbid();

        db.Reminders.Remove(reminder);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
