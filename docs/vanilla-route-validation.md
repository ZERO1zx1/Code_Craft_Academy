# Vanilla route validation

- 2026-08-27: Hash route `#/learn/html/html-element` was checked through the sandbox preview twice.
- Finding: the generated `5173-…manus.computer` preview host was rejected by Vite despite suffix entries in `allowedHosts`.
- Resolution: set the development-only Vite `allowedHosts` option to `true`; the static production build has no Vite development host gate.
- 2026-08-27: Browser localhost route check нь `#/learn/html/html-element` URL-д 404 гаргав. Энэ нь router-ийн алдаа биш; curriculum lesson ID нь course prefix агуулдаг тул зөв URL нь `#/learn/html/html-html-element` байна.
- 2026-08-27: `http://localhost:5173/#/learn/html/html-html-element` route амжилттай ачаалсан. Default HTML code example-ийн “Код шалгах” үйлдэл `✓ HTML structure танигдлаа` гэсэн browser-local feedback харуулсан.
- 2026-08-27: `http://localhost:5173/#/learn/javascript/javascript-javascript` route амжилттай ачаалсан. Default JavaScript example нь `✓ JavaScript ажиллалаа` гэсэн feedback, `console.log` output-ийг browser дотор харуулсан.
- 2026-08-27: `http://localhost:5173/#/learn/python/python-python` route амжилттай ачаалсан. Pyodide browser runtime дээр default Python example-ийг ажиллуулж, `✓ Python ажиллалаа` гэсэн feedback авсан.
