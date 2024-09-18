# Polling

The `@poll` directive in asor.js allows you to automatically refresh content at specified intervals. This is particularly useful for displaying real-time or frequently updated information without requiring the user to manually refresh the page.

## Syntax

```html
<element @poll[.interval]="url"></element>
```

- `element`: Any HTML element that can receive content updates.
- `interval` (optional): The time between requests. If omitted, defaults to 2000ms (2 seconds).
- `url`: The endpoint URL to which the request will be sent.

## Interval Options

| Interval | Description                                     | Example                                |
| -------- | ----------------------------------------------- | -------------------------------------- |
| 2s       | Poll every 2 seconds (default if not specified) | <div @poll="/api/updates"></div>       |
| 5s       | Poll every 5 seconds                            | <div @poll.5s="/api/updates"></div>    |
| 10s      | Poll every 10 seconds                           | <div @poll.10s="/api/updates"></div>   |
| 30s      | Poll every 30 seconds                           | <div @poll.30s="/api/updates"></div>   |
| 1m       | Poll every 1 minute                             | <div @poll.1m="/api/updates"></div>    |
| 5m       | Poll every 5 minutes                            | <div @poll.5m="/api/updates"></div>    |
| 500ms    | Poll every 500 milliseconds                     | <div @poll.500ms="/api/updates"></div> |

## Basic Usage

Here's a simple example of how to use the `@poll` directive:

```html
<div @poll.5s="/api/live-data">
  <!-- Initial content, will be updated every 5 seconds -->
</div>
```

Normally, this component would show the subscriber count for the user and never update until the page was refreshed. However, because of `@poll` on the component's template, this component will now refresh itself every `2.5` seconds, keeping the subscriber count up-to-date. You can also specify an action to fire on the polling interval by passing a value to `@poll`:

```html
<div @poll="/refreshSubscribers" @target=".count">
  Subscribers:
  <span class="count"></span>
</div>
```

Now, will be called every `2.5` seconds.

## Timing control

The primary drawback of polling is that it can be resource intensive. If you have a thousand visitors on a page that uses polling, one thousand network requests will be triggered every `2.5` seconds.

The best way to reduce requests in this scenario is simply to make the polling interval longer.

You can manually control how often the component will poll by appending the desired duration to `@poll` like so:

```html
<div @poll.15s>
  <!-- In seconds... -->
</div>

<div @poll.15000ms>
  <!-- In milliseconds... -->
</div>
```

## Background throttling

To further cut down on server requests, asor automatically throttles polling when a page is in the background. For example, if a user keeps a page open in a different browser tab, asor will reduce the number of polling requests by 95% until the user revisits the tab.

If you want to opt-out of this behavior and keep polling continuously, even when a tab is in the background, you can add the `.keep-alive` modifier to `@poll`:

```html
<div @poll.keep-alive></div>
```

## Viewport throttling

Another measure you can take to only poll when necessary, is to add the `.visible` modifier to `@poll`. The `.visible` modifier instructs asor to only poll the component when it is visible on the page:

```html
<div @poll.visible></div>
```

If a component using `@visible` is at the bottom of a long page, it won't start polling until the user scrolls it into the viewport. When the user scrolls away, it will stop polling again.

## Advanced Usage

You can combine `@poll` with other asor.js directives for more complex behavior:

```html
<div
  @poll.10s="/api/stock-prices"
  @swap="beforeend"
  @loading.class="is-updating"
  @transition
>
  <h3>Latest Stock Prices</h3>
  <!-- Stock price data will be appended here -->
</div>
```

In this example, the component will poll the `/api/stock-prices` endpoint every 10
seconds and append the stock price data to the component's template.
The `@swap` directive is used to specify the insertion point for the new data.
The `@loading.class` directive adds a CSS class to the component while it's loading.
The `@transition` directive adds a transition effect to the component when it's loaded.
