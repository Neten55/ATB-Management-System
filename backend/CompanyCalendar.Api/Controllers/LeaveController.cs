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
[Route("api/leave")]
[Authorize]
public class LeaveController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> GetAll()
    {
        var requests = await db.LeaveRequests
            .Include(l => l.User)
            .Include(l => l.ReviewedBy)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();
        return Ok(requests.Select(l => l.ToDto()));
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMy()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var requests = await db.LeaveRequests
            .Include(l => l.User)
            .Include(l => l.ReviewedBy)
            .Where(l => l.UserId == userId)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();
        return Ok(requests.Select(l => l.ToDto()));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLeaveRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var leave = new LeaveRequest
        {
            UserId = userId,
            LeaveType = MappingExtensions.ParseEnum<LeaveType>(request.LeaveType),
            StartDate = DateParsing.ParseDate(request.StartDate),
            EndDate = DateParsing.ParseDate(request.EndDate),
            Reason = request.Reason,
            Status = LeaveStatus.Pending,
        };

        db.LeaveRequests.Add(leave);
        await db.SaveChangesAsync();
        await db.Entry(leave).Reference(l => l.User).LoadAsync();
        return Ok(leave.ToDto());
    }

    [HttpPut("{id}/approve")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Approve(int id, [FromBody] ReviewLeaveRequest? body)
    {
        var adminId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var leave = await db.LeaveRequests.Include(l => l.User).Include(l => l.ReviewedBy)
            .FirstOrDefaultAsync(l => l.Id == id);
        if (leave == null) return NotFound();

        leave.Status = LeaveStatus.Approved;
        leave.ReviewedById = adminId;
        leave.ReviewNotes = body?.ReviewNotes;
        await db.SaveChangesAsync();
        return Ok(leave.ToDto());
    }

    [HttpPut("{id}/reject")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Reject(int id, [FromBody] ReviewLeaveRequest? body)
    {
        var adminId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var leave = await db.LeaveRequests.Include(l => l.User).Include(l => l.ReviewedBy)
            .FirstOrDefaultAsync(l => l.Id == id);
        if (leave == null) return NotFound();

        leave.Status = LeaveStatus.Rejected;
        leave.ReviewedById = adminId;
        leave.ReviewNotes = body?.ReviewNotes;
        await db.SaveChangesAsync();
        return Ok(leave.ToDto());
    }
}
