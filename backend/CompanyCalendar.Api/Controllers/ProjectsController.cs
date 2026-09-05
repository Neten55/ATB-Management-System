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
[Route("api/projects")]
[Authorize]
public class ProjectsController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? status)
    {
        var query = db.Projects.Include(p => p.Owner).Include(p => p.Members).ThenInclude(m => m.User).ThenInclude(u => u!.Department).Include(p => p.Tasks).AsQueryable();
        if (!string.IsNullOrWhiteSpace(search)) query = query.Where(p => p.Name.Contains(search));
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ProjectStatus>(status, true, out var parsedStatus)) query = query.Where(p => p.Status == parsedStatus);
        var projects = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
        return Ok(projects.Select(p => p.ToDto()));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var project = await DetailedQuery().FirstOrDefaultAsync(p => p.Id == id);
        if (project == null) return NotFound();
        if (!CanAccess(project)) return Forbid();
        return Ok(project.ToDto(includeDetails: true));
    }

    [HttpPost]
    public async Task<IActionResult> Create(ProjectRequest request)
    {
        var userId = CurrentUserId();
        var ownerId = User.IsInRole("Administrator") && request.OwnerId.HasValue ? request.OwnerId.Value : userId;
        if (!await db.Users.AnyAsync(u => u.Id == ownerId)) return BadRequest(new { message = "Project owner was not found." });
        if (!TryProjectValues(request, out var startDate, out var dueDate, out var status, out var error)) return BadRequest(new { message = error });
        if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest(new { message = "Project name is required." });
        var memberIds = (request.MemberIds ?? []).Append(ownerId).Distinct().ToArray();
        var existingMemberIds = await db.Users.Select(u => u.Id).ToListAsync();
        if (!memberIds.All(existingMemberIds.Contains)) return BadRequest(new { message = "One or more project members could not be found." });

        var project = new Project { Name = request.Name.Trim(), Description = request.Description, OwnerId = ownerId, StartDate = startDate, DueDate = dueDate, Status = status };
        project.Members = memberIds.Select(id => new ProjectMember { UserId = id }).ToList();
        db.Projects.Add(project);
        await db.SaveChangesAsync();
        project = (await DetailedQuery().FirstAsync(p => p.Id == project.Id));
        return Ok(project.ToDto(includeDetails: true));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, ProjectRequest request)
    {
        var project = await db.Projects.Include(p => p.Members).FirstOrDefaultAsync(p => p.Id == id);
        if (project == null) return NotFound();
        if (!CanManage(project)) return Forbid();
        if (!TryProjectValues(request, out var startDate, out var dueDate, out var status, out var error)) return BadRequest(new { message = error });
        if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest(new { message = "Project name is required." });
        var ownerId = User.IsInRole("Administrator") && request.OwnerId.HasValue ? request.OwnerId.Value : project.OwnerId;
        var memberIds = (request.MemberIds ?? []).Append(ownerId).Distinct().ToArray();
        var existingMemberIds = await db.Users.Select(u => u.Id).ToListAsync();
        if (!memberIds.All(existingMemberIds.Contains)) return BadRequest(new { message = "One or more project members could not be found." });
        project.Name = request.Name.Trim(); project.Description = request.Description; project.OwnerId = ownerId; project.StartDate = startDate; project.DueDate = dueDate; project.Status = status;
        db.ProjectMembers.RemoveRange(project.Members); project.Members = memberIds.Select(memberId => new ProjectMember { ProjectId = id, UserId = memberId }).ToList();
        await db.SaveChangesAsync();
        return Ok((await DetailedQuery().FirstAsync(p => p.Id == id)).ToDto(includeDetails: true));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var project = await db.Projects.FindAsync(id);
        if (project == null) return NotFound();
        if (!CanManage(project)) return Forbid();
        db.Projects.Remove(project); await db.SaveChangesAsync(); return NoContent();
    }

    [HttpPost("{id}/tasks")]
    public async Task<IActionResult> CreateTask(int id, ProjectTaskRequest request)
    {
        var project = await db.Projects.Include(p => p.Members).FirstOrDefaultAsync(p => p.Id == id);
        if (project == null) return NotFound(); if (!CanManage(project)) return Forbid();
        if (!TryTaskValues(request, out var dueDate, out var priority, out var status, out var error)) return BadRequest(new { message = error });
        if (string.IsNullOrWhiteSpace(request.Title)) return BadRequest(new { message = "Task title is required." });
        if (request.AssigneeId.HasValue && !project.Members.Any(m => m.UserId == request.AssigneeId.Value)) return BadRequest(new { message = "Tasks can only be assigned to project members." });
        db.ProjectTasks.Add(new ProjectTask { ProjectId = id, Title = request.Title.Trim(), Description = request.Description, AssigneeId = request.AssigneeId, DueDate = dueDate, Priority = priority, Status = status, CreatedById = CurrentUserId() });
        await db.SaveChangesAsync(); return Ok((await DetailedQuery().FirstAsync(p => p.Id == id)).ToDto(includeDetails: true));
    }

    [HttpPut("{projectId}/tasks/{taskId}")]
    public async Task<IActionResult> UpdateTask(int projectId, int taskId, ProjectTaskRequest request)
    {
        var project = await db.Projects.Include(p => p.Members).FirstOrDefaultAsync(p => p.Id == projectId);
        var task = await db.ProjectTasks.FirstOrDefaultAsync(t => t.Id == taskId && t.ProjectId == projectId);
        if (project == null || task == null) return NotFound();
        if (!CanManage(project) && task.AssigneeId != CurrentUserId()) return Forbid();
        if (!TryTaskValues(request, out var dueDate, out var priority, out var status, out var error)) return BadRequest(new { message = error });
        if (request.AssigneeId.HasValue && !project.Members.Any(m => m.UserId == request.AssigneeId.Value)) return BadRequest(new { message = "Tasks can only be assigned to project members." });
        task.Title = request.Title.Trim(); task.Description = request.Description; task.AssigneeId = request.AssigneeId; task.DueDate = dueDate; task.Priority = priority; task.Status = status;
        await db.SaveChangesAsync(); return Ok((await DetailedQuery().FirstAsync(p => p.Id == projectId)).ToDto(includeDetails: true));
    }

    [HttpDelete("{projectId}/tasks/{taskId}")]
    public async Task<IActionResult> DeleteTask(int projectId, int taskId)
    {
        var project = await db.Projects.FindAsync(projectId); if (project == null) return NotFound(); if (!CanManage(project)) return Forbid();
        var task = await db.ProjectTasks.FirstOrDefaultAsync(t => t.Id == taskId && t.ProjectId == projectId); if (task == null) return NotFound();
        db.ProjectTasks.Remove(task); await db.SaveChangesAsync(); return NoContent();
    }

    [HttpPost("{id}/discussions")]
    public async Task<IActionResult> AddDiscussion(int id, ProjectDiscussionRequest request)
    {
        var project = await db.Projects.Include(p => p.Members).FirstOrDefaultAsync(p => p.Id == id); if (project == null) return NotFound(); if (!CanAccess(project)) return Forbid();
        if (string.IsNullOrWhiteSpace(request.Content)) return BadRequest(new { message = "Discussion content is required." });
        if (request.ParentId.HasValue && !await db.ProjectDiscussions.AnyAsync(d => d.Id == request.ParentId && d.ProjectId == id)) return BadRequest(new { message = "The discussion being replied to was not found." });
        db.ProjectDiscussions.Add(new ProjectDiscussion { ProjectId = id, AuthorId = CurrentUserId(), Content = request.Content.Trim(), ParentId = request.ParentId }); await db.SaveChangesAsync();
        return Ok((await DetailedQuery().FirstAsync(p => p.Id == id)).ToDto(includeDetails: true));
    }

    [HttpPost("{id}/notes")]
    public async Task<IActionResult> AddNote(int id, ProjectNoteRequest request)
    {
        var project = await db.Projects.Include(p => p.Members).FirstOrDefaultAsync(p => p.Id == id); if (project == null) return NotFound(); if (!CanAccess(project)) return Forbid();
        if (string.IsNullOrWhiteSpace(request.Content)) return BadRequest(new { message = "Note content is required." });
        db.ProjectNotes.Add(new ProjectNote { ProjectId = id, AuthorId = CurrentUserId(), Content = request.Content.Trim() }); await db.SaveChangesAsync();
        return Ok((await DetailedQuery().FirstAsync(p => p.Id == id)).ToDto(includeDetails: true));
    }

    private IQueryable<Project> DetailedQuery() => db.Projects.Include(p => p.Owner).Include(p => p.Members).ThenInclude(m => m.User).ThenInclude(u => u!.Department).Include(p => p.Tasks).ThenInclude(t => t.Assignee).Include(p => p.Discussions).ThenInclude(d => d.Author).Include(p => p.Notes).ThenInclude(n => n.Author);
    private int CurrentUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private bool CanAccess(Project project) => User.IsInRole("Administrator") || project.OwnerId == CurrentUserId() || project.Members.Any(m => m.UserId == CurrentUserId());
    private bool CanManage(Project project) => User.IsInRole("Administrator") || project.OwnerId == CurrentUserId();
    private static bool TryProjectValues(ProjectRequest request, out DateOnly? start, out DateOnly? due, out ProjectStatus status, out string error) { start = due = null; status = ProjectStatus.Planning; error = ""; try { start = string.IsNullOrWhiteSpace(request.StartDate) ? null : DateParsing.ParseDate(request.StartDate); due = string.IsNullOrWhiteSpace(request.DueDate) ? null : DateParsing.ParseDate(request.DueDate); status = MappingExtensions.ParseEnum<ProjectStatus>(request.Status); if (start > due) { error = "Due date cannot be before start date."; return false; } return true; } catch { error = "Use valid project dates and status."; return false; } }
    private static bool TryTaskValues(ProjectTaskRequest request, out DateOnly? due, out Priority priority, out ProjectTaskStatus status, out string error) { due = null; priority = Priority.Medium; status = ProjectTaskStatus.ToDo; error = ""; try { due = string.IsNullOrWhiteSpace(request.DueDate) ? null : DateParsing.ParseDate(request.DueDate); priority = MappingExtensions.ParseEnum<Priority>(request.Priority); status = MappingExtensions.ParseEnum<ProjectTaskStatus>(request.Status); return true; } catch { error = "Use a valid task due date, priority, and status."; return false; } }
}
