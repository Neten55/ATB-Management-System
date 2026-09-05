using CompanyCalendar.Api.Data;
using CompanyCalendar.Api.Models;
using CompanyCalendar.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace CompanyCalendar.Api;

public static class DbSeeder
{
    public static async Task SeedAsync(ApplicationDbContext db, IPasswordService passwordService)
    {
        if (await db.Users.AnyAsync()) return;

        var departments = new[]
        {
            new Department { Name = "Engineering", Description = "Software & IT" },
            new Department { Name = "Operations", Description = "Daily operations" },
            new Department { Name = "Administration", Description = "HR & Admin" },
            new Department { Name = "Sales", Description = "Sales & Marketing" },
        };
        db.Departments.AddRange(departments);
        await db.SaveChangesAsync();

        var admin = new ApplicationUser
        {
            Email = "07220029.sherubtse@rub.edu.bt",
            PasswordHash = passwordService.Hash("07220029"),
            FirstName = "Karma",
            LastName = "Wangchuk",
            Role = UserRole.Administrator,
            DepartmentId = departments[2].Id,
            JobTitle = "System Administrator",
            Phone = "+975 17123456",
        };

        var employee = new ApplicationUser
        {
            Email = "tsheringimcs806@gmail.com",
            PasswordHash = passwordService.Hash("Employee@123"),
            FirstName = "Sonam",
            LastName = "Dorji",
            Role = UserRole.Employee,
            DepartmentId = departments[0].Id,
            JobTitle = "Software Engineer",
            Phone = "+975 17765432",
        };

        db.Users.AddRange(admin, employee);

        var employee2 = new ApplicationUser
        {
            Email = "omprakasharchaja09@gmail.com",
            PasswordHash = passwordService.Hash("Employee@123"),
            FirstName = "Om Prakash",
            LastName = "Archaja",
            Role = UserRole.Employee,
            DepartmentId = departments[1].Id,
            JobTitle = "Operations Manager",
            Phone = "+975 17654321",
        };

        db.Users.Add(employee2);

        db.Holidays.AddRange(
            new Holiday { Name = "National Day", Date = new DateOnly(2026, 12, 17), Description = "Bhutan National Day", IsRecurring = true },
            new Holiday { Name = "Losar", Date = new DateOnly(2026, 2, 28), Description = "Bhutanese New Year", IsRecurring = true }
        );

        await db.SaveChangesAsync();
    }
}
