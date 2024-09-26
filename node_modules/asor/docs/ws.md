# WebSocket

The `@ws` directive in asor.js enables real-time, full-duplex communication between the client and server using WebSockets. This is ideal for scenarios requiring instant data exchange and live updates.

## Syntax

<element @ws[.modifier]="url">Initial Content</element>

- `url`: The WebSocket server URL to connect to.
- `modifier` (optional): Additional behaviors for the WebSocket connection.

## Basic Usage

Here's a simple example of how to use the `@ws` directive:

```html
<div @ws="wss://example.com/socket">Waiting for real-time updates...</div>
```

This div will establish a WebSocket connection to the specified URL and update its content based on received messages.

## Modifiers

### .reconnect

The `.reconnect` modifier attempts to reconnect automatically if the connection is lost:

```html
<div @ws.reconnect="wss://example.com/socket">
  Connection will be maintained automatically.
</div>
```

### .json

The `.json` modifier automatically parses incoming messages as JSON:

```html
<div @ws.json="wss://example.com/socket">
  Received JSON data will be processed here.
</div>
```

## Advanced Usage

### Sending Messages

You can send messages to the server using the `@ws:send` directive:

```html
<div @ws="wss://example.com/chat">
  <input type="text" @ws:send />
  <button @ws:send="sendMessage">Send</button>
</div>
```

### Custom Event Handling

You can handle specific WebSocket events:

```html
<div
  @ws="wss://example.com/socket"
  @ws:open="handleOpen"
  @ws:message="handleMessage"
  @ws:close="handleClose"
  @ws:error="handleError"
>
  <!-- WebSocket content and events will be handled here -->
</div>
```

### Combining with other directives

You can combine `@ws` with other asor.js directives for more complex behavior:

```html
<div
  @ws="wss://example.com/live-updates"
  @loading.class="is-connecting"
  @transition
>
  <h3>Live Updates</h3>
  <!-- Live content will be updated here -->
</div>
```

This example will show a loading indicator while connecting to the WebSocket and apply a transition effect when new content arrives.

## Important Notes

- Ensure your server supports WebSocket connections for the `@ws` directive to work.
- WebSockets provide full-duplex communication, allowing both the client and server to send messages at any time.
- Be mindful of connection limits and server resources when using WebSockets with many concurrent clients.
- Consider implementing a fallback mechanism (like long-polling) for environments where WebSockets are not supported or blocked.
- Security considerations: Use WSS (WebSocket Secure) for encrypted connections, especially when dealing with sensitive data.

By leveraging the `@ws` directive, you can create highly interactive, real-time applications with seamless bidirectional communication between the client and server.
