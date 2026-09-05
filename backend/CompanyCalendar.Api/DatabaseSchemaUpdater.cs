using CompanyCalendar.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace CompanyCalendar.Api;

public static class DatabaseSchemaUpdater
{
    public static async Task ApplyAsync(ApplicationDbContext db)
    {
        await db.Database.EnsureCreatedAsync();

        if (db.Database.IsSqlite())
        {
            await db.Database.ExecuteSqlRawAsync("""
                CREATE TABLE IF NOT EXISTS Projects (Id INTEGER PRIMARY KEY AUTOINCREMENT, Name TEXT NOT NULL, Description TEXT NULL, OwnerId INTEGER NOT NULL, StartDate TEXT NULL, DueDate TEXT NULL, Status INTEGER NOT NULL DEFAULT 0, CreatedAt TEXT NOT NULL, FOREIGN KEY (OwnerId) REFERENCES Users(Id) ON DELETE RESTRICT);
                CREATE TABLE IF NOT EXISTS ProjectMembers (ProjectId INTEGER NOT NULL, UserId INTEGER NOT NULL, PRIMARY KEY (ProjectId, UserId), FOREIGN KEY (ProjectId) REFERENCES Projects(Id) ON DELETE CASCADE, FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE);
                CREATE TABLE IF NOT EXISTS ProjectTasks (Id INTEGER PRIMARY KEY AUTOINCREMENT, ProjectId INTEGER NOT NULL, Title TEXT NOT NULL, Description TEXT NULL, AssigneeId INTEGER NULL, DueDate TEXT NULL, Priority INTEGER NOT NULL DEFAULT 1, Status INTEGER NOT NULL DEFAULT 0, CreatedById INTEGER NOT NULL, CreatedAt TEXT NOT NULL, FOREIGN KEY (ProjectId) REFERENCES Projects(Id) ON DELETE CASCADE, FOREIGN KEY (AssigneeId) REFERENCES Users(Id) ON DELETE SET NULL, FOREIGN KEY (CreatedById) REFERENCES Users(Id) ON DELETE RESTRICT);
                CREATE TABLE IF NOT EXISTS ProjectDiscussions (Id INTEGER PRIMARY KEY AUTOINCREMENT, ProjectId INTEGER NOT NULL, AuthorId INTEGER NOT NULL, Content TEXT NOT NULL, ParentId INTEGER NULL, CreatedAt TEXT NOT NULL, FOREIGN KEY (ProjectId) REFERENCES Projects(Id) ON DELETE CASCADE, FOREIGN KEY (AuthorId) REFERENCES Users(Id) ON DELETE RESTRICT, FOREIGN KEY (ParentId) REFERENCES ProjectDiscussions(Id) ON DELETE CASCADE);
                CREATE TABLE IF NOT EXISTS ProjectNotes (Id INTEGER PRIMARY KEY AUTOINCREMENT, ProjectId INTEGER NOT NULL, AuthorId INTEGER NOT NULL, Content TEXT NOT NULL, CreatedAt TEXT NOT NULL, FOREIGN KEY (ProjectId) REFERENCES Projects(Id) ON DELETE CASCADE, FOREIGN KEY (AuthorId) REFERENCES Users(Id) ON DELETE RESTRICT);
                CREATE TABLE IF NOT EXISTS Reports (Id INTEGER PRIMARY KEY AUTOINCREMENT, Title TEXT NOT NULL, Content TEXT NOT NULL, Status INTEGER NOT NULL DEFAULT 0, DepartmentId INTEGER NULL, CreatedById INTEGER NOT NULL, CreatedAt TEXT NOT NULL, UpdatedAt TEXT NOT NULL, SubmittedAt TEXT NULL, ReviewedById INTEGER NULL, ReviewedAt TEXT NULL, ReviewNotes TEXT NULL, FOREIGN KEY (DepartmentId) REFERENCES Departments(Id) ON DELETE SET NULL, FOREIGN KEY (CreatedById) REFERENCES Users(Id) ON DELETE RESTRICT, FOREIGN KEY (ReviewedById) REFERENCES Users(Id) ON DELETE SET NULL);
                CREATE TABLE IF NOT EXISTS ReportShares (ReportId INTEGER NOT NULL, UserId INTEGER NOT NULL, SharedAt TEXT NOT NULL, PRIMARY KEY (ReportId, UserId), FOREIGN KEY (ReportId) REFERENCES Reports(Id) ON DELETE CASCADE, FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE);
                CREATE TABLE IF NOT EXISTS ReportComments (Id INTEGER PRIMARY KEY AUTOINCREMENT, ReportId INTEGER NOT NULL, AuthorId INTEGER NOT NULL, Content TEXT NOT NULL, CreatedAt TEXT NOT NULL, FOREIGN KEY (ReportId) REFERENCES Reports(Id) ON DELETE CASCADE, FOREIGN KEY (AuthorId) REFERENCES Users(Id) ON DELETE RESTRICT);
                CREATE TABLE IF NOT EXISTS ReportAttachments (Id INTEGER PRIMARY KEY AUTOINCREMENT, ReportId INTEGER NOT NULL, FileName TEXT NOT NULL, ContentType TEXT NOT NULL, FileSizeBytes INTEGER NOT NULL, StoragePath TEXT NOT NULL, UploadedById INTEGER NOT NULL, UploadedAt TEXT NOT NULL, FOREIGN KEY (ReportId) REFERENCES Reports(Id) ON DELETE CASCADE, FOREIGN KEY (UploadedById) REFERENCES Users(Id) ON DELETE RESTRICT);
                CREATE TABLE IF NOT EXISTS ReportVersions (Id INTEGER PRIMARY KEY AUTOINCREMENT, ReportId INTEGER NOT NULL, Title TEXT NOT NULL, Content TEXT NOT NULL, Status INTEGER NOT NULL, EditedById INTEGER NOT NULL, EditedAt TEXT NOT NULL, FOREIGN KEY (ReportId) REFERENCES Reports(Id) ON DELETE CASCADE, FOREIGN KEY (EditedById) REFERENCES Users(Id) ON DELETE RESTRICT);
                """);
            return;
        }

        if (!db.Database.IsSqlServer()) return;

        var sql = """
            IF OBJECT_ID(N'ExternalParticipants', N'U') IS NULL
            BEGIN
                CREATE TABLE ExternalParticipants (
                    Id INT IDENTITY(1,1) PRIMARY KEY,
                    Name NVARCHAR(200) NOT NULL,
                    Organization NVARCHAR(200) NOT NULL DEFAULT '',
                    Email NVARCHAR(200) NOT NULL,
                    Phone NVARCHAR(50) NULL,
                    MeetingId INT NULL,
                    CompanyEventId INT NULL,
                    ReminderId INT NULL,
                    CONSTRAINT FK_ExternalParticipants_Meetings FOREIGN KEY (MeetingId) REFERENCES Meetings(Id) ON DELETE CASCADE,
                    CONSTRAINT FK_ExternalParticipants_Events FOREIGN KEY (CompanyEventId) REFERENCES [Events](Id) ON DELETE CASCADE,
                    CONSTRAINT FK_ExternalParticipants_Reminders FOREIGN KEY (ReminderId) REFERENCES Reminders(Id) ON DELETE CASCADE
                );
            END

            IF COL_LENGTH('Meetings', 'SendEmailNotification') IS NULL
                ALTER TABLE Meetings ADD SendEmailNotification BIT NOT NULL DEFAULT 0;
            IF COL_LENGTH('Meetings', 'ExternalReminderSent') IS NULL
                ALTER TABLE Meetings ADD ExternalReminderSent BIT NOT NULL DEFAULT 0;

            IF COL_LENGTH('Events', 'ReminderTiming') IS NULL
                ALTER TABLE [Events] ADD ReminderTiming INT NULL;
            IF COL_LENGTH('Events', 'SendEmailNotification') IS NULL
                ALTER TABLE [Events] ADD SendEmailNotification BIT NOT NULL DEFAULT 0;
            IF COL_LENGTH('Events', 'ExternalReminderSent') IS NULL
                ALTER TABLE [Events] ADD ExternalReminderSent BIT NOT NULL DEFAULT 0;

            IF COL_LENGTH('Reminders', 'SendEmailNotification') IS NULL
                ALTER TABLE Reminders ADD SendEmailNotification BIT NOT NULL DEFAULT 0;
            IF COL_LENGTH('Reminders', 'ExternalReminderSent') IS NULL
                ALTER TABLE Reminders ADD ExternalReminderSent BIT NOT NULL DEFAULT 0;

            IF OBJECT_ID(N'Projects', N'U') IS NULL
            BEGIN
                CREATE TABLE Projects (Id INT IDENTITY(1,1) PRIMARY KEY, Name NVARCHAR(200) NOT NULL, Description NVARCHAR(MAX) NULL, OwnerId INT NOT NULL, StartDate DATE NULL, DueDate DATE NULL, Status INT NOT NULL DEFAULT 0, CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), CONSTRAINT FK_Projects_Users FOREIGN KEY (OwnerId) REFERENCES Users(Id));
                CREATE TABLE ProjectMembers (ProjectId INT NOT NULL, UserId INT NOT NULL, PRIMARY KEY (ProjectId, UserId), CONSTRAINT FK_ProjectMembers_Projects FOREIGN KEY (ProjectId) REFERENCES Projects(Id) ON DELETE CASCADE, CONSTRAINT FK_ProjectMembers_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE);
                CREATE TABLE ProjectTasks (Id INT IDENTITY(1,1) PRIMARY KEY, ProjectId INT NOT NULL, Title NVARCHAR(200) NOT NULL, Description NVARCHAR(MAX) NULL, AssigneeId INT NULL, DueDate DATE NULL, Priority INT NOT NULL DEFAULT 1, Status INT NOT NULL DEFAULT 0, CreatedById INT NOT NULL, CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), CONSTRAINT FK_ProjectTasks_Projects FOREIGN KEY (ProjectId) REFERENCES Projects(Id) ON DELETE CASCADE, CONSTRAINT FK_ProjectTasks_Assignee FOREIGN KEY (AssigneeId) REFERENCES Users(Id), CONSTRAINT FK_ProjectTasks_Creator FOREIGN KEY (CreatedById) REFERENCES Users(Id));
                CREATE TABLE ProjectDiscussions (Id INT IDENTITY(1,1) PRIMARY KEY, ProjectId INT NOT NULL, AuthorId INT NOT NULL, Content NVARCHAR(MAX) NOT NULL, ParentId INT NULL, CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), CONSTRAINT FK_ProjectDiscussions_Projects FOREIGN KEY (ProjectId) REFERENCES Projects(Id) ON DELETE CASCADE, CONSTRAINT FK_ProjectDiscussions_Authors FOREIGN KEY (AuthorId) REFERENCES Users(Id), CONSTRAINT FK_ProjectDiscussions_Parents FOREIGN KEY (ParentId) REFERENCES ProjectDiscussions(Id) ON DELETE CASCADE);
                CREATE TABLE ProjectNotes (Id INT IDENTITY(1,1) PRIMARY KEY, ProjectId INT NOT NULL, AuthorId INT NOT NULL, Content NVARCHAR(MAX) NOT NULL, CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), CONSTRAINT FK_ProjectNotes_Projects FOREIGN KEY (ProjectId) REFERENCES Projects(Id) ON DELETE CASCADE, CONSTRAINT FK_ProjectNotes_Authors FOREIGN KEY (AuthorId) REFERENCES Users(Id));
            END

            IF OBJECT_ID(N'Reports', N'U') IS NULL
            BEGIN
                CREATE TABLE Reports (Id INT IDENTITY(1,1) PRIMARY KEY, Title NVARCHAR(300) NOT NULL, Content NVARCHAR(MAX) NOT NULL, Status INT NOT NULL DEFAULT 0, DepartmentId INT NULL, CreatedById INT NOT NULL, CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), SubmittedAt DATETIME2 NULL, ReviewedById INT NULL, ReviewedAt DATETIME2 NULL, ReviewNotes NVARCHAR(MAX) NULL, CONSTRAINT FK_Reports_Departments FOREIGN KEY (DepartmentId) REFERENCES Departments(Id) ON DELETE SET NULL, CONSTRAINT FK_Reports_CreatedBy FOREIGN KEY (CreatedById) REFERENCES Users(Id), CONSTRAINT FK_Reports_ReviewedBy FOREIGN KEY (ReviewedById) REFERENCES Users(Id));
                CREATE TABLE ReportShares (ReportId INT NOT NULL, UserId INT NOT NULL, SharedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), PRIMARY KEY (ReportId, UserId), CONSTRAINT FK_ReportShares_Reports FOREIGN KEY (ReportId) REFERENCES Reports(Id) ON DELETE CASCADE, CONSTRAINT FK_ReportShares_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE);
                CREATE TABLE ReportComments (Id INT IDENTITY(1,1) PRIMARY KEY, ReportId INT NOT NULL, AuthorId INT NOT NULL, Content NVARCHAR(MAX) NOT NULL, CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), CONSTRAINT FK_ReportComments_Reports FOREIGN KEY (ReportId) REFERENCES Reports(Id) ON DELETE CASCADE, CONSTRAINT FK_ReportComments_Authors FOREIGN KEY (AuthorId) REFERENCES Users(Id));
                CREATE TABLE ReportAttachments (Id INT IDENTITY(1,1) PRIMARY KEY, ReportId INT NOT NULL, FileName NVARCHAR(300) NOT NULL, ContentType NVARCHAR(150) NOT NULL, FileSizeBytes BIGINT NOT NULL, StoragePath NVARCHAR(500) NOT NULL, UploadedById INT NOT NULL, UploadedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), CONSTRAINT FK_ReportAttachments_Reports FOREIGN KEY (ReportId) REFERENCES Reports(Id) ON DELETE CASCADE, CONSTRAINT FK_ReportAttachments_UploadedBy FOREIGN KEY (UploadedById) REFERENCES Users(Id));
                CREATE TABLE ReportVersions (Id INT IDENTITY(1,1) PRIMARY KEY, ReportId INT NOT NULL, Title NVARCHAR(300) NOT NULL, Content NVARCHAR(MAX) NOT NULL, Status INT NOT NULL, EditedById INT NOT NULL, EditedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), CONSTRAINT FK_ReportVersions_Reports FOREIGN KEY (ReportId) REFERENCES Reports(Id) ON DELETE CASCADE, CONSTRAINT FK_ReportVersions_EditedBy FOREIGN KEY (EditedById) REFERENCES Users(Id));
            END
            """;

        await db.Database.ExecuteSqlRawAsync(sql);
    }
}
