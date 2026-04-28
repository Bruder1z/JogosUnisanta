using Newtonsoft.Json;
using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace JogosUnisanta.API.Models;

[Table("matches")]
public class Match : BaseModel
{
    [PrimaryKey("id", false)]
    public string Id { get; set; } = string.Empty;

    [Column("sport")]
    public string Sport { get; set; } = string.Empty;

    [Column("category")]
    public string Category { get; set; } = string.Empty;

    [Column("team_a_id")]
    public string? TeamAId { get; set; }

    [Column("team_a_name")]
    public string TeamAName { get; set; } = string.Empty;

    [Column("team_a_course")]
    public string? TeamACourse { get; set; }

    [Column("team_a_faculty")]
    public string? TeamAFaculty { get; set; }

    [Column("team_b_id")]
    public string? TeamBId { get; set; }

    [Column("team_b_name")]
    public string TeamBName { get; set; } = string.Empty;

    [Column("team_b_course")]
    public string? TeamBCourse { get; set; }

    [Column("team_b_faculty")]
    public string? TeamBFaculty { get; set; }

    [Column("score_a")]
    public int? ScoreA { get; set; }

    [Column("score_b")]
    public int? ScoreB { get; set; }

    [Column("status")]
    public string Status { get; set; } = "scheduled";

    [Column("stage")]
    public string? Stage { get; set; }

    [Column("date")]
    public string? Date { get; set; }

    [Column("time")]
    public string? Time { get; set; }

    [Column("location")]
    public string? Location { get; set; }

    [Column("events")]
    public object? Events { get; set; }

    [Column("participants")]
    public object? Participants { get; set; }

    [Column("mvp_voting_started_at")]
    public string? MvpVotingStartedAt { get; set; }

    [Column("created_at")]
    public string? CreatedAt { get; set; }
}
