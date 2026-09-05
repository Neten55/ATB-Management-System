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
[Route("api/meetings")]
[Authorize]
public class MeetingsController(
    ApplicationDbContext db,
    IExternalNotificationService notificationService,
    IEmailService emailService,
    ILogger<MeetingsController> logger) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isAdmin = User.IsInRole("Administrator");

        IQueryable<Meeting> query = db.Meetings
            .Include(m => m.CreatedBy)
            .Include(m => m.Participants).ThenInclude(p => p.User)
            .Include(m => m.ExternalParticipants)
            .AsQueryable();

        if (!isAdmin)
            query = query.Where(m => m.CreatedById == userId || m.Participants.Any(p => p.UserId == userId));

        var meetings = await query
            .OrderByDescending(m => m.MeetingDate)
            .ToListAsync();
        return Ok(meetings.Select(m => m.ToDto()));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMeetingRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var organizer = await db.Users.FindAsync(userId);

        logger.LogInformation(
            "Creating meeting \"{Title}\". SendEmailNotification={SendEmail}, ExternalParticipantRequests={Count}",
            request.Title, request.SendEmailNotification, request.ExternalParticipants?.Count ?? 0);

        DateOnly meetingDate;
        TimeOnly startTime;
        TimeOnly endTime;
        try
        {
            meetingDate = DateParsing.ParseDate(request.MeetingDate);
            startTime = DateParsing.ParseTime(request.StartTime);
            endTime = DateParsing.ParseTime(request.EndTime);
        }
        catch (FormatException ex)
        {
            return BadRequest(new { message = ex.Message });
        }

        var requestedIds = (request.ParticipantIds ?? []).Append(userId).Distinct().ToList();
        var existingIds = await db.Users
            .Where(u => requestedIds.Contains(u.Id))
            .Select(u => u.Id)
            .ToListAsync();
        if (existingIds.Count != requestedIds.Count)
            return BadRequest(new { message = "One or more invited employees could not be found. Refresh the page and try again." });

        var meeting = new Meeting
        {
            Title = request.Title,
            Description = request.Description,
            MeetingDate = meetingDate,
            StartTime = startTime,
            EndTime = endTime,
            Location = request.Location,
            ReminderTiming = request.ReminderTiming != null
                ? MappingExtensions.ParseEnum<ReminderTiming>(request.ReminderTiming) : null,
            SendEmailNotification = request.SendEmailNotification,
            CreatedById = userId,
        };

        foreach (var pid in existingIds)
            meeting.Participants.Add(new MeetingParticipant { UserId = pid });

        db.Meetings.Add(meeting);
        await db.SaveChangesAsync();

        foreach (var participant in ExternalParticipantHelper.MapParticipants(
            request.ExternalParticipants, meetingId: meeting.Id))
            meeting.ExternalParticipants.Add(participant);

        await db.SaveChangesAsync();

        var organizerName = organizer != null
            ? $"{organizer.FirstName} {organizer.LastName}"
            : "Aerotech Bhutan";

        InvitationEmailResult emailResult;
        try
        {
            emailResult = await ExternalParticipantHelper.SendMeetingInvitationEmailsAsync(
                db,
                notificationService,
                emailService,
                logger,
                meeting,
                new InvitationDetails(
                    meeting.Title,
                    meeting.MeetingDate.ToString("dddd, MMMM d, yyyy"),
                    $"{meeting.StartTime:HH:mm} – {meeting.EndTime:HH:mm}",
                    meeting.Location,
                    organizerName,
                    meeting.Description,
                    organizerName,
                    EventDate: meeting.MeetingDate,
                    StartTime: meeting.StartTime,
                    EndTime: meeting.EndTime,
                    OrganizerEmail: organizer?.Email));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Meeting {MeetingId} was saved but invitation emails failed", meeting.Id);
            emailResult = InvitationEmailResult.Failed;
        }

        await db.Entry(meeting).Reference(m => m.CreatedBy).LoadAsync();
        await db.Entry(meeting).Collection(m => m.Participants).Query().Include(p => p.User).LoadAsync();
        await db.Entry(meeting).Collection(m => m.ExternalParticipants).LoadAsync();

        return Ok(meeting.ToDto() with
        {
            InvitationEmailsSent = emailResult == InvitationEmailResult.Sent,
            InvitationEmailMessage = CalendarInviteHelper.InvitationResultMessage(emailResult),
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateMeetingRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isAdmin = User.IsInRole("Administrator");
        var meeting = await db.Meetings
            .Include(m => m.Participants)
            .Include(m => m.ExternalParticipants)
            .FirstOrDefaultAsync(m => m.Id == id);
        if (meeting == null) return NotFound();
        if (!isAdmin && meeting.CreatedById != userId) return Forbid();

        meeting.Title = request.Title;
        meeting.Description = request.Description;
        meeting.MeetingDate = DateParsing.ParseDate(request.MeetingDate);
        meeting.StartTime = DateParsing.ParseTime(request.StartTime);
        meeting.EndTime = DateParsing.ParseTime(request.EndTime);
        meeting.Location = request.Location;
        meeting.ReminderTiming = request.ReminderTiming != null
            ? MappingExtensions.ParseEnum<ReminderTiming>(request.ReminderTiming) : null;
        meeting.SendEmailNotification = request.SendEmailNotification;

        db.MeetingParticipants.RemoveRange(meeting.Participants);
        meeting.Participants.Clear();
        if (request.ParticipantIds != null)
        {
            foreach (var pid in request.ParticipantIds.Distinct())
                meeting.Participants.Add(new MeetingParticipant { MeetingId = id, UserId = pid });
        }
        if (meeting.Participants.All(p => p.UserId != meeting.CreatedById))
            meeting.Participants.Add(new MeetingParticipant { MeetingId = id, UserId = meeting.CreatedById });

        db.ExternalParticipants.RemoveRange(meeting.ExternalParticipants);
        meeting.ExternalParticipants.Clear();
        await db.SaveChangesAsync();

        foreach (var participant in ExternalParticipantHelper.MapParticipants(
            request.ExternalParticipants, meetingId: meeting.Id))
            meeting.ExternalParticipants.Add(participant);

        await db.SaveChangesAsync();
        await db.Entry(meeting).Reference(m => m.CreatedBy).LoadAsync();
        await db.Entry(meeting).Collection(m => m.Participants).Query().Include(p => p.User).LoadAsync();
        await db.Entry(meeting).Collection(m => m.ExternalParticipants).LoadAsync();
        return Ok(meeting.ToDto());
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isAdmin = User.IsInRole("Administrator");
        var meeting = await db.Meetings.FindAsync(id);
        if (meeting == null) return NotFound();
        if (!isAdmin && meeting.CreatedById != userId) return Forbid();
        db.Meetings.Remove(meeting);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
