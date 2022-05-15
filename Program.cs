using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using WebAngkorLar.Authorization;
using WebAngkorLar.Helpers;
using WebAngkorLar.Services;

var builder = WebApplication.CreateBuilder(args);
{
    var services = builder.Services;
    var env = builder.Environment;
    var connectionString = builder.Configuration.GetConnectionString("WebApiDatabase");
    services.AddDbContext<DataContext>(options =>
        {
            options.UseSqlServer(connectionString);
        }
    );
    

    services.AddCors();
    services.AddControllers().AddJsonOptions(x =>
    {
        // serialize enums as strings in api responses (e.g. Role)
        x.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
    services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
    services.AddSwaggerGen();

    // configure strongly typed settings object
    services.Configure<AppSettings>(builder.Configuration.GetSection("AppSettings"));

    // configure DI for application services
    services.AddScoped<IJwtUtils, JwtUtils>();
    services.AddScoped<IAccountService, AccountService>();
    services.AddScoped<IEmailService, EmailService>();
}
// Add services to the container.

builder.Services.AddControllersWithViews();

var app = builder.Build();
{
    if (!app.Environment.IsDevelopment())
    {
        app.UseExceptionHandler("/Error");
        // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
        app.UseHsts();
    }
    //if (app.Environment.IsDevelopment())
    //{
    //    // generated swagger json and swagger ui middleware
    //    app.UseSwagger();
    //    app.UseSwaggerUI(x => x.SwaggerEndpoint("/swagger/v1/swagger.json", ".NET Sign-up and Verification API"));
    //}
    using (var scope = app.Services.CreateScope())
    {
        var dataContext = scope.ServiceProvider.GetRequiredService<DataContext>();
        dataContext.Database.Migrate();
    }
    // global cors policy
    app.UseCors(x => x
        .SetIsOriginAllowed(origin => true)
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials());

    // global error handler
    app.UseMiddleware<ErrorHandlerMiddleware>();

    // custom jwt auth middleware
    app.UseMiddleware<JwtMiddleware>();

    app.UseHttpsRedirection();
    app.UseStaticFiles();
    app.UseRouting();

    app.MapControllers();
    app.MapControllerRoute(
    name: "default",
    pattern: "{controller}/{action=Index}/{id?}");

    //app.MapFallbackToFile("index.html");
}
app.MapFallbackToFile("index.html");
app.Run();
