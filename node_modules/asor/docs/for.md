# Directivas de Control de Flujo en Asor

## @for

La directiva `@for` se utiliza para renderizar una lista de elementos basada en un array.

### Sintaxis Básica

```html
<elemento @for="item in items">
    <!-- Contenido -->
</elemento>
```

### Ejemplo de Uso

```html
<div @data="frutas: ['Manzana', 'Banana', 'Cereza']">
    <ul>
        <li @for="fruta in frutas" :text="fruta"></li>
    </ul>
</div>
```

### Acceso al Índice

Puedes acceder al índice del elemento actual usando la siguiente sintaxis:

```html
<div @data="usuarios: [{nombre: 'Ana'}, {nombre: 'Bob'}, {nombre: 'Carlos'}]">
    <ul>
        <li @for="(usuario, index) in usuarios">
            <span :text="index"></span>:
            <span :text="usuario.nombre"></span>
        </li>
    </ul>
</div>
```

### Consideraciones

-   Asegúrate de que el array esté definido en `@data` antes de usarlo en `@for`.
-   Para mejorar el rendimiento, considera usar una clave única para cada elemento con `@key`.
