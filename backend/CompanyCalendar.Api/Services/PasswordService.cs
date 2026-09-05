using CompanyCalendar.Api.Models;
using Microsoft.AspNetCore.Identity;

namespace CompanyCalendar.Api.Services;

public interface IPasswordService
{
    string Hash(string password);
    bool Verify(string password, string hash);
}

public class PasswordService : IPasswordService
{
    private readonly PasswordHasher<ApplicationUser> _hasher = new();

    public string Hash(string password) => _hasher.HashPassword(new ApplicationUser(), password);

    public bool Verify(string password, string hash) =>
        _hasher.VerifyHashedPassword(new ApplicationUser(), hash, password) != PasswordVerificationResult.Failed;
}
