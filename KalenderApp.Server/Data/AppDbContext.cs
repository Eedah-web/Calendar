using KalenderApp.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace KalenderApp.Server.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<TaskItem> Tasks => Set<TaskItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TaskItem>(e =>
        {
            e.ToTable("tasks");
            e.HasKey(t => t.Id);
            e.Property(t => t.Id).HasColumnName("id");
            e.Property(t => t.Date).HasColumnName("date");
            e.Property(t => t.Text).HasColumnName("text").IsRequired();
            e.Property(t => t.IsCompleted).HasColumnName("is_completed");
            e.Property(t => t.CreatedAt).HasColumnName("created_at");

            e.HasIndex(t => t.Date);
        });
    }
}
