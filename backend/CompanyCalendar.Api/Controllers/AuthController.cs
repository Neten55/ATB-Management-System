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
[Route("api/[controller]")]
public class AuthController(
    ApplicationDbContext db,
    IPasswordService passwordService,
    ITokenService tokenService,
    IEmailService emailService,
    IConfiguration configuration,
    ILogger<AuthController> logger) : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await db.Users.Include(u => u.Department)
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null || !passwordService.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid email or password" });

        return Ok(new LoginResponse(tokenService.GenerateToken(user), user.ToDto()));
    }

    [HttpPost("register")]
    [Authorize(Roles = "Administrator")]
    public async Task<ActionResult<LoginResponse>> Register([FromBody] RegisterRequest request)
    {
        if (await db.Users.AnyAsync(u => u.Email == request.Email))
            return BadRequest(new { message = "Email already registered" });

        var adminId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var admin = await db.Users.FindAsync(adminId);

        var user = new ApplicationUser
        {
            Email = request.Email.Trim(),
            PasswordHash = passwordService.Hash(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName,
            Role = UserRole.Employee,
            DepartmentId = request.DepartmentId,
            JobTitle = request.JobTitle,
            Phone = request.Phone,
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();
        await db.Entry(user).Reference(u => u.Department).LoadAsync();

        var loginUrl = $"{configuration["Frontend:BaseUrl"]?.TrimEnd('/') ?? "http://localhost:5173"}/login";
        var adminName = admin != null ? $"{admin.FirstName} {admin.LastName}" : "Aerotech Bhutan";
        var sent = await emailService.SendEmailAsync(
            user.Email,
            $"{user.FirstName} {user.LastName}".Trim(),
            "Your Aerotech Bhutan staff account",
            WelcomeEmailHelper.BuildHtml(user.FirstName, user.LastName, user.Email, request.Password, loginUrl),
            fromEmail: admin?.Email,
            fromName: adminName,
            replyToEmail: admin?.Email);

        logger.LogInformation(
            "Welcome email for new employee {EmployeeEmail} completed. Success={Success}",
            user.Email, sent);

        var message = sent
            ? "Account created. Login details were emailed to the employee."
            : "Account created, but the welcome email could not be sent. Share the password with them manually.";

        return Ok(new LoginResponse(
            tokenService.GenerateToken(user),
            user.ToDto(),
            sent,
            message));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await db.Users.Include(u => u.Department).FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return NotFound();
        return Ok(user.ToDto());
    }
}
