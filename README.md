# CodeCraft Academy

CodeCraft Academy нь **цэвэр HTML, CSS, JavaScript**-ээр бичсэн, backend болон бүртгэл шаарддаггүй нээлттэй сургалтын вебсайт юм. HTML, CSS, JavaScript, Python, GitHub гэсэн таван тусдаа сургалтын замтай бөгөөд зам бүр 24 хичээл, жишээ код, аюулгүй browser дасгал, Practice Guide, 10 асуулттай сорил агуулна.

## Source бүтэц

| Хавтас / файл | Үүрэг |
|---|---|
| `client/index.html` | Вебсайтын HTML entrypoint |
| `client/css/styles.css` | Responsive харагдац, layout, өнгө, typography |
| `client/javascript/app.js` | Route, search/filter, quiz, DOM interaction, JS/Python лаборатори |
| `client/javascript/curriculum.js` | 5 course, 120 lesson, 10 асуулттай quiz data |
| `learning-examples/html` | Тусдаа HTML source жишээ |
| `learning-examples/css` | Тусдаа CSS source жишээ |
| `learning-examples/javascript` | Тусдаа JavaScript source жишээ |
| `learning-examples/python` | Тусдаа Python source жишээ |
| `python/lesson_tools.py` | Python lesson content helper жишээ |

## Ажиллуулах

```bash
pnpm install
pnpm dev
```

`http://localhost:3000` хаягаар нээнэ. Python кодыг browser дотор Pyodide runtime ашиглан туршина; вэбсайт өөрөө Python server ажиллуулахгүй.

## Шалгах

```bash
pnpm test
pnpm build
```
