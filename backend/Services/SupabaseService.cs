using JogosUnisanta.API.Models;

namespace JogosUnisanta.API.Services;

public class SupabaseService
{
    private readonly Supabase.Client _client;
    private readonly ILogger<SupabaseService> _logger;

    public SupabaseService(IConfiguration config, ILogger<SupabaseService> logger)
    {
        _logger = logger;
        var url = config["Supabase:Url"] ?? throw new InvalidOperationException("Supabase:Url não configurado.");
        var key = config["Supabase:Key"] ?? throw new InvalidOperationException("Supabase:Key não configurado.");

        _client = new Supabase.Client(url, key, new Supabase.SupabaseOptions
        {
            AutoConnectRealtime = false
        });
    }

    public async Task InitializeAsync() => await _client.InitializeAsync();

    // ── Matches ──────────────────────────────────────────────────────────────

    public async Task<List<Match>> GetMatchesAsync()
    {
        var result = await _client.From<Match>().Get();
        return result.Models;
    }

    public async Task<Match> InsertMatchAsync(Match match)
    {
        var result = await _client.From<Match>().Insert(match);
        return result.Models.First();
    }

    public async Task<Match> UpdateMatchAsync(Match match)
    {
        var result = await _client.From<Match>().Update(match);
        return result.Models.First();
    }

    public async Task DeleteMatchAsync(string id)
    {
        await _client.From<Match>().Where(m => m.Id == id).Delete();
    }
}
