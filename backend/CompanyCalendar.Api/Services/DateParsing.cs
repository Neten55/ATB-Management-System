using System.Globalization;
using CompanyCalendar.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace CompanyCalendar.Api.Services;

public static class DateParsing
{
    private static readonly CultureInfo Gregorian = CultureInfo.InvariantCulture;
    private static readonly TimeZoneInfo Bhutan = ResolveBhutanTimeZone();

    public static DateOnly Today()
    {
        var local = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, Bhutan);
        return new DateOnly(local.Year, local.Month, local.Day);
    }

    public static DateOnly ParseDate(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new FormatException("Date is required");

        var text = value.Trim();
        if (text.Length >= 10
            && DateOnly.TryParseExact(text[..10], "yyyy-MM-dd", Gregorian, DateTimeStyles.None, out var iso))
            return NormalizeCalendarYear(iso);

        if (DateOnly.TryParse(text, Gregorian, DateTimeStyles.None, out var parsed))
            return NormalizeCalendarYear(parsed);

        throw new FormatException($"Invalid date: {value}");
    }

    public static TimeOnly ParseTime(string value) =>
        TimeOnly.Parse(value, Gregorian);

    public static TimeOnly? ParseOptionalTime(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : ParseTime(value);

    /// <summary>
    /// macOS/Safari Buddhist-era date pickers and th-TH DateOnly.Parse can store
    /// 2569 (BE) or 1483 (CE year treated as BE). Convert those back to Gregorian.
    /// </summary>
    public static DateOnly NormalizeCalendarYear(DateOnly date)
    {
        if (date.Year >= 2400)
            return new DateOnly(date.Year - 543, date.Month, date.Day);
        if (date.Year is >= 1400 and <= 1700)
            return new DateOnly(date.Year + 543, date.Month, date.Day);
        return date;
    }

    public static async Task RepairStoredCalendarYearsAsync(ApplicationDbContext db)
    {
        foreach (var meeting in await db.Meetings.ToListAsync())
            meeting.MeetingDate = NormalizeCalendarYear(meeting.MeetingDate);

        foreach (var schedule in await db.Schedules.ToListAsync())
            schedule.Date = NormalizeCalendarYear(schedule.Date);

        foreach (var reminder in await db.Reminders.ToListAsync())
            reminder.ReminderDate = NormalizeCalendarYear(reminder.ReminderDate);

        foreach (var companyEvent in await db.Events.ToListAsync())
        {
            companyEvent.StartDate = NormalizeCalendarYear(companyEvent.StartDate);
            companyEvent.EndDate = NormalizeCalendarYear(companyEvent.EndDate);
        }

        foreach (var leave in await db.LeaveRequests.ToListAsync())
        {
            leave.StartDate = NormalizeCalendarYear(leave.StartDate);
            leave.EndDate = NormalizeCalendarYear(leave.EndDate);
        }

        foreach (var holiday in await db.Holidays.ToListAsync())
            holiday.Date = NormalizeCalendarYear(holiday.Date);

        await db.SaveChangesAsync();
    }

    private static TimeZoneInfo ResolveBhutanTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(
                OperatingSystem.IsWindows() ? "Bhutan Standard Time" : "Asia/Thimphu");
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.CreateCustomTimeZone("Bhutan", TimeSpan.FromHours(6), "Bhutan", "Bhutan");
        }
    }
}
