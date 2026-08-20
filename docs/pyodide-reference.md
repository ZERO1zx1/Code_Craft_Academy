# Pyodide Browser Loading Reference

The official Pyodide 0.26.2 documentation states that browser pages should include `https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js`; that script defines the global async `loadPyodide()` function, which is then called with an `indexURL` pointing to the same `/full/` directory. Source: https://pyodide.org/en/0.26.2/usage/quickstart.html
