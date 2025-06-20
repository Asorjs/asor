asor actions are methods on your component that can be triggered by frontend interactions like clicking a button or submitting a form. They provide the developer experience of being able to call a PHP method directly from the browser, allowing you to focus on the logic of your application without getting bogged down writing boilerplate code connecting your application's frontend and backend.

Let's explore a basic example of calling a `save` action on a `CreatePost` component:

```php
<?php

namespace App\asor;

use App\asor;
use App\Models\Post;

class CreatePost extends Component
{
    public $title = '';

    public $content = '';

    public function save()
    {
        Post::create([
            'title' => $this->title,
            'content' => $this->content,
        ]);

        return redirect()->to('/posts');
    }

    public function render()
    {
        return view('asor.create-post');
    }
}
```

```html
<form a-xhr.post="save">
  <!-- [tl! highlight] -->
  <input type="text" asor:model="title" />

  <textarea asor:model="content"></textarea>

  <button type="submit">Save</button>
</form>
```

In the above example, when a user submits the form by clicking "Save", `asor:submit` intercepts the `submit` event and calls the `save()` action on the server.

In essence, actions are a way to easily map user interactions to server-side functionality without the hassle of submitting and handling AJAX requests manually.

## Event listeners

asor supports a variety of event listeners, allowing you to respond to various types of user interactions:

| Listener          | Description                                                                  |
| ----------------- | ---------------------------------------------------------------------------- |
| `asor:click`      | Triggered when an element is clicked                                         |
| `asor:submit`     | Triggered when a form is submitted                                           |
| `asor:keydown`    | Triggered when a key is pressed down                                         |
| `asor:mouseenter` | Triggered when the mouse enters an element                                   |
| `asor:*`          | Whatever text follows `asor:` will be used as the event name of the listener |

Because the event name after `asor:` can be anything, asor supports any browser event you might need to listen for. For example, to listen for `transitionend`, you can use `asor:transitionend`.

### Listening for specific keys

You can use one of asor's convenient aliases to narrow down key press event listeners to a specific key or combination of keys.

For example, to perform a search when a user hits `Enter` after typing into a search box, you can use `asor:keydown.enter`:

```html
<input asor:model="query" asor:keydown.enter="searchPosts" />
```

You can chain more key aliases after the first to listen for combinations of keys. For example, if you would like to listen for the `Enter` key only while the `Shift` key is pressed, you may write the following:

```html
<input asor:keydown.shift.enter="..." />
```

Below is a list of all the available key modifiers:

| Modifier     | Key                                |
| ------------ | ---------------------------------- |
| `.shift`     | Shift                              |
| `.enter`     | Enter                              |
| `.space`     | Space                              |
| `.ctrl`      | Ctrl                               |
| `.cmd`       | Cmd                                |
| `.meta`      | Cmd on Mac, Windows key on Windows |
| `.alt`       | Alt                                |
| `.up`        | Up arrow                           |
| `.down`      | Down arrow                         |
| `.left`      | Left arrow                         |
| `.right`     | Right arrow                        |
| `.escape`    | Escape                             |
| `.tab`       | Tab                                |
| `.caps-lock` | Caps Lock                          |
| `.equal`     | Equal, `=`                         |
| `.period`    | Period, `.`                        |
| `.slash`     | Forward Slash, `/`                 |

### Event handler modifiers

asor also includes helpful modifiers to make common event-handling tasks trivial.

For example, if you need to call `event.preventDefault()` from inside an event listener, you can suffix the event name with `.prevent`:

```html
<input asor:keydown.prevent="..." />
```

Here is a full list of all the available event listener modifiers and their functions:

| Modifier          | Key                                                                         |
| ----------------- | --------------------------------------------------------------------------- |
| `.prevent`        | Equivalent of calling `.preventDefault()`                                   |
| `.stop`           | Equivalent of calling `.stopPropagation()`                                  |
| `.window`         | Listens for event on the `window` object                                    |
| `.outside`        | Only listens for clicks "outside" the element                               |
| `.document`       | Listens for events on the `document` object                                 |
| `.once`           | Ensures the listener is only called once                                    |
| `.debounce`       | Debounce the handler by 250ms as a default                                  |
| `.debounce.100ms` | Debounce the handler for a specific amount of time                          |
| `.throttle`       | Throttle the handler to being called every 250ms at minimum                 |
| `.throttle.100ms` | Throttle the handler at a custom duration                                   |
| `.self`           | Only call listener if event originated on this element, not children        |
| `.camel`          | Converts event name to camel case (`asor:custom-event` -> "customEvent")    |
| `.dot`            | Converts event name to dot notation (`asor:custom-event` -> "custom.event") |
| `.passive`        | `asor:touchstart.passive` won't block scroll performance                    |
| `.capture`        | Listen for event in the "capturing" phase                                   |

Because `asor:` uses [Alpine's](https://alpinejs.dev) `x-on` directive under the hood, these modifiers are made available to you by Alpine. For more context on when you should use these modifiers, consult the [Alpine Events documentation](https://alpinejs.dev/essentials/events).

### Handling third-party events

asor also supports listening for custom events fired by third-party libraries.

For example, let's imagine you're using the [Trix](https://trix-editor.org/) rich text editor in your project and you want to listen for the `trix-change` event to capture the editor's content. You can accomplish this using the `asor:trix-change` directive:

```html
<form asor:submit="save">
  <!-- ... -->

  <trix-editor
    asor:trix-change="setPostContent($event.target.value)"
  ></trix-editor>

  <!-- ... -->
</form>
```

In this example, the `setPostContent` action is called whenever the `trix-change` event is triggered, updating the `content` property in the asor component with the current value of the Trix editor.

> [!info] You can access the event object using `$event`
> Within asor event handlers, you can access the event object via `$event`. This is useful for referencing information on the event. For example, you can access the element that triggered the event via `$event.target`.

> [!warning]
> The Trix demo code above is incomplete and only useful as a demonstration of event listeners. If used verbatim, a network request would be fired on every single key stroke. A more performant implementation would be:
>
> ```html
> <trix-editor
>   x-on:trix-change="$asor.content = $event.target.value"
> ></trix-editor>
> ```

### Listening for dispatched custom events

If your application dispatches custom events from Alpine, you can also listen for those using asor:

```html
<div asor:custom-event="...">
  <!-- Deeply nested within this component: -->
  <button x-on:click="$dispatch('custom-event')">...</button>
</div>
```

When the button is clicked in the above example, the `custom-event` event is dispatched and bubbles up to the root of the asor component where `asor:custom-event` catches it and invokes a given action.

If you want to listen for an event dispatched somewhere else in your application, you will need to wait instead for the event to bubble up to the `window` object and listen for it there. Fortunately, asor makes this easy by allowing you to add a simple `.window` modifier to any event listener:

```html
<div asor:custom-event.window="...">
  <!-- ... -->
</div>

<!-- Dispatched somewhere on the page outside the component: -->
<button x-on:click="$dispatch('custom-event')">...</button>
```

### Disabling inputs while a form is being submitted

Consider the `CreatePost` example we previously discussed:

```html
<form asor:submit="save">
  <input asor:model="title" />

  <textarea asor:model="content"></textarea>

  <button type="submit">Save</button>
</form>
```

When a user clicks "Save", a network request is sent to the server to call the `save()` action on the asor component.

But, let's imagine that a user is filling out this form on a slow internet connection. The user clicks "Save" and nothing happens initially because the network request takes longer than usual. They might wonder if the submission failed and attempt to click the "Save" button again while the first request is still being handled.

In this case, there would be two requests for the same action being processed at the same time.

To prevent this scenario, asor automatically disables the submit button and all form inputs inside the `<form>` element while a `asor:submit` action is being processed. This ensures that a form isn't accidentally submitted twice.

To further lessen the confusion for users on slower connections, it is often helpful to show some loading indicator such as a subtle background color change or SVG animation.

asor provides a `asor:loading` directive that makes it trivial to show and hide loading indicators anywhere on a page. Here's a short example of using `asor:loading` to show a loading message below the "Save" button:

```html
<form asor:submit="save">
  <textarea asor:model="content"></textarea>

  <button type="submit">Save</button>

  <span asor:loading>Saving...</span>
  <!-- [tl! highlight] -->
</form>
```

`asor:loading` is a powerful feature with a variety of more powerful features. [Check out the full loading documentation for more information](/docs/loading).

## Passing parameters

asor allows you to pass parameters from your Blade template to the actions in your component, giving you the opportunity to provide an action additional data or state from the frontend when the action is called.

For example, let's imagine you have a `ShowPosts` component that allows users to delete a post. You can pass the post's ID as a parameter to the `delete()` action in your asor component. Then, the action can fetch the relevant post and delete it from the database:

```php
<?php

namespace App\asor;

use Illuminate\Support\Facades\Auth;
use App\asor;
use App\Models\Post;

class ShowPosts extends Component
{
    public function delete($id)
    {
        $post = Post::findOrFail($id);

        $this->authorize('delete', $post);

        $post->delete();
    }

    public function render()
    {
        return view('asor.show-posts', [
            'posts' => Auth::user()->posts,
        ]);
    }
}
```

```html
<div>
  foreach ($posts as $post)
  <div asor:key="<?= $post->id ?>">
    <h1><?= $post->title ?></h1>
    <span><?= $post->content ?></span>

    <button asor:click="delete(<?= $post->id ?>)">Delete</button>
    <!-- [tl! highlight] -->
  </div>
  endforeach
</div>
```

For a post with an ID of 2, the "Delete" button in the Blade template above will render in the browser as:

```html
<button asor:click="delete(2)">Delete</button>
```

When this button is clicked, the `delete()` method will be called and `$id` will be passed in with a value of "2".

> [!warning] Don't trust action parameters
> Action parameters should be treated just like HTTP request input, meaning action parameter values should not be trusted. You should always authorize ownership of an entity before updating it in the database.
>
> For more information, consult our documentation regarding [security concerns and best practices](/docs/actions#security-concerns).

As an added convenience, you may automatically resolve Eloquent models by a corresponding model ID that is provided to an action as a parameter. This is very similar to [route model binding](/docs/components#using-route-model-binding). To get started, type-hint an action parameter with a model class and the appropriate model will automatically be retrieved from the database and passed to the action instead of the ID:

```php
<?php

namespace App\asor;

use Illuminate\Support\Facades\Auth;
use App\asor;
use App\Models\Post;

class ShowPosts extends Component
{
    public function delete(Post $post) // [tl! highlight]
    {
        $this->authorize('delete', $post);

        $post->delete();
    }

    public function render()
    {
        return view('asor.show-posts', [
            'posts' => Auth::user()->posts,
        ]);
    }
}
```

## Dependency injection

You can take advantage of [asor's dependency injection](https://laravel.com/docs/controllers#dependency-injection-and-controllers) system by type-hinting parameters in your action's signature. asor and asor will automatically resolve the action's dependencies from the container:

```php
<?php

namespace App\asor;

use Illuminate\Support\Facades\Auth;
use App\asor;
use App\Repositories\PostRepository;

class ShowPosts extends Component
{
    public function delete(PostRepository $posts, $postId) // [tl! highlight]
    {
        $posts->deletePost($postId);
    }

    public function render()
    {
        return view('asor.show-posts', [
            'posts' => Auth::user()->posts,
        ]);
    }
}
```

```html
<div>
  foreach ($posts as $post)
  <div asor:key="<?= $post->id ?>">
    <h1><?= $post->title ?></h1>
    <span><?= $post->content ?></span>

    <button asor:click="delete(<?= $post->id ?>)">Delete</button>
    <!-- [tl! highlight] -->
  </div>
  endforeach
</div>
```

In this example, the `delete()` method receives an instance of `PostRepository` resolved via [asor's service container](https://laravel.com/docs/container#main-content) before receiving the provided `$postId` parameter.

## Calling actions from Alpine

asor integrates seamlessly with [Alpine](https://alpinejs.dev/). In fact, under the hood, every asor component is also an Alpine component. This means you can take full advantage of Alpine within your components to add JavaScript powered client-side interactivity.

To make this pairing even more powerful, asor exposes a magic `$asor` object to Alpine that can be treated as a JavaScript representation of your PHP component. In addition to [accessing and mutating public properties via `$asor`](/docs/properties#accessing-properties-from-javascript), you can call actions. When an action is invoked on the `$asor` object, the corresponding PHP method will be invoked on your backend asor component:

```html
<button x-on:click="$asor.save()">Save Post</button>
```

Or, to illustrate a more complex example, you might use Alpine's [`x-intersect`](https://alpinejs.dev/plugins/intersect) utility to trigger a `incrementViewCount()` asor action when a given element is visible on the page:

```html
<div x-intersect="$asor.incrementViewCount()">...</div>
```

### Passing parameters

Any parameters you pass to the `$asor` method will also be passed to the PHP class method. For example, consider the following asor action:

```php
public function addTodo($todo)
{
    $this->todos[] = $todo;
}
```

Within your component's Blade template, you can invoke this action via Alpine, providing the parameter that should be given to the action:

```html
<div x-data="{ todo: '' }">
  <input type="text" x-model="todo" />

  <button x-on:click="$asor.addTodo(todo)">Add Todo</button>
</div>
```

If a user had typed in "Take out the trash" into the text input and the pressed the "Add Todo" button, the `addTodo()` method will be triggered with the `$todo` parameter value being "Take out the trash".

### Receiving return values

For even more power, invoked `$asor` actions return a promise while the network request is processing. When the server response is received, the promise resolves with the value returned by the backend action.

For example, consider a asor component that has the following action:

```php
use App\Models\Post;

public function getPostCount()
{
    return Post::count();
}
```

Using `$asor`, the action may be invoked and its returned value resolved:

```html
<span x-text="await $asor.getPostCount()"></span>
```

In this example, if the `getPostCount()` method returns "10", the `<span>` tag will also contain "10".

Alpine knowledge is not required when using asor; however, it's an extremely powerful tool and knowing Alpine will augment your asor experience and productivity.

## asor's "hybrid" JavaScript functions

Sometimes there are actions in your component that don't need to communicate with the server and can be more efficiently written using only JavaScript.

In these cases, rather than writing the actions inside your Blade template or another file, your component action may return the JavaScript function as a string. If the action is marked with the `#[Js]` attribute, it will be callable from your application's frontend:

For example:

```php
<?php

namespace App\asor;

use asor\Attributes\Js;
use App\asor;
use App\Models\Post;

class SearchPosts extends Component
{
    public $query = '';

    #[Js] // [tl! highlight:6]
    public function reset()
    {
        return <<<'JS'
            $asor.query = '';
        JS;
    }

    public function render()
    {
        return view('asor.search-posts', [
            'posts' => Post::whereTitle($this->query)->get(),
        ]);
    }
}
```

```html
<div>
  <input asor:model.live="query" />

  <button asor:click="reset">Reset Search</button>
  <!-- [tl! highlight] -->

  foreach ($posts as $post)
  <!-- ... -->
  endforeach
</div>
```

In the above example, when the "Reset Search" button is pressed, the text input will be cleared without sending any requests to the server.

### Evaluating one-off JavaScript expressions

In addition to designating entire methods to be evaluated in JavaScript, you can use the `js()` method to evaluate smaller, individual expressions.

This is generally useful for performing some kind of client-side follow-up after a server-side action is performed.

For example, here is an example of a `CreatePost` component that triggers a client-side alert dialog after the post is saved to the database:

```php
<?php

namespace App\asor;

use App\asor;

class CreatePost extends Component
{
    public $title = '';

    public function save()
    {
        // ...

        $this->js("alert('Post saved!')"); // [tl! highlight:6]
    }
}
```

The JavaScript expression `alert('Post saved!')` will now be executed on the client after the post has been saved to the database on the server.

Just like `#[Js]` methods, you can access the current component's `$asor` object inside the expression.

## Magic actions

asor provides a set of "magic" actions that allow you to perform common tasks in your components without defining custom methods. These magic actions can be used within event listeners defined in your Blade templates.

### `$parent`

The `$parent` magic variable allows you to access parent component properties and call parent component actions from a child component:

```html
<button asor:click="$parent.removePost(<?= $post->id ?>)">Remove</button>
```

In the above example, if a parent component has a `removePost()` action, a child can call it directly from its Blade template using `$parent.removePost()`.

### `$set`

The `$set` magic action allows you to update a property in your asor component directly from the Blade template. To use `$set`, provide the property you want to update and the new value as arguments:

```html
<button asor:click="$set('query', '')">Reset Search</button>
```

In this example, when the button is clicked, a network request is dispatched that sets the `$query` property in the component to `''`.

### `$refresh`

The `$refresh` action triggers a re-render of your asor component. This can be useful when updating the component's view without changing any property values:

```html
<button asor:click="$refresh">Refresh</button>
```

When the button is clicked, the component will re-render, allowing you to see the latest changes in the view.

### `$toggle`

The `$toggle` action is used to toggle the value of a boolean property in your asor component:

```html
<button asor:click="$toggle('sortAsc')">
  Sort
  <?= $sortAsc ? 'Descending' : 'Ascending' ?>
</button>
```

In this example, when the button is clicked, the `$sortAsc` property in the component will toggle between `true` and `false`.

### `$dispatch`

The `$dispatch` action allows you to dispatch a asor event directly in the browser. Below is an example of a button that, when clicked, will dispatch the `post-deleted` event:

```html
<button type="submit" asor:click="$dispatch('post-deleted')">
  Delete Post
</button>
```

### `$event`

The `$event` action may be used within event listeners like `asor:click`. This action gives you access to the actual JavaScript event that was triggered, allowing you to reference the triggering element and other relevant information:

```html
<input type="text" asor:keydown.enter="search($event.target.value)" />
```

When the enter key is pressed while a user is typing in the input above, the contents of the input will be passed as a parameter to the `search()` action.

### Using magic actions from Alpine

You can also call magic actions from Alpine using the `$asor` object. For example, you may use the `$asor` object to invoke the `$refresh` magic action:

```html
<button x-on:click="$asor.$refresh()">Refresh</button>
```

## Skipping re-renders

Sometimes there might be an action in your component with no side effects that would change the rendered Blade template when the action is invoked. If so, you can skip the `render` portion of asor's lifecycle by adding the `#[Renderless]` attribute above the action method.

To demonstrate, in the `ShowPost` component below, the "view count" is logged when the user has scrolled to the bottom of the post:

```php
<?php

namespace App\asor;

use asor\Attributes\Renderless;
use App\asor;
use App\Models\Post;

class ShowPost extends Component
{
    public Post $post;

    public function mount(Post $post)
    {
        $this->post = $post;
    }

    #[Renderless] // [tl! highlight]
    public function incrementViewCount()
    {
        $this->post->incrementViewCount();
    }

    public function render()
    {
        return view('asor.show-post');
    }
}
```

```html
<div>
  <h1><?= $post->title ?></h1>
  <p><?= $post->content ?></p>

  <div x-intersect="$asor.incrementViewCount()"></div>
</div>
```

The example above uses [`x-intersect`](https://alpinejs.dev/plugins/intersect), an Alpine utility that calls the expression when the element enters the viewport (typically used to detect when a user scrolls to an element further down the page).

As you can see, when a user scrolls to the bottom of the post, `incrementViewCount()` is invoked. Since `#[Renderless]` was added to the action, the view is logged, but the template doesn't re-render and no part of the page is affected.

If you prefer to not utilize method attributes or need to conditionally skip rendering, you may invoke the `skipRender()` method in your component action:

```php
<?php

namespace App\asor;

use App\asor;
use App\Models\Post;

class ShowPost extends Component
{
    public Post $post;

    public function mount(Post $post)
    {
        $this->post = $post;
    }

    public function incrementViewCount()
    {
        $this->post->incrementViewCount();

        $this->skipRender(); // [tl! highlight]
    }

    public function render()
    {
        return view('asor.show-post');
    }
}
```

## Security concerns

Remember that any public method in your asor component can be called from the client-side, even without an associated `asor:click` handler that invokes it. In these scenarios, users can still trigger the action from the browser's DevTools.

Below are three examples of easy-to-miss vulnerabilities in asor components. Each will show the vulnerable component first and the secure component after. As an exercise, try spotting the vulnerabilities in the first example before viewing the solution.

If you are having difficulty spotting the vulnerabilities and that makes you concerned about your ability to keep your own applications secure, remember all these vulnerabilities apply to standard web applications that use requests and controllers. If you use a component method as a proxy for a controller method, and its parameters as a proxy for request input, you should be able to apply your existing application security knowledge to your asor code.

### Always authorize action parameters

Just like controller request input, it's imperative to authorize action parameters since they are arbitrary user input.

Below is a `ShowPosts` component where users can view all their posts on one page. They can delete any post they like using one of the post's "Delete" buttons.

Here is a vulnerable version of component:

```php
<?php

namespace App\asor;

use Illuminate\Support\Facades\Auth;
use App\asor;
use App\Models\Post;

class ShowPosts extends Component
{
    public function delete($id)
    {
        $post = Post::find($id);

        $post->delete();
    }

    public function render()
    {
        return view('asor.show-posts', [
            'posts' => Auth::user()->posts,
        ]);
    }
}
```

```html
<div>
  foreach ($posts as $post)
  <div asor:key="<?= $post->id ?>">
    <h1><?= $post->title ?></h1>
    <span><?= $post->content ?></span>

    <button asor:click="delete(<?= $post->id ?>)">Delete</button>
  </div>
  endforeach
</div>
```

Remember that a malicious user can call `delete()` directly from a JavaScript console, passing any parameters they would like to the action. This means that a user viewing one of their posts can delete another user's post by passing the un-owned post ID to `delete()`.

To protect against this, we need to authorize that the user owns the post about to be deleted:

```php
<?php

namespace App\asor;

use Illuminate\Support\Facades\Auth;
use App\asor;
use App\Models\Post;

class ShowPosts extends Component
{
    public function delete($id)
    {
        $post = Post::find($id);

        $this->authorize('delete', $post); // [tl! highlight]

        $post->delete();
    }

    public function render()
    {
        return view('asor.show-posts', [
            'posts' => Auth::user()->posts,
        ]);
    }
}
```

### Always authorize server-side

Like standard asor controllers, asor actions can be called by any user, even if there isn't an affordance for invoking the action in the UI.

Consider the following `BrowsePosts` component where any user can view all the posts in the application, but only administrators can delete a post:

```php
<?php

namespace App\asor;

use App\asor;
use App\Models\Post;

class BrowsePosts extends Component
{
    public function deletePost($id)
    {
        $post = Post::find($id);

        $post->delete();
    }

    public function render()
    {
        return view('asor.browse-posts', [
            'posts' => Post::all(),
        ]);
    }
}
```

```html
<div>
  foreach ($posts as $post)
  <div asor:key="<?= $post->id ?>">
    <h1><?= $post->title ?></h1>
    <span><?= $post->content ?></span>

    if (Auth::user()->isAdmin())
    <button asor:click="deletePost(<?= $post->id ?>)">Delete</button>
    endif
  </div>
  endforeach
</div>
```

As you can see, only administrators can see the "Delete" button; however, any user can call `deletePost()` on the component from the browser's DevTools.

To patch this vulnerability, we need to authorize the action on the server like so:

```php
<?php

namespace App\asor;

use Illuminate\Support\Facades\Auth;
use App\asor;
use App\Models\Post;

class BrowsePosts extends Component
{
    public function deletePost($id)
    {
        if (! Auth::user()->isAdmin) { // [tl! highlight:2]
            abort(403);
        }

        $post = Post::find($id);

        $post->delete();
    }

    public function render()
    {
        return view('asor.browse-posts', [
            'posts' => Post::all(),
        ]);
    }
}
```

With this change, only administrators can delete a post from this component.

### Keep dangerous methods protected or private

Every public method inside your asor component is callable from the client. Even methods you haven't referenced inside a `asor:click` handler. To prevent a user from calling a method that isn't intended to be callable client-side, you should mark them as `protected` or `private`. By doing so, you restrict the visibility of that sensitive method to the component's class and its subclasses, ensuring they cannot be called from the client-side.

Consider the `BrowsePosts` example that we previously discussed, where users can view all posts in your application, but only administrators can delete posts. In the [Always authorize server-side](/docs/actions#always-authorize-server-side) section, we made the action secure by adding server-side authorization. Now imagine we refactor the actual deletion of the post into a dedicated method like you might do in order to simplify your code:

```php
// Warning: This snippet demonstrates what NOT to do...
<?php

namespace App\asor;

use Illuminate\Support\Facades\Auth;
use App\asor;
use App\Models\Post;

class BrowsePosts extends Component
{
    public function deletePost($id)
    {
        if (! Auth::user()->isAdmin) {
            abort(403);
        }

        $this->delete($id); // [tl! highlight]
    }

    public function delete($postId)  // [tl! highlight:5]
    {
        $post = Post::find($postId);

        $post->delete();
    }

    public function render()
    {
        return view('asor.browse-posts', [
            'posts' => Post::all(),
        ]);
    }
}
```

```html
<div>
  foreach ($posts as $post)
  <div asor:key="<?= $post->id ?>">
    <h1><?= $post->title ?></h1>
    <span><?= $post->content ?></span>

    <button asor:click="deletePost(<?= $post->id ?>)">Delete</button>
  </div>
  endforeach
</div>
```

As you can see, we refactored the post deletion logic into a dedicated method named `delete()`. Even though this method isn't referenced anywhere in our template, if a user gained knowledge of its existence, they would be able to call it from the browser's DevTools because it is `public`.

To remedy this, we can mark the method as `protected` or `private`. Once the method is marked as `protected` or `private`, an error will be thrown if a user tries to invoke it:

```php
<?php

namespace App\asor;

use Illuminate\Support\Facades\Auth;
use App\asor;
use App\Models\Post;

class BrowsePosts extends Component
{
    public function deletePost($id)
    {
        if (! Auth::user()->isAdmin) {
            abort(403);
        }

        $this->delete($id);
    }

    protected function delete($postId) // [tl! highlight]
    {
        $post = Post::find($postId);

        $post->delete();
    }

    public function render()
    {
        return view('asor.browse-posts', [
            'posts' => Post::all(),
        ]);
    }
}
```

<!--
## Applying middleware

By default, asor re-applies authentication and authorization related middleware on subsequent requests if those middleware were applied on the initial page load request.

For example, imagine your component is loaded inside a route that is assigned the `auth` middleware and a user's session ends. When the user triggers another action, the `auth` middleware will be re-applied and the user will receive an error.

If there are specific middleware that you would like to apply to a specific action, you may do so with the `#[Middleware]` attribute. For example, we could apply a `LogPostCreation` middleware to an action that creates posts:

```php
<?php

namespace App\asor;

use App\Http\Middleware\LogPostCreation;
use App\asor;

class CreatePost extends Component
{
    public $title;

    public $content;

    #[Middleware(LogPostCreation::class)] // [tl! highlight]
    public function save()
    {
        // Create the post...
    }

    // ...
}
```

Now, the `LogPostCreation` middleware will be applied only to the `createPost` action, ensuring that the activity is only being logged when users create a new post.

-->
