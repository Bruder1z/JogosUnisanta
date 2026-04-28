namespace JogosUnisanta.API.Messaging.Messages;

public enum MatchOperation { Created, Updated, Deleted }

public class MatchUpdateMessage
{
    public MatchOperation Operation { get; set; }
    public string MatchId { get; set; } = string.Empty;
    public string? MatchJson { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
