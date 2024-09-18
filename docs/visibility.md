# Visibility

The `@visibility` directive in asor.js allows you to control the visibility of elements based on various conditions. This is particularly useful for creating responsive interfaces and optimizing performance by showing or hiding elements as needed.

## Syntax

<element @visibility[.modifier]="condition">Content</element>

- `condition`: The condition that determines the visibility of the element.
- `modifier` (optional): Additional behaviors for visibility control.

## Basic Usage

Here's a simple example of how to use the `@visibility` directive:

```html
<div @visibility="isVisible">
  This content will be shown or hidden based on the 'isVisible' variable.
</div>
```

## Modifiers

### .show

The `.show` modifier displays the element when the condition is true:

```html
<div @visibility.show="userLoggedIn">Welcome, user!</div>
```

### .hide

The `.hide` modifier hides the element when the condition is true:

```html
<div @visibility.hide="isLoading">Content is ready to view.</div>
```

### .remove

The `.remove` modifier removes the element from the DOM when hidden:

```html
<div @visibility.remove="!hasPermission">Sensitive content here.</div>
```

## Advanced Usage

### Combining with other directives

You can combine `@visibility` with other asor.js directives for more complex behavior:

```html
<div @visibility="isDataLoaded" @transition @loading.class="is-loading">
  <h3>Data Visualization</h3>
  <!-- Data content here -->
</div>
```

### Viewport-based visibility

You can show or hide elements based on their visibility in the viewport:

```html
<div @visibility.show="inViewport">
  This content will appear when scrolled into view.
</div>
```

### Time-based visibility

Control visibility based on time conditions:

```html
<div @visibility="currentTime > startTime && currentTime < endTime">
  This promotion is currently active!
</div>
```

### Responsive visibility

Implement responsive design patterns:

```html
<div @visibility.show="screenWidth > 768">Desktop version</div>
<div @visibility.show="screenWidth <= 768">Mobile version</div>
```

## Important Notes

- The `@visibility` directive does not add any inline styles. It toggles a class that you should define in your CSS.
- When using `.remove`, be cautious with elements that contain important data or event listeners, as they will be completely removed from the DOM.
- Visibility changes can be combined with transitions for smooth effects.
- For performance reasons, prefer CSS-based solutions for simple show/hide behaviors when possible.
- The visibility condition is re-evaluated whenever the related data changes.

By leveraging the `@visibility` directive, you can create dynamic, responsive interfaces that adapt to user interactions, viewport changes, and application state, enhancing both the functionality and performance of your web application.
