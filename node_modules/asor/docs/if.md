# Directivas de Control de Flujo en Asor

## @if

La directiva `@if` se usa para renderizar condicionalmente un elemento basado en una expresión.

### Sintaxis Básica

```html
<elemento @if="condicion">
    <!-- Contenido -->
</elemento>
```

### Ejemplo de Uso

```html
<div @data="estaLogueado: false">
    <button @if="!estaLogueado">Iniciar Sesión</button>
    <p @if="estaLogueado">Bienvenido, Usuario</p>
</div>
```
