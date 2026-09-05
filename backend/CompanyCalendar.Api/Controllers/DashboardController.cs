using System.Security.Claims;
using CompanyCalendar.Api.Data;
using CompanyCalendar.Api.DTOs;
using CompanyCalendar.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CompanyCalendar.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController(CalendarService calendarService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isAdmin = User.IsInRole("Administrator");
        return Ok(await calendarService.GetDashboardAsync(userId, isAdmin));
    }
}

[ApiController]
[Route("api/calendar")]
[Authorize]
public class CalendarController(CalendarService calendarService) : ControllerBase
{
    [HttpGet("events")]
    public async Task<IActionResult> GetEvents([FromQuery] string start, [FromQuery] string end, [FromQuery] string? categories)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isAdmin = User.IsInRole("Administrator");
        var startDate = DateParsing.ParseDate(start);
        var endDate = DateParsing.ParseDate(end);
        return Ok(await calendarService.GetEventsAsync(startDate, endDate, categories, userId, isAdmin));
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q)) return Ok(Array.Empty<CalendarEventDto>());
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isAdmin = User.IsInRole("Administrator");
        return Ok(await calendarService.SearchEventsAsync(q, userId, isAdmin));
    }
}

[ApiController]
[Route("api/departments")]
[Authorize]
public class DepartmentsController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok((await db.Departments.ToListAsync()).Select(d => d.ToDto()));
}
