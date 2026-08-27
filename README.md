# CodeCraft Academy

CodeCraft Academy нь **backend, database, нэвтрэлт шаарддаггүй**, цэвэр vanilla HTML, CSS, ES-module JavaScript бүтэцтэй нээлттэй сургалтын вебсайт юм. HTML, CSS, JavaScript, Python, GitHub гэсэн таван тусдаа сургалтын зам тус бүр **24 бодит `.html` lesson file**-тэй; нийт 120 lesson бүгд шууд нээгдэнэ.

## Physical source бүтэц

| Хавтас / файл | Үүрэг |
|---|---|
| `client/index.html` | Нүүр хуудас; search/filter ба таван course-ийн шууд link |
| `client/lessons/html/` | 24 HTML lesson болон `index.html` жагсаалт |
| `client/lessons/css/` | 24 CSS lesson болон `index.html` жагсаалт |
| `client/lessons/javascript/` | 24 JavaScript lesson болон `index.html` жагсаалт |
| `client/lessons/python/` | 24 Python lesson болон `index.html` жагсаалт |
| `client/lessons/github/` | 24 GitHub lesson болон `index.html` жагсаалт |
| `client/javascript/lesson-page.js` | Static lesson page-ийн quiz, HTML/CSS/JS live preview, Python browser terminal, GitHub simulator interaction |
| `client/javascript/curriculum.js` | Source curriculum data; generator шинэчлэхэд хэрэглэнэ |
| `scripts/generate-static-lessons.mjs` | 120 physical lesson page-ийг дахин deterministic үүсгэнэ |
| `client/css/styles.css`, `client/css/lesson-pages.css`, `client/css/ui-enhancements.css` | Responsive layout, typography, visual explainer, diagram, live lab болон modern UI/UX design system |
| `learning-examples/`, `python/lesson_tools.py` | HTML/CSS/JavaScript/Python тусдаа source example |

Жишээ нь `client/lessons/html/05-html-h1-heading.html` нь GitHub tree-д бодитоор харагдах, шууд нээгдэх HTML хуудас юм. Page бүр өөрийн гарчиг, keyword, монгол тайлбар, **зурагт тайлбар, flow diagram**, кодын жишээ, exercise, Practice Guide, албан эх сурвалжийн link, **10 асуултын quiz markup** агуулна.

## Live lab ба terminal

HTML, CSS, JavaScript lesson бүр editor-ийн кодыг sandboxed iframe-д **шууд preview** хэлбэрээр харуулна. Python lesson нь server шаардалгүй Pyodide ашиглан browser дотор ажиллаж, output-оо local terminal panel-д харуулна. GitHub lesson-ийн terminal нь зөвхөн command structure таних simulation бөгөөд ямар ч repository, token, network, file system ашиглахгүй.

## Ажиллуулах ба үүсгэх

```bash
pnpm install
pnpm generate:lessons
pnpm dev
```

`http://localhost:3000` хаягаар нээнэ. Python дасгал нь browser дотор Pyodide runtime ашигладаг; website өөрөө Python server ажиллуулахгүй.

## Шалгах

```bash
pnpm run validate
```

Энэ command нь 120 source page-ийн physical structure, lesson бүрийн 10 quiz question markup, TypeScript source байхгүйг test-ээр шалгаад, Vite multi-page build-д бүх course болон lesson HTML page-ийг оруулна.
