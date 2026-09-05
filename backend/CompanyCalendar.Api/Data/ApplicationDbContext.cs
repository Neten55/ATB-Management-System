using CompanyCalendar.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CompanyCalendar.Api.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Department> Departments => Set<Department>();
    public DbSet<ApplicationUser> Users => Set<ApplicationUser>();
    public DbSet<Schedule> Schedules => Set<Schedule>();
    public DbSet<ScheduleAssignment> ScheduleAssignments => Set<ScheduleAssignment>();
    public DbSet<Meeting> Meetings => Set<Meeting>();
    public DbSet<MeetingParticipant> MeetingParticipants => Set<MeetingParticipant>();
    public DbSet<Reminder> Reminders => Set<Reminder>();
    public DbSet<CompanyEvent> Events => Set<CompanyEvent>();
    public DbSet<LeaveRequest> LeaveRequests => Set<LeaveRequest>();
    public DbSet<Announcement> Announcements => Set<Announcement>();
    public DbSet<Holiday> Holidays => Set<Holiday>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<ExternalParticipant> ExternalParticipants => Set<ExternalParticipant>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();
    public DbSet<ProjectTask> ProjectTasks => Set<ProjectTask>();
    public DbSet<ProjectDiscussion> ProjectDiscussions => Set<ProjectDiscussion>();
    public DbSet<ProjectNote> ProjectNotes => Set<ProjectNote>();
    public DbSet<Report> Reports => Set<Report>();
    public DbSet<ReportShare> ReportShares => Set<ReportShare>();
    public DbSet<ReportComment> ReportComments => Set<ReportComment>();
    public DbSet<ReportAttachment> ReportAttachments => Set<ReportAttachment>();
    public DbSet<ReportVersion> ReportVersions => Set<ReportVersion>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ApplicationUser>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<ScheduleAssignment>()
            .HasKey(sa => new { sa.ScheduleId, sa.UserId });

        modelBuilder.Entity<MeetingParticipant>()
            .HasKey(mp => new { mp.MeetingId, mp.UserId });

        modelBuilder.Entity<ProjectMember>()
            .HasKey(pm => new { pm.ProjectId, pm.UserId });

        modelBuilder.Entity<Schedule>()
            .HasOne(s => s.Department)
            .WithMany(d => d.Schedules)
            .HasForeignKey(s => s.DepartmentId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<ApplicationUser>()
            .HasOne(u => u.Department)
            .WithMany(d => d.Users)
            .HasForeignKey(u => u.DepartmentId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Schedule>()
            .HasOne(s => s.CreatedBy)
            .WithMany()
            .HasForeignKey(s => s.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ScheduleAssignment>()
            .HasOne(sa => sa.User)
            .WithMany(u => u.ScheduleAssignments)
            .HasForeignKey(sa => sa.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ScheduleAssignment>()
            .HasOne(sa => sa.Schedule)
            .WithMany(s => s.Assignments)
            .HasForeignKey(sa => sa.ScheduleId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Meeting>()
            .HasOne(m => m.CreatedBy)
            .WithMany()
            .HasForeignKey(m => m.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<MeetingParticipant>()
            .HasOne(mp => mp.User)
            .WithMany(u => u.MeetingParticipants)
            .HasForeignKey(mp => mp.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MeetingParticipant>()
            .HasOne(mp => mp.Meeting)
            .WithMany(m => m.Participants)
            .HasForeignKey(mp => mp.MeetingId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<LeaveRequest>()
            .HasOne(l => l.User)
            .WithMany(u => u.LeaveRequests)
            .HasForeignKey(l => l.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<LeaveRequest>()
            .HasOne(l => l.ReviewedBy)
            .WithMany()
            .HasForeignKey(l => l.ReviewedById)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Reminder>()
            .HasOne(r => r.User)
            .WithMany(u => u.Reminders)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Reminder>()
            .HasOne(r => r.CreatedBy)
            .WithMany()
            .HasForeignKey(r => r.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CompanyEvent>()
            .HasOne(e => e.CreatedBy)
            .WithMany()
            .HasForeignKey(e => e.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Announcement>()
            .HasOne(a => a.CreatedBy)
            .WithMany()
            .HasForeignKey(a => a.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Notification>()
            .HasOne(n => n.User)
            .WithMany()
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ExternalParticipant>()
            .HasOne(e => e.Meeting)
            .WithMany(m => m.ExternalParticipants)
            .HasForeignKey(e => e.MeetingId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Project>()
            .HasOne(p => p.Owner).WithMany().HasForeignKey(p => p.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<ProjectMember>()
            .HasOne(pm => pm.Project).WithMany(p => p.Members).HasForeignKey(pm => pm.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<ProjectMember>()
            .HasOne(pm => pm.User).WithMany().HasForeignKey(pm => pm.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<ProjectTask>()
            .HasOne(t => t.Project).WithMany(p => p.Tasks).HasForeignKey(t => t.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<ProjectTask>()
            .HasOne(t => t.Assignee).WithMany().HasForeignKey(t => t.AssigneeId)
            .OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<ProjectTask>()
            .HasOne(t => t.CreatedBy).WithMany().HasForeignKey(t => t.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<ProjectDiscussion>()
            .HasOne(d => d.Project).WithMany(p => p.Discussions).HasForeignKey(d => d.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<ProjectDiscussion>()
            .HasOne(d => d.Author).WithMany().HasForeignKey(d => d.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<ProjectDiscussion>()
            .HasOne(d => d.Parent).WithMany(d => d.Replies).HasForeignKey(d => d.ParentId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<ProjectNote>()
            .HasOne(n => n.Project).WithMany(p => p.Notes).HasForeignKey(n => n.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<ProjectNote>()
            .HasOne(n => n.Author).WithMany().HasForeignKey(n => n.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ExternalParticipant>()
            .HasOne(e => e.CompanyEvent)
            .WithMany(c => c.ExternalParticipants)
            .HasForeignKey(e => e.CompanyEventId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ExternalParticipant>()
            .HasOne(e => e.Reminder)
            .WithMany(r => r.ExternalParticipants)
            .HasForeignKey(e => e.ReminderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ReportShare>()
            .HasKey(rs => new { rs.ReportId, rs.UserId });

        modelBuilder.Entity<Report>()
            .HasOne(r => r.Department).WithMany().HasForeignKey(r => r.DepartmentId)
            .OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<Report>()
            .HasOne(r => r.CreatedBy).WithMany().HasForeignKey(r => r.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Report>()
            .HasOne(r => r.ReviewedBy).WithMany().HasForeignKey(r => r.ReviewedById)
            .OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<ReportShare>()
            .HasOne(rs => rs.Report).WithMany(r => r.Shares).HasForeignKey(rs => rs.ReportId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<ReportShare>()
            .HasOne(rs => rs.User).WithMany().HasForeignKey(rs => rs.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<ReportComment>()
            .HasOne(c => c.Report).WithMany(r => r.Comments).HasForeignKey(c => c.ReportId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<ReportComment>()
            .HasOne(c => c.Author).WithMany().HasForeignKey(c => c.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<ReportAttachment>()
            .HasOne(a => a.Report).WithMany(r => r.Attachments).HasForeignKey(a => a.ReportId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<ReportAttachment>()
            .HasOne(a => a.UploadedBy).WithMany().HasForeignKey(a => a.UploadedById)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<ReportVersion>()
            .HasOne(v => v.Report).WithMany(r => r.Versions).HasForeignKey(v => v.ReportId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<ReportVersion>()
            .HasOne(v => v.EditedBy).WithMany().HasForeignKey(v => v.EditedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
