using JogosUnisanta.API.Messaging.Consumers;
using JogosUnisanta.API.Messaging.Publishers;
using JogosUnisanta.API.Services;

var builder = WebApplication.CreateBuilder(args);

// ── CORS ──────────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",  // Vite dev server
                "http://localhost:3000"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// ── Supabase & Cache ──────────────────────────────────────────────────────────
builder.Services.AddSingleton<SupabaseService>();
builder.Services.AddSingleton<MatchCacheService>();

// Aquece o cache com os dados do Supabase antes de receber requisições
builder.Services.AddHostedService<CacheWarmupService>();

// ── RabbitMQ ──────────────────────────────────────────────────────────────────
builder.Services.AddSingleton<MatchUpdatePublisher>();
builder.Services.AddHostedService<MatchUpdateConsumer>();

// ── Controllers & Swagger ─────────────────────────────────────────────────────
builder.Services.AddControllers().AddNewtonsoftJson(options =>
{
    options.SerializerSettings.ContractResolver =
        new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver();
    options.SerializerSettings.NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("FrontendPolicy");
app.UseAuthorization();
app.MapControllers();

app.Run();
