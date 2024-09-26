# Introducción a Asor

Bienvenido a Asor, un framework JavaScript moderno y progresivo diseñado para crear aplicaciones web dinámicas y de alto rendimiento.

## ¿Qué es Asor?

Asor es un framework de JavaScript que simplifica la creación de interfaces de usuario interactivas y reactivas. Diseñado con la filosofía de ser intuitivo y fácil de aprender, Asor está inpirado en la genialidad de estas bibliotecas y frameworks: `Alpine.js`, `Livewire` y `Htmx`, se pudiera decir que es una combinacion de caracteristicas potenciales de cada una, enfocandose principalmente en la sintaxis fácil, agradable e intuitiva de `Alpine.js` y sus potentes directivas. No es un remplazo directo a ninguna de ellas sino un alternativa, liviana, sencilla y potente. Aunque tambien podriamos agregar que tienes sus propias peculiaridades y caracteristicas.

## ¿Por qué Asor?

Utilizando un único enlace CDN de 13.3 KB y tener acceso a todo lo necesario de para construir aplicaciones SPA. Asor puede trabajar con el idioma de backend de su elección, solo necesita que devuelvas el html.
deal para proyectos pequeños y medianos, pero también puede ser utilizado en proyectos más grandes, ya que es muy ligero y fácil de aprender.
Facilita la creación de aplicaciones web en tiempo real con el menor Javascript posible.

Uso de directivas con api semejantes a la de `Alpine.js` y `Vue`. permitiendo interacciones rápidas con muy poco código.

Asor es compatible con la mayoría de los navegadores modernos.

## Características Principales

### 1. Sistema de Directivas Intuitivo

Asor utiliza un sistema de directivas que extiende el HTML, permitiéndote agregar funcionalidad dinámica a tus elementos de manera declarativa. Por ejemplo:

```html
<div a-def="{ count: 0 }">
  <p :text="count"></p>
  <button @click="count++">Incrementar</button>
</div>
```

### 2. Reactividad Eficiente

El sistema de reactividad de Asor asegura que tus vistas se actualicen automáticamente cuando los datos subyacentes cambian, sin necesidad de manipulación manual del DOM y sin VDOM .

### 3. Renderizado Condicional y Listas

Asor proporciona directivas potentes para manejar renderizado condicional y listas dinámicas:

```html
<ul a-for="item in items">
  <li a-if="item" :text="item"></li>
</ul>
```

### 4. Manejo de Eventos Simplificado

La directiva `a-on` permite un manejo de eventos limpio y declarativo:

```html
<button @click="handleClick()">Clic aquí</button>
o
<div a-on:click="handleClick()">Clic aquí</div>
```

### 5. Transiciones y Animaciones

Asor incluye soporte integrado para transiciones y animaciones, mejorando la experiencia del usuario:

```html
<div a-transition="fade">Contenido con transición</div>
```

### 6. Gestión de Estado

Con Asor, la gestión de estado es simple y directa, permitiéndote crear aplicaciones complejas de manera organizada.

### 7. Rendimiento Optimizado

Asor está diseñado pensando en el rendimiento, con actualizaciones eficientes del DOM y una huella ligera.

## ¿Por qué elegir Asor?

- **Curva de Aprendizaje Suave**: Si conoces HTML, CSS y JavaScript básico, podrás empezar a construir con Asor rápidamente.
- **Flexibilidad**: Asor se integra fácilmente con otras bibliotecas y proyectos existentes.
- **Escalabilidad**: Desde pequeñas aplicaciones hasta proyectos empresariales complejos, Asor escala contigo.
- **Comunidad y Ecosistema**: Únete a una comunidad creciente de desarrolladores y aprovecha un ecosistema en expansión.

## Un Vistazo al Código

Aquí tienes un pequeño ejemplo de cómo se ve una aplicación Asor:

```html
<div
  a-def="{
      tasks: [],
      newTask: '',
      addTask(task) {
          if(!task) return;
          this.tasks.push({ text: task, done: false });
          this.newTask = '';
      }
  }"
>
  <input
    @keyup.enter="addTask($event.target.value)"
    placeholder="Press Enter to add tasks"
  />
  <ul a-for="task in tasks">
    <li>
      <input type="checkbox" />
      <span :class="{ 'done': task.done }" :text="task.text"></span>
    </li>
  </ul>
</div>
```

Este ejemplo simple muestra cómo Asor puede manejar la entrada de usuario, manipulación de listas y actualización de UI con muy poco código.

¡Estamos emocionados de ver lo que construirás con Asor!