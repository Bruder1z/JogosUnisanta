using JogosUnisanta.API.Messaging.Messages;
using JogosUnisanta.API.Messaging.Publishers;
using JogosUnisanta.API.Models;
using JogosUnisanta.API.Services;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;

namespace JogosUnisanta.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MatchesController : ControllerBase
{
    private readonly MatchCacheService _cache;
    private readonly SupabaseService _supabase;
    private readonly MatchUpdatePublisher _publisher;

    public MatchesController(MatchCacheService cache, SupabaseService supabase, MatchUpdatePublisher publisher)
    {
        _cache = cache;
        _supabase = supabase;
        _publisher = publisher;
    }

    // GET /api/matches  – servido direto do cache (hot path do polling)
    [HttpGet]
    public IActionResult GetAll([FromQuery] string? sport, [FromQuery] string? status)
    {
        var matches = _cache.GetAll();

        if (!string.IsNullOrEmpty(sport))
            matches = matches.Where(m => m.Sport.Equals(sport, StringComparison.OrdinalIgnoreCase)).ToList();

        if (!string.IsNullOrEmpty(status))
            matches = matches.Where(m => m.Status.Equals(status, StringComparison.OrdinalIgnoreCase)).ToList();

        return Ok(matches);
    }

    // GET /api/matches/{id}
    [HttpGet("{id}")]
    public IActionResult GetById(string id)
    {
        var match = _cache.GetById(id);
        return match is null ? NotFound() : Ok(match);
    }

    // POST /api/matches
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Match match)
    {
        if (string.IsNullOrEmpty(match.Id))
            match.Id = Guid.NewGuid().ToString();

        var created = await _supabase.InsertMatchAsync(match);
        _cache.Upsert(created);

        _publisher.Publish(new MatchUpdateMessage
        {
            Operation = MatchOperation.Created,
            MatchId = created.Id,
            MatchJson = JsonConvert.SerializeObject(created)
        });

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    // PUT /api/matches/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] Match match)
    {
        match.Id = id;

        var updated = await _supabase.UpdateMatchAsync(match);
        _cache.Upsert(updated);

        _publisher.Publish(new MatchUpdateMessage
        {
            Operation = MatchOperation.Updated,
            MatchId = updated.Id,
            MatchJson = JsonConvert.SerializeObject(updated)
        });

        return Ok(updated);
    }

    // DELETE /api/matches/scheduled
    [HttpDelete("scheduled")]
    public async Task<IActionResult> DeleteScheduled()
    {
        var scheduled = _cache.GetAll().Where(m => m.Status == "scheduled").ToList();
        foreach (var m in scheduled)
        {
            await _supabase.DeleteMatchAsync(m.Id);
            _cache.Remove(m.Id);
            _publisher.Publish(new MatchUpdateMessage { Operation = MatchOperation.Deleted, MatchId = m.Id });
        }
        return NoContent();
    }

    // DELETE /api/matches/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        await _supabase.DeleteMatchAsync(id);
        _cache.Remove(id);

        _publisher.Publish(new MatchUpdateMessage
        {
            Operation = MatchOperation.Deleted,
            MatchId = id
        });

        return NoContent();
    }
}
