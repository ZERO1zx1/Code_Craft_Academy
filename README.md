# CodeCraft Academy

CodeCraft Academy нь **backend, database, нэвтрэлт шаарддаггүй** vanilla HTML, CSS, ES-module JavaScript сургалтын вебсайт юм. HTML, CSS, JavaScript, Python, GitHub таван зам тус бүр **24 бодит `.html` lesson file**-тэй; нийт 120 lesson бүгд шууд нээгдэнэ.

## Source map

```text
Code_Craft_Academy/
├── .github/workflows/verify.yml      # Node 22 CI: test + static build
├── client/
│   ├── index.html                    # Search/filter бүхий нүүр хуудас
│   ├── css/
│   │   ├── base.css                  # Typography, layout, shared tokens
│   │   └── components/               # Lesson, UI, mini-project styles
│   ├── javascript/
│   │   ├── data/curriculum.js        # 5 × 24 lesson source data
│   │   └── pages/                    # Home ба lesson page interactions
│   └── lessons/                      # 120 шууд нээгдэх physical HTML file
│       ├── html/  ├── css/  ├── javascript/
│       ├── python/ └── github/
├── docs/                             # Curriculum audit, Figma design notes
├── learning-examples/                # Тусдаа language source example
├── python/lesson_tools.py            # Python helper/example source
├── scripts/generate-static-lessons.mjs
└── tests/curriculum.test.js          # Physical-page source contract
```

## Folder бүрийн үүрэг

| Байршил | Агуулга | Яагаад тусдаа вэ? |
|---|---|---|
| `client/lessons/` | 5 course, 120 physical lesson page | GitHub tree болон browser URL-д хичээл бүр ил харагдана. |
| `client/javascript/data/` | Curriculum-ийн structured source | Content нэмэх болон generator input нэг дор байна. |
| `client/javascript/pages/` | Home search/filter, lesson lab/quiz | Data болон page interaction холилдохгүй. |
| `client/css/components/` | Lesson, UI, mini-project styles | Component-specific style-уудыг base rule-ээс салгана. |
| `docs/` | Content audit, design notes | Runtime source-оос тусдаа project documentation байна. |
| `scripts/`, `tests/` | Generation ба source contract | Build-time process болон verification тусгаарлагдана. |

Жишээ нь `client/lessons/html/05-html-h1-heading.html` нь шууд нээгдэх, GitHub дээр бодитоор харагдах HTML page юм. Lesson бүр keyword, монгол тайлбар, зурагт тайлбар, flow diagram, code example, exercise, Practice Guide, mini-project, 10 асуултын quiz болон navigation-тэй.

## Ажиллуулах

```bash
pnpm install
pnpm generate:lessons
pnpm dev
```

## Шалгах

```bash
pnpm run validate
```

Энэ command 120 physical source page, course бүрийн 24 lesson, lesson бүрийн 10 quiz marker, TypeScript source байхгүйг шалгаад Vite multi-page build ажиллуулна. GitHub Actions нь Node 22, pinned pnpm болон энэ validation command-ийг `main` push, pull request бүрд ажиллуулна.

## Browser-local live lab

HTML, CSS, JavaScript нь sandboxed iframe preview ашиглана. Python нь Pyodide runtime-д browser дотор ажиллаж local terminal output харуулна. GitHub command simulator нь зөвхөн command syntax танина; repository, token, network болон file system-д ханддаггүй.
