namespace JogosUnisanta.API.Services;

public class CacheWarmupService : IHostedService
{
    private readonly SupabaseService _supabase;
    private readonly MatchCacheService _cache;
    private readonly ILogger<CacheWarmupService> _logger;

    public CacheWarmupService(SupabaseService supabase, MatchCacheService cache, ILogger<CacheWarmupService> logger)
    {
        _supabase = supabase;
        _cache = cache;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        try
        {
            await _supabase.InitializeAsync();
            var matches = await _supabase.GetMatchesAsync();
            _cache.Seed(matches);
            _logger.LogInformation("Cache aquecido com {Count} partidas.", matches.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao aquecer o cache de partidas.");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
