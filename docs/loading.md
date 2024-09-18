# @loading Directive

Loading indicators are an important part of crafting good user interfaces. They give users visual feedback when a request is being made to the server so they know they are waiting for a process to complete.

## Basic usage

asor provides a simple yet extremely powerful syntax for controlling loading indicators: `@loading`. Adding `@loading` to any element will hide it by default (using `display: none` in CSS) and show it when a request is sent to the server.

Below is a basic example of a `CreatePost` component's form with `@loading` being used to toggle a loading message:

```html
<form xhr.post="/save">
  <!-- ... -->

  <button type="submit">Save</button>

  <div @loading>
    <!-- [tl! highlight:2] -->
    Saving post...
  </div>
</form>
```

When a user presses "Save", the "Saving post..." message will appear below the button while the "save" action is being executed. The message will disappear when the response is received from the server and processed by asor.

### Removing elements

Alternatively, you can append `.remove` for the inverse effect, showing an element by default and hiding it during requests to the server:

```html
<div @loading.remove>...</div>
```

## Toggling classes

In addition to toggling the visibility of entire elements, it's often useful to change the styling of an existing element by toggling CSS classes on and off during requests to the server. This technique can be used for things like changing background colors, lowering opacity, triggering spinning animations, and more.

Below is a simple example of using the [Tailwind](https://tailwindcss.com/) class `opacity-50` to make the "Save" button fainter while the form is being submitted:

```html
<button @loading.class="opacity-50">Save</button>
```

Like toggling an element, you can perform the inverse class operation by appending `.remove` to the `@loading` directive. In the example below, the button's `bg-blue-500` class will be removed when the "Save" button is pressed:

```html
<button class="bg-blue-500" @loading.class.remove="bg-blue-500">Save</button>
```

## Toggling attributes

By default, when a form is submitted, asor will automatically disable the submit button and add the `readonly` attribute to each input element while the form is being processed.

However, in addition to this default behavior, asor offers the `.attr` modifier to allow you to toggle other attributes on an element or toggle attributes on elements that are outside of forms:

```html
<button type="button" @click="remove" @loading.attr="disabled">Remove</button>
```

Because the button above isn't a submit button, it won't be disabled by asor's default form handling behavior when pressed. Instead, we manually added `@loading.attr="disabled"` to achieve this behavior.

## Targeting specific actions

By default, `@loading` will be triggered whenever a component makes a request to the server.

However, in components with multiple elements that can trigger server requests, you should scope your loading indicators down to individual actions.

For example, consider the following "Save post" form. In addition to a "Save" button that submits the form, there might also be a "Remove" button that executes a "remove" action on the component.

By adding `@target` to the following `@loading` element, you can instruct asor to only show the loading message when the "Remove" button is clicked:

```html
<form xhr.post="/save">
  <!-- ... -->

  <button>Save</button>

  <div @loading>
    <!-- [tl! highlight:2] -->
    Removing post...
  </div>
</form>
```

When the above "Remove" button is pressed, the "Removing post..." message will be displayed to the user. However, the message will not be displayed when the "Save" button is pressed.

### Targeting action parameters

In situations where the same action is triggered with different parameters from multiple places on a page, you can further scope `@target` to a specific action by passing in additional parameters. For example, consider the following scenario where a "Remove" button exists for each post on the page:

```html
<div>
  foreach ($posts as $post)
  <div @key="<?= $post->id ?>">
    <h2><?= $post->title ?></h2>

    <button @click="remove(<?= $post->id ?>)">Remove</button>

    <div @loading @target="remove(<?= $post->id ?>)">
      <!-- [tl! highlight:2] -->
      Removing post...
    </div>
  </div>
  endforeach
</div>
```

Without passing `<?= $post->id ?>` to `@target="remove"`, the "Removing post..." message would show when any of the buttons on the page are clicked.

However, because we are passing in unique parameters to each instance of `@target`, asor will only show the loading message when the matching parameters are passed to the "remove" action.

### Targeting property updates

asor also allows you to target specific component property updates by passing the property's name to the `@target` directive.

Consider the following example where a form input named `username` uses `@model.live` for real-time validation as a user types:

```html
<form @submit="save">
  <input type="text" @model.live="username" />
  @error('username') <span><?= $message ?></span> @enderror

  <div @loading @target="username">
    <!-- [tl! highlight:2] -->
    Checking availability of username...
  </div>

  <!-- ... -->
</form>
```

The "Checking availability..." message will show when the server is updated with the new username as the user types into the input field.

## Customizing CSS display property

When `@loading` is added to an element, asor updates the CSS `display` property of the element to show and hide the element. By default, asor uses `none` to hide and `inline-block` to show.

If you are toggling an element that uses a display value other than `inline-block`, like `flex` in the following example, you can append `.flex` to `@loading`:

```html
<div class="flex" @loading.flex>...</div>
```

Below is the complete list of available display values:

```html
<div @loading.inline-flex>...</div>
<div @loading.inline>...</div>
<div @loading.block>...</div>
<div @loading.table>...</div>
<div @loading.flex>...</div>
<div @loading.grid>...</div>
```

## Delaying a loading indicator

On fast connections, updates often happen so quickly that loading indicators only flash briefly on the screen before being removed. In these cases, the indicator is more of a distraction than a helpful affordance.

For this reason, asor provides a `.delay` modifier to delay the showing of an indicator. For example, if you add `@loading.delay` to an element like so:

```html
<div @loading.delay>...</div>
```

The above element will only appear if the request takes over 200 milliseconds. The user will never see the indicator if the request completes before then.

To customize the amount of time to delay the loading indicator, you can use one of asor's helpful interval aliases:

```html
<div @loading.delay.shortest>...</div>
<!-- 50ms -->
<div @loading.delay.shorter>...</div>
<!-- 100ms -->
<div @loading.delay.short>...</div>
<!-- 150ms -->
<div @loading.delay>...</div>
<!-- 200ms -->
<div @loading.delay.long>...</div>
<!-- 300ms -->
<div @loading.delay.longer>...</div>
<!-- 500ms -->
<div @loading.delay.longest>...</div>
<!-- 1000ms -->
```
