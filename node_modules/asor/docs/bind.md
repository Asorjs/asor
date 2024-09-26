# Directiva @bind

## Introducción

La directiva `@bind` en asor.js proporciona una forma sencilla de crear enlaces bidireccionales entre elementos del DOM y propiedades del componente. Esto permite una sincronización automática entre la interfaz de usuario y el estado del componente.

## Sintaxis Básica

La sintaxis básica de la directiva `@bind` es la siguiente:

```html
<elemento :text="propiedad"></elemento>
```

Donde `propiedad` es el nombre de la propiedad del componente a la que se enlazará el elemento.

## Uso Básico

### Enlace con Inputs de Texto

```html
<div @data="mensaje: ''">
    <input :value="mensaje" />
    <p :text="mensaje"></p>
</div>
```

En este ejemplo, el valor del input se sincronizará automáticamente con la propiedad `mensaje`.

### Enlace con Checkboxes

```html
<div @data="aceptado: false">
    <input type="checkbox" @bind.value="aceptado" />
    <p>Términos aceptados: <span :text="aceptado"></span></p>
</div>
```

### Enlace con Selects

```html
<div @data="color: ''">
    <select @bind.value="color">
        <option value="">Selecciona un color</option>
        <option value="rojo">Rojo</option>
        <option value="verde">Verde</option>
        <option value="azul">Azul</option>
    </select>
    <p>Color seleccionado: <span :text="color"></span></p>
</div>
```

## Características Avanzadas

### Enlace con Propiedades de Objetos

```html
<div @data="usuario: { nombre: '', email: '' }">
    <input @bind="usuario.nombre" placeholder="Nombre" />
    <input :value="usuario.email" placeholder="Email" />
    <p>Nombre: <span :text="usuario.nombre"></span></p>
    <p>Email: <span :text="usuario.email"></span></p>
</div>
```

### Enlace con Arrays

```html
<div @data="tareas: [], nuevaTarea: '' ">
    <input
        :text="nuevaTarea"
        @on:keyup.enter="tareas.push(nuevaTarea); nuevaTarea = ''"
    />
    <ul>
        <li @for="tarea in tareas" :text="tarea"></li>
    </ul>
</div>
```

## Modificadores

### .lazy

El modificador `.lazy` hace que el enlace se actualice después de un evento "change" en lugar de en cada entrada:

```html
<input @bind.lazy="mensaje" />
```

### .number

El modificador `.number` convierte automáticamente la entrada a un número:

```html
<input type="number" @bind.number="edad" />
```

### .trim

El modificador `.trim` elimina automáticamente los espacios en blanco al principio y al final de la entrada:

```html
<input @bind.trim="nombre" />
```

## Buenas Prácticas

1. **Inicialización de Propiedades**: Asegúrate de inicializar las propiedades en `@data` antes de usarlas con `@bind`.
2. **Evita Ciclos Infinitos**: Ten cuidado al combinar `@bind` con otros eventos que puedan modificar la misma propiedad.
3. **Usa Modificadores Apropiadamente**: Elige el modificador adecuado para mejorar la experiencia del usuario y la precisión de los datos.

## Errores Comunes

1. **Enlazar a Propiedades No Existentes**:
   Asegúrate de que la propiedad esté definida en `@data` antes de usar `@bind`.

2. **Modificadores incorrectos según el elemento**:
   Si quieres mostrar los valores en un input debes agregar el modificador `@bind.value`, el por defecto `@bind` es para texto. Si quieres modificar otro atributo debes agregar el modificador correspondiente.

3. **Olvidar Inicializar Propiedades**:
   Siempre inicializa tus propiedades en `@data` antes de usarlas con `@bind`.

## Consideraciones de Rendimiento

-   Para formularios grandes, considera usar `@bind.lazy` para reducir la frecuencia de actualizaciones.
-   Evita usar `@bind` en listas muy largas, ya que puede afectar el rendimiento. En su lugar, considera técnicas de renderizado virtual.

## Conclusión

La directiva `@bind` es una herramienta poderosa en asor.js para crear interfaces de usuario reactivas. Facilita la sincronización entre el DOM y el estado del componente, permitiendo crear aplicaciones interactivas con menos código y de manera más declarativa.
