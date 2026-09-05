namespace CompanyCalendar.Api.Services;

public interface IReportFileStorageService
{
    string[] AllowedExtensions { get; }
    long MaxFileSizeBytes { get; }
    Task<(string StoragePath, long SizeBytes)> SaveAsync(int reportId, IFormFile file);
    void Delete(string storagePath);
    Stream OpenRead(string storagePath);
}

public class ReportFileStorageService(IWebHostEnvironment env) : IReportFileStorageService
{
    public string[] AllowedExtensions { get; } =
        [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".png", ".jpg", ".jpeg", ".txt", ".csv"];

    public long MaxFileSizeBytes { get; } = 10 * 1024 * 1024;

    private string RootPath => Path.Combine(env.ContentRootPath, "App_Data", "ReportUploads");

    public async Task<(string StoragePath, long SizeBytes)> SaveAsync(int reportId, IFormFile file)
    {
        var extension = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
            throw new InvalidOperationException($"File type '{extension}' is not allowed.");
        if (file.Length > MaxFileSizeBytes)
            throw new InvalidOperationException("File exceeds the 10 MB size limit.");

        var reportDir = Path.Combine(RootPath, reportId.ToString());
        Directory.CreateDirectory(reportDir);

        var safeName = Path.GetFileName(file.FileName);
        var storedFileName = $"{Guid.NewGuid():N}_{safeName}";
        var fullPath = Path.Combine(reportDir, storedFileName);

        await using (var stream = new FileStream(fullPath, FileMode.Create))
            await file.CopyToAsync(stream);

        var relativePath = Path.Combine(reportId.ToString(), storedFileName);
        return (relativePath, file.Length);
    }

    public void Delete(string storagePath)
    {
        var fullPath = Path.Combine(RootPath, storagePath);
        if (File.Exists(fullPath)) File.Delete(fullPath);
    }

    public Stream OpenRead(string storagePath)
    {
        var fullPath = Path.Combine(RootPath, storagePath);
        return new FileStream(fullPath, FileMode.Open, FileAccess.Read);
    }
}
