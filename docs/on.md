# Directiva @on

## Introducción

La directiva `@on` en Asor.js proporciona una forma declarativa y potente de manejar eventos en tus componentes. Permite asociar acciones o métodos a eventos del DOM, ofreciendo una sintaxis concisa y una amplia gama de opciones de personalización.

## Uso Básico

La sintaxis básica de la directiva `@on` es la siguiente:

```html
<elemento @on:[evento][directivas]="[expresión]"></elemento>
```

Donde:

-   `[evento]` es el nombre del evento DOM (por ejemplo, click, submit, keydown, etc.)
-   `[expresión]` es la acción o método a ejecutar cuando ocurre el evento

Ejemplos de uso básico:

```html
<button @on:click="incrementar()">Incrementar</button>
<form @on:submit="enviarFormulario()">
    <input @on:input="actualizarBusqueda()" />
</form>
```

## Modificadores

La directiva `@on` admite varios modificadores para personalizar el comportamiento de los eventos:

| Modificador | Descripción                                                      |
| ----------- | ---------------------------------------------------------------- |
| `.prevent`  | Llama a `event.preventDefault()`                                 |
| `.stop`     | Llama a `event.stopPropagation()`                                |
| `.once`     | El evento se dispara solo una vez                                |
| `.capture`  | Usa la fase de captura del evento                                |
| `.self`     | Solo se dispara si el evento ocurre en este elemento exactamente |
| `.passive`  | Mejora el rendimiento para eventos de scroll                     |
| `.outside`  | El evento se dispara solo si ocurre fuera del elemento           |
| `.window`   | Adjunta el listener al objeto window                             |
| `.document` | Adjunta el listener al objeto document                           |
| `.debounce` | Retrasa la ejecución del manejador                               |
| `.throttle` | Limita la frecuencia de ejecución del manejador                  |

Ejemplos de uso de modificadores:

```html
<button @on:click.once="mostrarMensajeBienvenida()">Bienvenida</button>
<button @on:click.prevent.stop="procesarClick()">Procesar</button>
<div @on:mousemove.throttle.100="actualizarPosicion()"></div>
<div @on:click.outside="cerrarMenu()">Menú</div>
<div @on:touchstart.passive="iniciarDeslizamiento()"></div>
```

### Modificadores de teclado

Para eventos de teclado, puedes especificar teclas concretas:

| Modificador | Tecla                                       |
| ----------- | ------------------------------------------- |
| `.enter`    | Enter                                       |
| `.tab`      | Tab                                         |
| `.delete`   | Delete (y Backspace)                        |
| `.esc`      | Escape                                      |
| `.space`    | Espacio                                     |
| `.up`       | Flecha arriba                               |
| `.down`     | Flecha abajo                                |
| `.left`     | Flecha izquierda                            |
| `.right`    | Flecha derecha                              |
| `.ctrl`     | Control                                     |
| `.alt`      | Alt                                         |
| `.shift`    | Shift                                       |
| `.meta`     | Tecla Meta (Cmd en Mac, Windows en Windows) |

Ejemplo:

```html
<input @on:keydown.enter="buscar()" />
```

## Eventos

La directiva `@on` puede manejar cualquier evento estándar del DOM. Aquí hay una lista de los eventos más comunes:

| Categoría  | Eventos                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------- |
| Mouse      | `click`, `dblclick`, `mousedown`, `mouseup`, `mousemove`, `mouseenter`, `mouseleave`, `mouseover`, `mouseout` |
| Teclado    | `keydown`, `keyup`, `keypress`                                                                                |
| Formulario | `submit`, `change`, `input`, `focus`, `blur`                                                                  |
| Documento  | `DOMContentLoaded`, `load`, `unload`, `resize`, `scroll`                                                      |
| Arrastrar  | `drag`, `dragstart`, `dragend`, `dragenter`, `dragleave`, `dragover`, `drop`                                  |
| Táctil     | `touchstart`, `touchmove`, `touchend`, `touchcancel`                                                          |
| Multimedia | `play`, `pause`, `ended`, `volumechange`, `timeupdate`                                                        |

Ejemplo de manejo de múltiples eventos:

```html
<input @on="keyup, change, blur" a-xhr="/actualizar" />
```

## Ejemplos Avanzados

1. Uso del modificador `outside` para cerrar un dropdown:

```html
<div @on:click.outside="cerrarDropdown()">
    <button @on:click="toggleDropdown()">Abrir Dropdown</button>
    <ul @if="dropdownAbierto()">
        <!-- Opciones del dropdown -->
    </ul>
</div>
```

2.Combinación de modificadores:

```html
<input
    @on:input.throttle-300="buscarEnTiempoReal(event.target.value)"
    @on:keydown.enter="realizarBusqueda()"
/>
```

3.Uso de eventos personalizados:

```html
<button @on:eventCustom="manejarEventoPersonalizado()"></button>
```

## Errores Comunes

1. **Olvidar el prefijo `@on:`**
   Incorrecto: `<button click="hacer()">`
   Correcto: `<button @on:click="hacer()">`

2. **Usar comillas simples en lugar de dobles para la expresión**
   Incorrecto: `<button @on:click='hacer()'>`
   Correcto: `<button @on:click="hacer()">`

3. **Intentar usar modificadores que no existen**
   Incorrecto: `<button @on:click.nonexistent="hacer()">`
   Correcto: Asegúrate de usar solo los modificadores documentados

4. **Olvidar el paréntesis al llamar a un método**
   Incorrecto: `<button @on:click="hacer">`
   Correcto: `<button @on:click="hacer()">`

## Notas Adicionales

-   La directiva `@on` se integra perfectamente con otras características de asor.js, como el manejo de estado y las propiedades computadas.
-   Para eventos que no son nativos del DOM, asegúrate de que estén siendo emitidos correctamente por el componente o elemento correspondiente.
-   El uso excesivo de modificadores como `.throttle` o `.delay` puede afectar la respuesta percibida de tu aplicación. Úsalos con precaución y realiza pruebas de rendimiento cuando sea necesario.
-   Recuerda que las expresiones en `@on` se ejecutan en el contexto del componente. Esto significa que tienes acceso a las propiedades y métodos del componente directamente en la expresión del evento.
