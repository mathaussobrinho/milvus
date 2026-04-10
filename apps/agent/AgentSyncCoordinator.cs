using System.Threading.Channels;

namespace VisoHelp.Agent;

public sealed class AgentSyncCoordinator
{
    private readonly Channel<bool> _channel = Channel.CreateUnbounded<bool>(new UnboundedChannelOptions
    {
        SingleReader = true,
        SingleWriter = false
    });

    public ChannelReader<bool> Reader => _channel.Reader;

    public ValueTask RequestSyncNowAsync(CancellationToken cancellationToken = default) =>
        _channel.Writer.WriteAsync(true, cancellationToken);
}
