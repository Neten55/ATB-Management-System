namespace CompanyCalendar.Api.Services;

public static class WelcomeEmailHelper
{
    public static string BuildHtml(
        string firstName,
        string lastName,
        string email,
        string temporaryPassword,
        string loginUrl)
    {
        var name = System.Net.WebUtility.HtmlEncode($"{firstName} {lastName}".Trim());
        var safeEmail = System.Net.WebUtility.HtmlEncode(email);
        var safePassword = System.Net.WebUtility.HtmlEncode(temporaryPassword);
        var safeUrl = System.Net.WebUtility.HtmlEncode(loginUrl);

        return $"""
            <!DOCTYPE html>
            <html>
            <body style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#1e293b;max-width:600px;margin:0 auto;padding:24px;">
              <div style="border-bottom:3px solid #1e40af;padding-bottom:12px;margin-bottom:24px;">
                <strong style="font-size:18px;color:#1e40af;">Aerotech Bhutan</strong>
                <span style="color:#64748b;font-size:13px;display:block;">Company Calendar & Staff Portal</span>
              </div>
              <h2 style="color:#1e40af;margin:0 0 16px;">Your staff account is ready</h2>
              <p>Dear {name},</p>
              <p>An administrator has created your account on the Aerotech Bhutan company calendar. Use the details below to sign in.</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
                <tr><td style="padding:8px 0;color:#64748b;width:160px;">Name</td><td style="padding:8px 0;"><strong>{name}</strong></td></tr>
                <tr><td style="padding:8px 0;color:#64748b;">Username</td><td style="padding:8px 0;">{safeEmail}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b;">Email</td><td style="padding:8px 0;">{safeEmail}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b;">Temporary password</td><td style="padding:8px 0;">{safePassword}</td></tr>
              </table>
              <p style="margin:20px 0;">
                <a href="{safeUrl}" style="display:inline-block;background:#1e40af;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:6px;font-size:14px;">
                  Open login page
                </a>
              </p>
              <p style="color:#64748b;font-size:13px;">If the button does not work, copy this link into your browser:<br />{safeUrl}</p>
              <p style="margin-top:24px;color:#64748b;font-size:13px;">Please change your password after you sign in if your administrator asked you to.</p>
              <p style="margin-top:32px;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0;padding-top:16px;">
                This is an automated message from Aerotech Bhutan.
              </p>
            </body>
            </html>
            """;
    }
}
