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
[Route("api/events")]
[Authorize]
public class EventsController(
    ApplicationDbContext db,
    IExternalNotificationService notificationService,
    ILogger<EventsController> logger) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var events = await db.Events
            .Include(e => e.ExternalParticipants)
            .OrderByDescending(e => e.StartDate)
            .ToListAsync();
        return Ok(events.Select(e => e.ToDto()));
    }

    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Create([FromBody] CreateCompanyEventRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var organizer = await db.Users.FindAsync(userId);

        var companyEvent = new CompanyEvent
        {
            Title = request.Title,
            Description = request.Description,
            StartDate = DateParsing.ParseDate(request.StartDate),
            EndDate = DateParsing.ParseDate(request.EndDate),
            StartTime = DateParsing.ParseOptionalTime(request.StartTime),
            EndTime = DateParsing.ParseOptionalTime(request.EndTime),
            Location = request.Location,
            Category = MappingExtensions.ParseEnum<EventCategory>(request.Category),
            IsAllDay = request.IsAllDay,
            ReminderTiming = request.ReminderTiming != null
                ? MappingExtensions.ParseEnum<ReminderTiming>(request.ReminderTiming) : null,
            SendEmailNotification = request.SendEmailNotification,
            CreatedById = userId,
        };

        db.Events.Add(companyEvent);
        await db.SaveChangesAsync();

        foreach (var participant in ExternalParticipantHelper.MapParticipants(
            request.ExternalParticipants, companyEventId: companyEvent.Id))
            companyEvent.ExternalParticipants.Add(participant);

        await db.SaveChangesAsync();

        var organizerName = organizer != null
            ? $"{organizer.FirstName} {organizer.LastName}"
            : "Aerotech Bhutan";

        var timeStr = companyEvent.IsAllDay
            ? "All Day"
            : $"{companyEvent.StartTime:HH:mm} – {companyEvent.EndTime:HH:mm}";

        var emailResult = await ExternalParticipantHelper.SendEventInvitationEmailsAsync(
            db,
            notificationService,
            logger,
            companyEvent,
            new InvitationDetails(
                companyEvent.Title,
                companyEvent.StartDate.ToString("dddd, MMMM d, yyyy"),
                timeStr,
                companyEvent.Location,
                organizerName,
                companyEvent.Description,
                organizerName,
                EventDate: companyEvent.StartDate,
                StartTime: companyEvent.StartTime,
                EndTime: companyEvent.EndTime,
                IsAllDay: companyEvent.IsAllDay,
                OrganizerEmail: organizer?.Email));

        await db.Entry(companyEvent).Collection(e => e.ExternalParticipants).LoadAsync();
        return Ok(companyEvent.ToDto() with
        {
            InvitationEmailsSent = emailResult == InvitationEmailResult.Sent,
            InvitationEmailMessage = CalendarInviteHelper.InvitationResultMessage(emailResult),
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(int id)
    {
        var companyEvent = await db.Events.FindAsync(id);
        if (companyEvent == null) return NotFound();
        db.Events.Remove(companyEvent);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
