using System.Net;
using System.Net.Mail;
using System.Net.Mime;
using System.Security.Authentication;
using System.Text;

namespace CompanyCalendar.Api.Services;

public interface IEmailService
{
    Task<bool> SendEmailAsync(
        string toEmail,
        string toName,
        string subject,
        string htmlBody,
        string? calendarIcs = null,
        string? fromEmail = null,
        string? fromName = null,
        string? replyToEmail = null);
}

public class EmailService(IConfiguration configuration, ILogger<EmailService> logger) : IEmailService
{
    public async Task<bool> SendEmailAsync(
        string toEmail,
        string toName,
        string subject,
        string htmlBody,
        string? calendarIcs = null,
        string? fromEmail = null,
        string? fromName = null,
        string? replyToEmail = null)
    {
        var host = configuration["Smtp:Host"];
        var port = configuration.GetValue("Smtp:Port", 587);
        var username = configuration["Smtp:Username"];
        var password = configuration["Smtp:Password"];
        var smtpFromEmail = configuration["Smtp:FromEmail"] ?? username;
        var smtpFromName = configuration["Smtp:FromName"] ?? "Aerotech Bhutan";
        var enableSsl = configuration.GetValue("Smtp:EnableSsl", true);

        if (string.IsNullOrWhiteSpace(host))
        {
            logger.LogWarning(
                "Email send skipped: SMTP Host is not configured. Recipient={RecipientEmail}, Subject={Subject}",
                toEmail, subject);
            return false;
        }

        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            logger.LogWarning(
                "Email send skipped: SMTP Username or Password is not configured. Host={SmtpHost}, Recipient={RecipientEmail}",
                host, toEmail);
            return false;
        }

        var normalizedPassword = password.Replace(" ", string.Empty);
        var visibleFromEmail = string.IsNullOrWhiteSpace(fromEmail) ? smtpFromEmail : fromEmail;
        var visibleFromName = string.IsNullOrWhiteSpace(fromName) ? smtpFromName : fromName;
        var replyTo = string.IsNullOrWhiteSpace(replyToEmail) ? visibleFromEmail : replyToEmail;

        logger.LogInformation(
            "Attempting email send. Recipient={RecipientEmail}, FromEmail={FromEmail}, ReplyTo={ReplyTo}, Subject={Subject}, SmtpHost={SmtpHost}, SmtpUsername={SmtpUsername}",
            toEmail, visibleFromEmail, replyTo, subject, host, username);

        var sent = await TrySendAsync(
            host, port, username, normalizedPassword, enableSsl,
            visibleFromEmail!, visibleFromName!, replyTo!,
            toEmail, toName, subject, htmlBody, calendarIcs);

        if (sent) return true;

        if (!string.Equals(visibleFromEmail, smtpFromEmail, StringComparison.OrdinalIgnoreCase))
        {
            logger.LogWarning(
                "Send as organizer {OrganizerEmail} failed; retrying with SMTP mailbox {SmtpFrom}",
                visibleFromEmail, smtpFromEmail);

            return await TrySendAsync(
                host, port, username, normalizedPassword, enableSsl,
                smtpFromEmail!, visibleFromName!, replyTo!,
                toEmail, toName, subject, htmlBody, calendarIcs);
        }

        return false;
    }

    private async Task<bool> TrySendAsync(
        string host,
        int port,
        string username,
        string password,
        bool enableSsl,
        string fromEmail,
        string fromName,
        string replyToEmail,
        string toEmail,
        string toName,
        string subject,
        string htmlBody,
        string? calendarIcs)
    {
        using var client = new SmtpClient(host, port)
        {
            EnableSsl = enableSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network,
            UseDefaultCredentials = false,
            Timeout = 30000,
        };
        client.Credentials = new NetworkCredential(username, password);

        using var message = new MailMessage
        {
            From = new MailAddress(fromEmail, fromName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true,
        };
        message.To.Add(new MailAddress(toEmail, toName));
        message.ReplyToList.Add(new MailAddress(replyToEmail, fromName));

        try
        {
            if (!string.IsNullOrWhiteSpace(calendarIcs))
            {
                var icsStream = new MemoryStream(Encoding.UTF8.GetBytes(calendarIcs));
                var attachment = new Attachment(icsStream, "invite.ics", "text/calendar");
                attachment.ContentDisposition!.DispositionType = DispositionTypeNames.Attachment;
                message.Attachments.Add(attachment);
            }

            await client.SendMailAsync(message);
            logger.LogInformation(
                "Email sent successfully. Recipient={RecipientEmail}, FromEmail={FromEmail}, Subject={Subject}",
                toEmail, fromEmail, subject);
            return true;
        }
        catch (SmtpException ex)
        {
            logger.LogError(
                ex,
                "SMTP send failed. Recipient={RecipientEmail}, FromEmail={FromEmail}, SmtpHost={SmtpHost}, StatusCode={StatusCode}",
                toEmail, fromEmail, host, ex.StatusCode);
            return false;
        }
        catch (AuthenticationException ex)
        {
            logger.LogError(
                ex,
                "SMTP authentication failed. Recipient={RecipientEmail}, SmtpHost={SmtpHost}, SmtpUsername={SmtpUsername}",
                toEmail, host, username);
            return false;
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "Email send failed. Recipient={RecipientEmail}, FromEmail={FromEmail}, Subject={Subject}",
                toEmail, fromEmail, subject);
            return false;
        }
    }
}
