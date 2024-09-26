# Directiva @ref

## Introducción

La directiva `@ref` en asor.js proporciona una forma de obtener referencias directas a elementos del DOM. Esto es útil cuando necesitas interactuar con el elemento directamente, por ejemplo, para manipular su contenido, enfocarlo, o acceder a propiedades específicas del elemento.

## Sintaxis Básica

La sintaxis básica de la directiva `@ref` es la siguiente:

```html
<elemento @ref="nombreReferencia"></elemento>
```

Donde `nombreReferencia` es el nombre con el que podrás acceder a este elemento en tu componente.

## Uso Básico

### Referenciando un Elemento Simple

```html
<input @ref="campoNombre" />
<button @on:click="$refs.campoNombre.focus()">Enfocar campo</button>
```

En este ejemplo, se pasa como referencia al input `$refs.campoNombre.focus()`.

### Accediendo a Valores de Inputs

```html
<input @ref="campoEdad" type="number" />
<button @on:click="mostrarEdad()">Mostrar Edad</button>

<script>
    function mostrarEdad() {
        alert("La edad es: " + this.$refs.campoEdad.value);
    }
</script>
```

## Características Avanzadas

### Referencias en Bucles

Cuando usas `@ref` dentro de un bucle `@for`, obtendrás un array de referencias:

```html
<ul>
    <li @for="item in items" @ref="listaItems">
        <span :text="item"></span>
    </li>
</ul>

<script>
    function contarItems() {
        console.log("Número de items:", this.$refs.listaItems.length);
    }
</script>
```

### Acceso a Componentes Personalizados

Si usas `@ref` en un componente personalizado, obtendrás una referencia al componente en lugar del elemento DOM:

```html
<element @ref="valor"></element>

<script>
    function ejecutarMetodoEnComponente() {
        this.$refs.valor.algunMetodo();
    }
</script>
```

## Buenas Prácticas

1. **Uso Moderado**: Utiliza `@ref` solo cuando sea necesario. Para la mayoría de los casos, las directivas de asor como `@bind` son suficientes.
2. **No Modifiques el DOM Directamente**: Aunque `@ref` te da acceso directo al DOM, es mejor evitar modificarlo directamente cuando sea posible.
3. **Inicialización**: Asegúrate de que el elemento referenciado existe antes de intentar acceder a él, especialmente en métodos del ciclo de vida del componente.

## Errores Comunes

1. **Acceder a Referencias Antes de que Estén Disponibles**:
   Asegúrate de que el DOM se ha renderizado antes de intentar acceder a las referencias.

2. **Olvidar el Prefijo `$refs`**:
   Siempre accede a las referencias a través de `this.$refs` en los métodos del componente.

3. **Usar `@ref` en Elementos Dinámicos sin Precaución**:
   Ten cuidado al usar `@ref` en elementos que pueden ser eliminados o recreados dinámicamente.

## Consideraciones de Rendimiento

-   Evita crear demasiadas referencias, especialmente en listas largas, ya que cada referencia consume memoria.
-   Si necesitas referencias en una lista larga, considera usar una estrategia de referencia dinámica basada en índices o IDs.

## Conclusión

La directiva `@ref` es una herramienta poderosa en asor.js para acceder directamente a elementos del DOM cuando las directivas declarativas no son suficientes. Usada con precaución, puede proporcionar soluciones elegantes para escenarios complejos de manipulación del DOM.
