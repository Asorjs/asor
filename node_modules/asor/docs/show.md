# Directiva @show

## Introducción

La directiva `@show` es similar a `@if`, pero en lugar de remover el elemento, solo cambia su visibilidad.

### Sintaxis Básica

```html
<elemento @show="condicion">
    <!-- Contenido -->
</elemento>
```

### Ejemplo de Uso

```html
<div @data="mostrarMensaje: true">
    <p @show="mostrarMensaje">Este mensaje puede ocultarse</p>
</div>
```

### Consideraciones

-   `@show` alterna entre `display: none` y el valor original de `display` del elemento.
-   Es útil cuando necesitas ocultar/mostrar elementos frecuentemente sin reconstruir el DOM.

## Combinando Directivas

Estas directivas pueden combinarse para crear interfaces dinámicas complejas:

```html
<div
    @data="tareas: [{texto: 'Comprar leche', completada: false}, {texto: 'Pasear al perro', completada: true}]"
>
    <ul>
        <li @for="tarea in tareas">
            <span @show="!tarea.completada" :text="tarea.texto"></span>
            <span @if="tarea.completada"
                >Tarea completada: <span :text="tarea.texto"></span
            ></span>
        </li>
    </ul>
</div>
```

## Buenas Prácticas

1. Usa `@if` para condiciones que no cambiarán frecuentemente, y `@show` para alternar visibilidad regularmente.
