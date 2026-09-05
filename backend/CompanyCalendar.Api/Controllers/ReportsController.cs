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
[Route("api/reports")]
[Authorize]
public class ReportsController(ApplicationDbContext db, IReportFileStorageService fileStorage) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? status, [FromQuery] string? scope)
    {
        var userId = CurrentUserId();
        var isAdmin = User.IsInRole("Administrator");
        var query = ListQuery();

        if (scope == "mine")
            query = query.Where(r => r.CreatedById == userId);
        else if (scope == "shared")
            query = query.Where(r => r.Shares.Any(s => s.UserId == userId));
        else if (scope == "all" && isAdmin)
        { /* no filter */ }
        else if (!isAdmin)
            query = query.Where(r => r.CreatedById == userId || r.Shares.Any(s => s.UserId == userId));

        if (!string.IsNullOrWhiteSpace(search)) query = query.Where(r => r.Title.Contains(search));
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ReportStatus>(status, true, out var parsedStatus))
            query = query.Where(r => r.Status == parsedStatus);

        var reports = await query.OrderByDescending(r => r.UpdatedAt).ToListAsync();
        return Ok(reports.Select(r => r.ToListDto()));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var report = await DetailedQuery().FirstOrDefaultAsync(r => r.Id == id);
        if (report == null) return NotFound();
        if (!CanAccess(report)) return Forbid();
        return Ok(report.ToDto());
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateReportRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title)) return BadRequest(new { message = "Report title is required." });
        if (request.DepartmentId.HasValue && !await db.Departments.AnyAsync(d => d.Id == request.DepartmentId))
            return BadRequest(new { message = "Department was not found." });

        var userId = CurrentUserId();
        var report = new Report
        {
            Title = request.Title.Trim(),
            Content = request.Content ?? "",
            DepartmentId = request.DepartmentId,
            Status = ReportStatus.Draft,
            CreatedById = userId,
        };
        db.Reports.Add(report);
        await db.SaveChangesAsync();
        AddVersionSnapshot(report, userId);
        await db.SaveChangesAsync();

        var saved = await DetailedQuery().FirstAsync(r => r.Id == report.Id);
        return Ok(saved.ToDto());
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, CreateReportRequest request)
    {
        var report = await db.Reports.FirstOrDefaultAsync(r => r.Id == id);
        if (report == null) return NotFound();
        if (!CanManage(report)) return Forbid();
        if (report.Status == ReportStatus.Approved) return BadRequest(new { message = "Approved reports can no longer be edited." });
        if (string.IsNullOrWhiteSpace(request.Title)) return BadRequest(new { message = "Report title is required." });
        if (request.DepartmentId.HasValue && !await db.Departments.AnyAsync(d => d.Id == request.DepartmentId))
            return BadRequest(new { message = "Department was not found." });

        report.Title = request.Title.Trim();
        report.Content = request.Content ?? "";
        report.DepartmentId = request.DepartmentId;
        report.UpdatedAt = DateTime.UtcNow;
        AddVersionSnapshot(report, CurrentUserId());
        await db.SaveChangesAsync();

        var saved = await DetailedQuery().FirstAsync(r => r.Id == id);
        return Ok(saved.ToDto());
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var report = await db.Reports.Include(r => r.Attachments).FirstOrDefaultAsync(r => r.Id == id);
        if (report == null) return NotFound();
        if (!CanManage(report)) return Forbid();

        foreach (var attachment in report.Attachments)
            fileStorage.Delete(attachment.StoragePath);

        db.Reports.Remove(report);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/submit")]
    public async Task<IActionResult> Submit(int id)
    {
        var report = await db.Reports.Include(r => r.Shares).FirstOrDefaultAsync(r => r.Id == id);
        if (report == null) return NotFound();
        if (!CanManage(report)) return Forbid();
        if (report.Status != ReportStatus.Draft) return BadRequest(new { message = "Only draft reports can be submitted." });
        if (report.Shares.Count == 0) return BadRequest(new { message = "Share the report with at least one employee before submitting." });

        report.Status = ReportStatus.Submitted;
        report.SubmittedAt = DateTime.UtcNow;
        report.UpdatedAt = DateTime.UtcNow;
        AddVersionSnapshot(report, CurrentUserId());
        await db.SaveChangesAsync();

        var saved = await DetailedQuery().FirstAsync(r => r.Id == id);
        return Ok(saved.ToDto());
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> UpdateStatus(int id, ReportStatusRequest request)
    {
        var report = await db.Reports.Include(r => r.CreatedBy).FirstOrDefaultAsync(r => r.Id == id);
        if (report == null) return NotFound();
        if (!Enum.TryParse<ReportStatus>(request.Status, true, out var newStatus))
            return BadRequest(new { message = "Use a valid report status." });
        if (report.Status == ReportStatus.Draft) return BadRequest(new { message = "Submit the report before it can be reviewed." });

        var adminId = CurrentUserId();
        report.Status = newStatus;
        report.ReviewNotes = request.ReviewNotes;
        report.ReviewedById = adminId;
        report.ReviewedAt = DateTime.UtcNow;
        report.UpdatedAt = DateTime.UtcNow;
        AddVersionSnapshot(report, adminId);

        if (report.CreatedById != adminId)
        {
            db.Notifications.Add(new Notification
            {
                UserId = report.CreatedById,
                Title = "Report status updated",
                Message = $"Your report \"{report.Title}\" was marked {newStatus}.",
            });
        }

        await db.SaveChangesAsync();
        var saved = await DetailedQuery().FirstAsync(r => r.Id == id);
        return Ok(saved.ToDto());
    }

    [HttpPost("{id}/share")]
    public async Task<IActionResult> Share(int id, ReportShareRequest request)
    {
        var report = await db.Reports.Include(r => r.Shares).Include(r => r.CreatedBy).FirstOrDefaultAsync(r => r.Id == id);
        if (report == null) return NotFound();
        if (!CanManage(report)) return Forbid();

        var userIds = (request.UserIds ?? []).Distinct().Where(uid => uid != report.CreatedById).ToArray();
        var existingUserIds = await db.Users.Select(u => u.Id).ToListAsync();
        if (!userIds.All(existingUserIds.Contains)) return BadRequest(new { message = "One or more employees could not be found." });

        var alreadyShared = report.Shares.Select(s => s.UserId).ToHashSet();
        var newUserIds = userIds.Where(uid => !alreadyShared.Contains(uid)).ToArray();

        foreach (var uid in newUserIds)
        {
            db.ReportShares.Add(new ReportShare { ReportId = id, UserId = uid });
            db.Notifications.Add(new Notification
            {
                UserId = uid,
                Title = "Report shared with you",
                Message = $"{report.CreatedBy!.FirstName} {report.CreatedBy.LastName} shared a report with you: \"{report.Title}\".",
            });
        }
        await db.SaveChangesAsync();

        var saved = await DetailedQuery().FirstAsync(r => r.Id == id);
        return Ok(saved.ToDto());
    }

    [HttpDelete("{id}/share/{userId}")]
    public async Task<IActionResult> Unshare(int id, int userId)
    {
        var report = await db.Reports.FirstOrDefaultAsync(r => r.Id == id);
        if (report == null) return NotFound();
        if (!CanManage(report)) return Forbid();

        var share = await db.ReportShares.FirstOrDefaultAsync(s => s.ReportId == id && s.UserId == userId);
        if (share == null) return NotFound();
        db.ReportShares.Remove(share);
        await db.SaveChangesAsync();

        var saved = await DetailedQuery().FirstAsync(r => r.Id == id);
        return Ok(saved.ToDto());
    }

    [HttpPost("{id}/comments")]
    public async Task<IActionResult> AddComment(int id, ReportCommentRequest request)
    {
        var report = await db.Reports.Include(r => r.Shares).FirstOrDefaultAsync(r => r.Id == id);
        if (report == null) return NotFound();
        if (!CanAccess(report)) return Forbid();
        if (string.IsNullOrWhiteSpace(request.Content)) return BadRequest(new { message = "Comment cannot be empty." });

        db.ReportComments.Add(new ReportComment { ReportId = id, AuthorId = CurrentUserId(), Content = request.Content.Trim() });
        await db.SaveChangesAsync();

        var saved = await DetailedQuery().FirstAsync(r => r.Id == id);
        return Ok(saved.ToDto());
    }

    [HttpGet("{id}/versions")]
    public async Task<IActionResult> GetVersions(int id)
    {
        var report = await db.Reports.Include(r => r.Shares).FirstOrDefaultAsync(r => r.Id == id);
        if (report == null) return NotFound();
        if (!CanAccess(report)) return Forbid();

        var versions = await db.ReportVersions.Include(v => v.EditedBy)
            .Where(v => v.ReportId == id).OrderByDescending(v => v.EditedAt).ToListAsync();
        return Ok(versions.Select(v => v.ToDto()));
    }

    [HttpPost("{id}/attachments")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadAttachments(int id, [FromForm] List<IFormFile> files)
    {
        var report = await db.Reports.FirstOrDefaultAsync(r => r.Id == id);
        if (report == null) return NotFound();
        if (!CanManage(report)) return Forbid();
        if (files.Count == 0) return BadRequest(new { message = "Choose at least one file to attach." });

        var userId = CurrentUserId();
        foreach (var file in files)
        {
            (string StoragePath, long SizeBytes) saved;
            try { saved = await fileStorage.SaveAsync(id, file); }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }

            db.ReportAttachments.Add(new ReportAttachment
            {
                ReportId = id,
                FileName = Path.GetFileName(file.FileName),
                ContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
                FileSizeBytes = saved.SizeBytes,
                StoragePath = saved.StoragePath,
                UploadedById = userId,
            });
        }
        report.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        var result = await DetailedQuery().FirstAsync(r => r.Id == id);
        return Ok(result.ToDto());
    }

    [HttpGet("{id}/attachments/{attachmentId}/download")]
    public async Task<IActionResult> DownloadAttachment(int id, int attachmentId)
    {
        var report = await db.Reports.Include(r => r.Shares).FirstOrDefaultAsync(r => r.Id == id);
        if (report == null) return NotFound();
        if (!CanAccess(report)) return Forbid();

        var attachment = await db.ReportAttachments.FirstOrDefaultAsync(a => a.Id == attachmentId && a.ReportId == id);
        if (attachment == null) return NotFound();

        var stream = fileStorage.OpenRead(attachment.StoragePath);
        return File(stream, attachment.ContentType, attachment.FileName);
    }

    [HttpDelete("{id}/attachments/{attachmentId}")]
    public async Task<IActionResult> DeleteAttachment(int id, int attachmentId)
    {
        var report = await db.Reports.FirstOrDefaultAsync(r => r.Id == id);
        if (report == null) return NotFound();
        if (!CanManage(report)) return Forbid();

        var attachment = await db.ReportAttachments.FirstOrDefaultAsync(a => a.Id == attachmentId && a.ReportId == id);
        if (attachment == null) return NotFound();

        fileStorage.Delete(attachment.StoragePath);
        db.ReportAttachments.Remove(attachment);
        await db.SaveChangesAsync();

        var saved = await DetailedQuery().FirstAsync(r => r.Id == id);
        return Ok(saved.ToDto());
    }

    private IQueryable<Report> ListQuery() => db.Reports
        .Include(r => r.CreatedBy).Include(r => r.Department)
        .Include(r => r.Shares).Include(r => r.Attachments).Include(r => r.Comments);

    private IQueryable<Report> DetailedQuery() => db.Reports
        .Include(r => r.CreatedBy).Include(r => r.Department).Include(r => r.ReviewedBy)
        .Include(r => r.Shares).ThenInclude(s => s.User).ThenInclude(u => u!.Department)
        .Include(r => r.Comments).ThenInclude(c => c.Author)
        .Include(r => r.Attachments).ThenInclude(a => a.UploadedBy)
        .Include(r => r.Versions).ThenInclude(v => v.EditedBy);

    private void AddVersionSnapshot(Report report, int editedById) => db.ReportVersions.Add(new ReportVersion
    {
        ReportId = report.Id,
        Title = report.Title,
        Content = report.Content,
        Status = report.Status,
        EditedById = editedById,
    });

    private int CurrentUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private bool CanAccess(Report report) => User.IsInRole("Administrator") || report.CreatedById == CurrentUserId() || report.Shares.Any(s => s.UserId == CurrentUserId());
    private bool CanManage(Report report) => User.IsInRole("Administrator") || report.CreatedById == CurrentUserId();
}
