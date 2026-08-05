using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace KalenderApp.Server.Data;

// Used by "dotnet ef" at design time (e.g. when creating migrations) so it can
// build an AppDbContext without starting the whole web app.
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var config = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddUserSecrets<AppDbContextFactory>(optional: true)
            .AddEnvironmentVariables()
            .Build();

        // Falls back to a dummy host so "dotnet ef migrations add" works even
        // before the real connection string is configured (migrations don't connect).
        var connectionString = config.GetConnectionString("Supabase")
            ?? "Host=localhost;Port=5432;Database=postgres;Username=postgres;Password=postgres";

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new AppDbContext(options);
    }
}
