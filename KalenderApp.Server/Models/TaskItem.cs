namespace KalenderApp.Server.Models;

public class TaskItem
{
    public int Id { get; set; }
    public DateOnly Date { get; set; }
    public string Text { get; set; } = "";
    public bool IsCompleted { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
