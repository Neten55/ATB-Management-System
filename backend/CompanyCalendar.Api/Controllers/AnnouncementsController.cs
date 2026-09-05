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
[Route("api/announcements")]
[Authorize]
public class AnnouncementsController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var announcements = await db.Announcements
            .Include(a => a.CreatedBy)
            .OrderByDescending(a => a.IsPinned)
            .ThenByDescending(a => a.CreatedAt)
            .ToListAsync();
        return Ok(announcements.Select(a => a.ToDto()));
    }

    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Create([FromBody] CreateAnnouncementRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var announcement = new Announcement
        {
            Title = request.Title,
            Content = request.Content,
            IsPinned = request.IsPinned,
            IsUrgent = request.IsUrgent,
            CreatedById = userId,
            ExpiresAt = request.ExpiresAt != null ? DateTime.Parse(request.ExpiresAt) : null,
        };

        db.Announcements.Add(announcement);
        await db.SaveChangesAsync();
        await db.Entry(announcement).Reference(a => a.CreatedBy).LoadAsync();
        return Ok(announcement.ToDto());
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(int id)
    {
        var announcement = await db.Announcements.FindAsync(id);
        if (announcement == null) return NotFound();
        db.Announcements.Remove(announcement);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
