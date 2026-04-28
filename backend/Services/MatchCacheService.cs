using System.Collections.Concurrent;
using JogosUnisanta.API.Models;

namespace JogosUnisanta.API.Services;

public class MatchCacheService
{
    private readonly ConcurrentDictionary<string, Match> _cache = new();

    public IReadOnlyList<Match> GetAll() =>
        _cache.Values.OrderBy(m => m.Date).ThenBy(m => m.Time).ToList();

    public Match? GetById(string id) =>
        _cache.TryGetValue(id, out var match) ? match : null;

    public void Seed(IEnumerable<Match> matches)
    {
        _cache.Clear();
        foreach (var m in matches)
            _cache[m.Id] = m;
    }

    public void Upsert(Match match) =>
        _cache[match.Id] = match;

    public void Remove(string id) =>
        _cache.TryRemove(id, out _);
}
