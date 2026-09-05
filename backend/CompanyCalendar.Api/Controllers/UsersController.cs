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
[Route("api/users")]
[Authorize]
public class UsersController(ApplicationDbContext db, IPasswordService passwordService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await db.Users.Include(u => u.Department).ToListAsync();
        return Ok(users.Select(u => u.ToDto()));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProfileRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isAdmin = User.IsInRole("Administrator");
        if (id != userId && !isAdmin) return Forbid();

        var user = await db.Users.Include(u => u.Department).FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var email = request.Email.Trim();
            var taken = await db.Users.AnyAsync(u => u.Email == email && u.Id != id);
            if (taken)
                return BadRequest(new { message = "That email is already registered" });
            user.Email = email;
        }

        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        user.Phone = request.Phone;
        user.JobTitle = request.JobTitle;
        user.DepartmentId = request.DepartmentId;

        if (!string.IsNullOrWhiteSpace(request.NewPassword))
        {
            if (request.NewPassword.Length < 6)
                return BadRequest(new { message = "New password must be at least 6 characters" });

            user.PasswordHash = passwordService.Hash(request.NewPassword);
        }

        await db.SaveChangesAsync();
        await db.Entry(user).Reference(u => u.Department).LoadAsync();
        return Ok(user.ToDto());
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(int id)
    {
        var user = await db.Users.FindAsync(id);
        if (user == null) return NotFound();
        if (user.Role == UserRole.Administrator)
            return BadRequest(new { message = "Cannot delete administrator accounts" });

        db.Users.Remove(user);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
