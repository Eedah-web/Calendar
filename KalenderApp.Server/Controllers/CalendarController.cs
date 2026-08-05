using KalenderApp.Server.Services;
using KalenderApp.Server.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace KalenderApp.Server.Controllers;

public class CalendarController : Controller
{
    private readonly TaskService _taskService;

    public CalendarController(TaskService taskService) => _taskService = taskService;

    public async Task<IActionResult> Index(int? year, int? month)
    {
        var today = DateTime.Today;
        var y = year ?? today.Year;
        var m = month ?? today.Month;

        var (start, end) = CalendarViewModel.GetVisibleRange(y, m);
        var tasks = await _taskService.GetTasksForRangeAsync(start, end);
        return View(new CalendarViewModel(y, m, tasks));
    }

    [HttpGet]
    public async Task<IActionResult> GetDay(string date)
    {
        if (!DateOnly.TryParse(date, out var d)) return BadRequest();
        return PartialView("_TaskPanel", await BuildPanelAsync(d));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> AddTask(string date, string text)
    {
        if (!DateOnly.TryParse(date, out var d) || string.IsNullOrWhiteSpace(text))
            return BadRequest();
        await _taskService.AddTaskAsync(d, text.Trim());
        return PartialView("_TaskPanel", await BuildPanelAsync(d));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> ToggleTask(int id, string date)
    {
        if (!DateOnly.TryParse(date, out var d)) return BadRequest();
        await _taskService.ToggleTaskAsync(id);
        return PartialView("_TaskPanel", await BuildPanelAsync(d));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteTask(int id, string date)
    {
        if (!DateOnly.TryParse(date, out var d)) return BadRequest();
        await _taskService.DeleteTaskAsync(id);
        return PartialView("_TaskPanel", await BuildPanelAsync(d));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> UpdateTask(int id, string text, string date)
    {
        if (!DateOnly.TryParse(date, out var d)) return BadRequest();
        if (!string.IsNullOrWhiteSpace(text))
            await _taskService.UpdateTaskAsync(id, text.Trim());
        return PartialView("_TaskPanel", await BuildPanelAsync(d));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> ClearCompleted(string date)
    {
        if (!DateOnly.TryParse(date, out var d)) return BadRequest();
        await _taskService.ClearCompletedAsync(d);
        return PartialView("_TaskPanel", await BuildPanelAsync(d));
    }

    private async Task<TaskPanelViewModel> BuildPanelAsync(DateOnly date) => new()
    {
        Date = date,
        Tasks = await _taskService.GetTasksForDateAsync(date)
    };
}
