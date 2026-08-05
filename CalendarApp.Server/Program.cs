var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

// This service only hosts the built frontend. All data goes straight from the
// browser to Supabase (see frontend/src/store.ts), so there is no database
// access, no controllers and no views here.
// Aspire copies the Vite build output into wwwroot on publish
// (see PublishWithContainerFiles in CalendarApp.AppHost/AppHost.cs).
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapDefaultEndpoints();

// Serve index.html for unmatched routes so client-side routing keeps working
// on a hard refresh of e.g. /day/2026-08-05.
app.MapFallbackToFile("index.html");

app.Run();
