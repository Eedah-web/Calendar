using KalenderApp.Server.Data;
using KalenderApp.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace KalenderApp.Server.Services;

public class TaskService
{
    private readonly AppDbContext _db;

    public TaskService(AppDbContext db) => _db = db;

    public async Task<List<TaskItem>> GetTasksForDateAsync(DateOnly date) =>
        await _db.Tasks
            .Where(t => t.Date == date)
            .OrderBy(t => t.Id)
            .ToListAsync();

    public async Task<List<TaskItem>> GetTasksForRangeAsync(DateOnly start, DateOnly end) =>
        await _db.Tasks
            .Where(t => t.Date >= start && t.Date <= end)
            .OrderBy(t => t.Id)
            .ToListAsync();

    public async Task<TaskItem> AddTaskAsync(DateOnly date, string text)
    {
        var task = new TaskItem { Date = date, Text = text };
        _db.Tasks.Add(task);
        await _db.SaveChangesAsync();
        return task;
    }

    public async Task ToggleTaskAsync(int id)
    {
        var task = await _db.Tasks.FindAsync(id);
        if (task is null) return;
        task.IsCompleted = !task.IsCompleted;
        await _db.SaveChangesAsync();
    }

    public async Task DeleteTaskAsync(int id)
    {
        var task = await _db.Tasks.FindAsync(id);
        if (task is null) return;
        _db.Tasks.Remove(task);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateTaskAsync(int id, string text)
    {
        var task = await _db.Tasks.FindAsync(id);
        if (task is null) return;
        task.Text = text;
        await _db.SaveChangesAsync();
    }

    public async Task ClearCompletedAsync(DateOnly date) =>
        await _db.Tasks
            .Where(t => t.Date == date && t.IsCompleted)
            .ExecuteDeleteAsync();
}
