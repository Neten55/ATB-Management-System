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
[Route("api/schedules")]
[Authorize]
public class SchedulesController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isAdmin = User.IsInRole("Administrator");
        var departmentId = await db.Users.Where(u => u.Id == userId).Select(u => u.DepartmentId).FirstOrDefaultAsync();

        IQueryable<Schedule> query = db.Schedules
            .Include(s => s.Department)
            .Include(s => s.Assignments).ThenInclude(a => a.User)
            .AsQueryable();

        if (!isAdmin)
            query = query.Where(s =>
                s.Assignments.Any(a => a.UserId == userId)
                || (!s.Assignments.Any() && departmentId != null && s.DepartmentId == departmentId));

        var schedules = await query
            .OrderByDescending(s => s.Date)
            .ToListAsync();
        return Ok(schedules.Select(s => s.ToDto()));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var schedule = await db.Schedules
            .Include(s => s.Department)
            .Include(s => s.Assignments).ThenInclude(a => a.User)
            .FirstOrDefaultAsync(s => s.Id == id);
        return schedule == null ? NotFound() : Ok(schedule.ToDto());
    }

    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Create([FromBody] CreateScheduleRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var schedule = new Schedule
        {
            Title = request.Title,
            Description = request.Description,
            Date = DateParsing.ParseDate(request.Date),
            StartTime = DateParsing.ParseTime(request.StartTime),
            EndTime = DateParsing.ParseTime(request.EndTime),
            DepartmentId = request.DepartmentId,
            Location = request.Location,
            Priority = MappingExtensions.ParseEnum<Priority>(request.Priority),
            ReminderTiming = request.ReminderTiming != null
                ? MappingExtensions.ParseEnum<ReminderTiming>(request.ReminderTiming) : null,
            CreatedById = userId,
        };

        if (request.AssignedEmployeeIds != null)
        {
            foreach (var empId in request.AssignedEmployeeIds)
                schedule.Assignments.Add(new ScheduleAssignment { UserId = empId });
        }

        db.Schedules.Add(schedule);
        await db.SaveChangesAsync();
        await db.Entry(schedule).Reference(s => s.Department).LoadAsync();
        await db.Entry(schedule).Collection(s => s.Assignments).Query().Include(a => a.User).LoadAsync();
        return CreatedAtAction(nameof(GetById), new { id = schedule.Id }, schedule.ToDto());
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateScheduleRequest request)
    {
        var schedule = await db.Schedules.Include(s => s.Assignments).FirstOrDefaultAsync(s => s.Id == id);
        if (schedule == null) return NotFound();

        schedule.Title = request.Title;
        schedule.Description = request.Description;
        schedule.Date = DateParsing.ParseDate(request.Date);
        schedule.StartTime = DateParsing.ParseTime(request.StartTime);
        schedule.EndTime = DateParsing.ParseTime(request.EndTime);
        schedule.DepartmentId = request.DepartmentId;
        schedule.Location = request.Location;
        schedule.Priority = MappingExtensions.ParseEnum<Priority>(request.Priority);

        db.ScheduleAssignments.RemoveRange(schedule.Assignments);
        schedule.Assignments.Clear();
        if (request.AssignedEmployeeIds != null)
        {
            foreach (var empId in request.AssignedEmployeeIds)
                schedule.Assignments.Add(new ScheduleAssignment { UserId = empId });
        }

        await db.SaveChangesAsync();
        return Ok(schedule.ToDto());
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(int id)
    {
        var schedule = await db.Schedules.FindAsync(id);
        if (schedule == null) return NotFound();
        db.Schedules.Remove(schedule);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
