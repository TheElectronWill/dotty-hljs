# Scala 3 grammar for Highlight.js

## How to use

Add `scala3.js` to your webpage and register the language in hljs.

```html
<script>
    hljs.registerLanguage('scala3', highlightDotty);
    hljs.registerAliases('dotty', 'scala3');
</script>
```

Then use hljs as usual, e.g.
```html
<pre><code class="language-scala3">enum ItWorks(val x: Boolean)</code></pre>
<script>
    hljs.initHighlightingOnLoad();
</script>
```
