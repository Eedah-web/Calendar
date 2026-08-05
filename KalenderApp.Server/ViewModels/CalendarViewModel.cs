using System.Globalization;
using KalenderApp.Server.Models;

namespace KalenderApp.Server.ViewModels;

public class CalendarViewModel
{
    public int Year { get; }
    public int Month { get; }
    public string MonthLabel { get; }
    public (int Year, int Month) PrevMonth { get; }
    public (int Year, int Month) NextMonth { get; }
    public List<CalendarDay> Days { get; }

    public CalendarViewModel(int year, int month, IReadOnlyList<TaskItem> tasks)
    {
        Year = year;
        Month = month;

        var firstDay = new DateOnly(year, month, 1);
        MonthLabel = firstDay.ToString("MMMM yyyy", new CultureInfo("sv-SE"));

        var prev = firstDay.AddMonths(-1);
        var next = firstDay.AddMonths(1);
        PrevMonth = (prev.Year, prev.Month);
        NextMonth = (next.Year, next.Month);

        var (startDate, _) = GetVisibleRange(year, month);

        var byDate = tasks
            .GroupBy(t => t.Date)
            .ToDictionary(g => g.Key, g => g.OrderBy(t => t.Id).ToList());

        Days = Enumerable.Range(0, 42).Select(i =>
        {
            var date = startDate.AddDays(i);
            return new CalendarDay
            {
                Date = date,
                IsCurrentMonth = date.Month == month,
                IsToday = date == DateOnly.FromDateTime(DateTime.Today),
                Tasks = byDate.TryGetValue(date, out var list) ? list : []
            };
        }).ToList();
    }

    // The 42-day (6 weeks) grid shown for a given month, starting on the Monday
    // of the week that contains the 1st. Used to load all tasks in one query.
    public static (DateOnly Start, DateOnly End) GetVisibleRange(int year, int month)
    {
        var firstDay = new DateOnly(year, month, 1);
        var startOffset = ((int)firstDay.DayOfWeek + 6) % 7; // Monday = 0
        var startDate = firstDay.AddDays(-startOffset);
        return (startDate, startDate.AddDays(41));
    }
}

public class CalendarDay
{
    public DateOnly Date { get; set; }
    public bool IsCurrentMonth { get; set; }
    public bool IsToday { get; set; }
    public List<TaskItem> Tasks { get; set; } = [];
    public int TotalTasks => Tasks.Count;
    public int CompletedTasks => Tasks.Count(t => t.IsCompleted);
}

public class TaskPanelViewModel
{
    public DateOnly Date { get; set; }
    public List<TaskItem> Tasks { get; set; } = [];
    public int CompletedCount => Tasks.Count(t => t.IsCompleted);
    public string DateLabel =>
        Date.ToString("dddd d MMMM yyyy", new CultureInfo("sv-SE"));
}
