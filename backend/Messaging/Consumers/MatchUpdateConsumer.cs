using System.Text;
using JogosUnisanta.API.Messaging.Messages;
using JogosUnisanta.API.Models;
using JogosUnisanta.API.Services;
using Newtonsoft.Json;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace JogosUnisanta.API.Messaging.Consumers;

public class MatchUpdateConsumer : BackgroundService
{
    private const string ExchangeName = "matches.exchange";
    private const string QueueName = "matches.cache.updates";

    private readonly IConfiguration _config;
    private readonly MatchCacheService _cache;
    private readonly ILogger<MatchUpdateConsumer> _logger;
    private IConnection? _connection;
    private IModel? _channel;

    public MatchUpdateConsumer(IConfiguration config, MatchCacheService cache, ILogger<MatchUpdateConsumer> logger)
    {
        _config = config;
        _cache = cache;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await ConnectAsync(stoppingToken);

        stoppingToken.Register(() =>
        {
            _channel?.Close();
            _connection?.Close();
        });

        await Task.Delay(Timeout.Infinite, stoppingToken);
    }

    private async Task ConnectAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var factory = new ConnectionFactory
                {
                    HostName = _config["RabbitMQ:Host"] ?? "localhost",
                    Port = int.Parse(_config["RabbitMQ:Port"] ?? "5672"),
                    UserName = _config["RabbitMQ:Username"] ?? "guest",
                    Password = _config["RabbitMQ:Password"] ?? "guest",
                    VirtualHost = _config["RabbitMQ:VirtualHost"] ?? "/",
                    DispatchConsumersAsync = true
                };

                _connection = factory.CreateConnection();
                _channel = _connection.CreateModel();

                _channel.ExchangeDeclare(exchange: ExchangeName, type: ExchangeType.Topic, durable: true);
                _channel.QueueDeclare(queue: QueueName, durable: true, exclusive: false, autoDelete: false);
                _channel.QueueBind(queue: QueueName, exchange: ExchangeName, routingKey: "match.*");
                _channel.BasicQos(prefetchSize: 0, prefetchCount: 10, global: false);

                var consumer = new AsyncEventingBasicConsumer(_channel);
                consumer.Received += OnMessageReceived;

                _channel.BasicConsume(queue: QueueName, autoAck: false, consumer: consumer);

                _logger.LogInformation("MatchUpdateConsumer conectado ao RabbitMQ.");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Falha ao conectar ao RabbitMQ: {Message}. Tentando novamente em 5s...", ex.Message);
                await Task.Delay(5000, stoppingToken);
            }
        }
    }

    private async Task OnMessageReceived(object sender, BasicDeliverEventArgs args)
    {
        try
        {
            var json = Encoding.UTF8.GetString(args.Body.ToArray());
            var message = JsonConvert.DeserializeObject<MatchUpdateMessage>(json);

            if (message == null)
            {
                _channel!.BasicNack(args.DeliveryTag, false, false);
                return;
            }

            switch (message.Operation)
            {
                case MatchOperation.Created:
                case MatchOperation.Updated:
                    if (message.MatchJson != null)
                    {
                        var match = JsonConvert.DeserializeObject<Match>(message.MatchJson);
                        if (match != null) _cache.Upsert(match);
                    }
                    break;

                case MatchOperation.Deleted:
                    _cache.Remove(message.MatchId);
                    break;
            }

            _channel!.BasicAck(args.DeliveryTag, false);
            _logger.LogDebug("Cache atualizado: {Operation} match {MatchId}", message.Operation, message.MatchId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao processar mensagem do RabbitMQ.");
            _channel!.BasicNack(args.DeliveryTag, false, requeue: true);
        }

        await Task.CompletedTask;
    }
}
