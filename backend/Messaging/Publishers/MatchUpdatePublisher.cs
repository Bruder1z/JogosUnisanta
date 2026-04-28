using System.Text;
using JogosUnisanta.API.Messaging.Messages;
using Newtonsoft.Json;
using RabbitMQ.Client;

namespace JogosUnisanta.API.Messaging.Publishers;

public class MatchUpdatePublisher : IDisposable
{
    private const string ExchangeName = "matches.exchange";
    private readonly IConnection _connection;
    private readonly IModel _channel;
    private readonly ILogger<MatchUpdatePublisher> _logger;

    public MatchUpdatePublisher(IConfiguration config, ILogger<MatchUpdatePublisher> logger)
    {
        _logger = logger;

        var factory = new ConnectionFactory
        {
            HostName = config["RabbitMQ:Host"] ?? "localhost",
            Port = int.Parse(config["RabbitMQ:Port"] ?? "5672"),
            UserName = config["RabbitMQ:Username"] ?? "guest",
            Password = config["RabbitMQ:Password"] ?? "guest",
            VirtualHost = config["RabbitMQ:VirtualHost"] ?? "/"
        };

        _connection = factory.CreateConnection();
        _channel = _connection.CreateModel();

        _channel.ExchangeDeclare(exchange: ExchangeName, type: ExchangeType.Topic, durable: true);
    }

    public void Publish(MatchUpdateMessage message)
    {
        var routingKey = message.Operation switch
        {
            MatchOperation.Created => "match.created",
            MatchOperation.Updated => "match.updated",
            MatchOperation.Deleted => "match.deleted",
            _ => "match.unknown"
        };

        var body = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(message));

        var props = _channel.CreateBasicProperties();
        props.Persistent = true;
        props.ContentType = "application/json";

        _channel.BasicPublish(
            exchange: ExchangeName,
            routingKey: routingKey,
            basicProperties: props,
            body: body
        );

        _logger.LogInformation("Published {Operation} for match {MatchId}", message.Operation, message.MatchId);
    }

    public void Dispose()
    {
        _channel?.Close();
        _connection?.Close();
    }
}
