# Directiva @data

## Introducción

La directiva `@data` en asor.js se utiliza para declarar el estado inicial de un componente. Permite definir propiedades directamente en el HTML, que luego pueden ser utilizadas y modificadas por otras directivas de asor.

## Sintaxis Básica

La sintaxis básica de la directiva `@data` es la siguiente:

```html
<elemento @data="propiedad: valor"></elemento>
```

Donde:

-   `propiedad` es el nombre de la propiedad
-   `valor` es el valor inicial de la propiedad

## Uso Básico

### Declaración de Propiedades Simples

```html
<div @data="contador: 0">
    <p :text="contador"></p>
    <button @on:click="contador++">Incrementar</button>
</div>
```

### Declaración de Múltiples Propiedades

```html
<div @data="nombre: 'Juan', edad: 30">
    <p :text="nombre"></p>
    <p :text="edad"></p>
</div>
```

## Características Avanzadas

### Objetos y Arrays

```html
<div
    @data="usuario: { nombre: 'Ana', edad: 28 }, colores: ['rojo', 'verde', 'azul']"
>
    <p :text="usuario.nombre"></p>
    <p :text="usuario.edad"></p>
    <ul>
        <li @for="color in colores" :text="color"></li>
    </ul>
</div>
```

## Integración con Otras Directivas

### Con @bind

```html
<div @data="mensaje: ''">
    <input :value="mensaje" />
    <p :text="mensaje"></p>
</div>
```

### Con @if

```html
<div @data="mostrar: true">
    <button @on:click="mostrar = !mostrar">Toggle</button>
    <p @if="mostrar">Este párrafo se puede ocultar</p>
</div>
```

## Buenas Prácticas

1. **Inicialización de Propiedades**: Siempre inicializa tus propiedades con un valor por defecto.
2. **Nombres Descriptivos**: Usa nombres de propiedades que sean claros y descriptivos.
3. **Evita Lógica Compleja**: La directiva `@data` es para declarar estado, no para lógica compleja.
4. **Modularidad**: Para componentes grandes, considera dividir el estado en múltiples elementos con `@data`.

## Errores Comunes

1. **Olvidar las Comillas**:
   Incorrecto: `<div @data=contador: 0>`
   Correcto: `<div @data="contador: 0">`

2. **Intentar Definir Funciones**:
   Incorrecto: `<div @data="incrementar() { this.contador++ }">`
   Correcto: Las funciones deben definirse en el componente, no en `@data`

3. **Usar Sintaxis de Interpolación**:
   Incorrecto: `<p>{{ contador }}</p>`
   Correcto: `<p :text="contador"></p>`

## Consideraciones de Rendimiento

-   Para componentes con muchas propiedades, considera dividir el estado en múltiples elementos con `@data` para mejorar la eficiencia de las actualizaciones.
-   Evita crear objetos o arrays muy grandes en `@data`, ya que podrían afectar el rendimiento inicial del renderizado.

## Conclusión

La directiva `@data` es fundamental en asor.js para declarar el estado inicial de los componentes. Su uso correcto, junto con otras directivas como `@bind` y `@if`, permite crear interfaces de usuario dinámicas y reactivas de manera declarativa.
