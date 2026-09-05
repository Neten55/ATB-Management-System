using CompanyCalendar.Api.Models;

namespace CompanyCalendar.Api.Services;

public static class ReminderTimingHelper
{
    public static string ToLabel(ReminderTiming timing) => timing switch
    {
        ReminderTiming.OneDayBefore => "1 Day",
        ReminderTiming.ThreeHoursBefore => "3 Hours",
        ReminderTiming.OneHourBefore => "1 Hour",
        ReminderTiming.ThirtyMinutesBefore => "30 Minutes",
        ReminderTiming.FifteenMinutesBefore => "15 Minutes",
        _ => timing.ToString(),
    };

    public static DateTime GetEventDateTime(DateOnly date, TimeOnly? time) =>
        date.ToDateTime(time ?? new TimeOnly(9, 0), DateTimeKind.Utc);

    public static DateTime GetReminderSendTime(DateTime eventDateTime, ReminderTiming timing) => timing switch
    {
        ReminderTiming.OneDayBefore => eventDateTime.AddDays(-1),
        ReminderTiming.ThreeHoursBefore => eventDateTime.AddHours(-3),
        ReminderTiming.OneHourBefore => eventDateTime.AddHours(-1),
        ReminderTiming.ThirtyMinutesBefore => eventDateTime.AddMinutes(-30),
        ReminderTiming.FifteenMinutesBefore => eventDateTime.AddMinutes(-15),
        _ => eventDateTime.AddHours(-1),
    };

    public static bool ShouldSendReminder(DateTime eventDateTime, ReminderTiming timing, DateTime now)
    {
        var sendAt = GetReminderSendTime(eventDateTime, timing);
        return now >= sendAt && now < eventDateTime;
    }
}
