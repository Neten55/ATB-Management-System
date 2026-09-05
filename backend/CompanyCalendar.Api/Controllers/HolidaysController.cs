using CompanyCalendar.Api.Data;
using CompanyCalendar.Api.DTOs;
using CompanyCalendar.Api.Models;
using CompanyCalendar.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CompanyCalendar.Api.Controllers;

[ApiController]
[Route("api/holidays")]
[Authorize]
public class HolidaysController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var holidays = await db.Holidays.OrderBy(h => h.Date).ToListAsync();
        return Ok(holidays.Select(h => h.ToDto()));
    }

    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Create([FromBody] CreateHolidayRequest request)
    {
        var holiday = new Holiday
        {
            Name = request.Name,
            Date = DateParsing.ParseDate(request.Date),
            Description = request.Description,
            IsRecurring = request.IsRecurring,
        };

        db.Holidays.Add(holiday);
        await db.SaveChangesAsync();
        return Ok(holiday.ToDto());
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(int id)
    {
        var holiday = await db.Holidays.FindAsync(id);
        if (holiday == null) return NotFound();
        db.Holidays.Remove(holiday);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
