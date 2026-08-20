export type LessonKind = "concept" | "practice" | "quiz" | "project";

export type Lesson = {
  id: string;
  title: string;
  kind: LessonKind;
  duration: string;
  summary: string;
  tags: string[];
  practice: string;
  quizQuestions: number;
};

export type Course = {
  id: "python" | "html" | "css" | "javascript";
  title: string;
  subtitle: string;
  color: string;
  lessons: Lesson[];
};

export const curriculum: Course[] = [
  {
    id: "python",
    title: "Python — Суурь ойлголтууд",
    subtitle: "Python-ийн түлхүүр үгсээс эхлэн логик, функц, модуль, объект хандалтат ойлголт хүртэл ахина.",
    color: "violet",
    lessons: [
      { id: "py-if", title: "if — нөхцөл шалгах", kind: "concept", duration: "15 мин", summary: "Нөхцөл үнэн үед кодын block хэрхэн ажилладгийг ойлгоно.", tags: ["if", "indentation", "bool"], practice: "Нас, эрх, тасалбарын нөхцөлөөр гурван салаа шийдвэр бич.", quizQuestions: 6 },
      { id: "py-else", title: "else — бусад тохиолдол", kind: "concept", duration: "15 мин", summary: "Хоёр боломжит үр дүнг энгийн, цэвэр логикоор холбох.", tags: ["else", "truthy", "falsy"], practice: "Нууц үг буруу үед “Хандах эрхгүй” гэсэн мэдэгдэл хэвлэ.", quizQuestions: 6 },
      { id: "py-elif", title: "elif — олон нөхцөл", kind: "concept", duration: "18 мин", summary: "Эхний үнэн салаалал дээр зогсох нөхцөлийн дарааллыг тайлбарлана.", tags: ["elif", "branch", "ordering"], practice: "Оноог A/B/C/D болгон ангилж, үр дүнг урьдчилан таа.", quizQuestions: 8 },
      { id: "py-loops", title: "for ба while — давталт", kind: "concept", duration: "24 мин", summary: "Давтагдах өгөгдөл дээр гүйх, нөхцөлөөр давтах, break/continue хэрэглэх.", tags: ["for", "while", "range"], practice: "Сурагчдын оноог гүйлгэж дундаж ба хамгийн өндөр оноог ол.", quizQuestions: 8 },
      { id: "py-functions", title: "def ба return — дахин ашиглах код", kind: "concept", duration: "26 мин", summary: "Параметр, анхдагч утга, return болон жижиг функцийн зохиомж.", tags: ["def", "return", "parameter"], practice: "Тэгш тоо шалгах, оноонд шошго өгөх хоёр функц бич.", quizQuestions: 8 },
      { id: "py-project", title: "Төсөл: CLI сургалтын хянагч", kind: "project", duration: "60 мин", summary: "Сурсан хичээл, оноо, ахицыг командын мөрөөр бүртгэдэг жижиг аппликейшн.", tags: ["project", "list", "dict"], practice: "Өгөгдөл нэмэх, харах, хайх, хадгалах цэс хий.", quizQuestions: 10 },
    ],
  },
  {
    id: "html",
    title: "HTML — Вэбийн бүтэц",
    subtitle: "Таг цээжлэхээс илүү зөв бүтэц, утга, хүртээмжтэй хуудас байгуулна.",
    color: "orange",
    lessons: [
      { id: "html-document", title: "Баримт бичгийн суурь: html, head, body", kind: "concept", duration: "18 мин", summary: "HTML баримт бичгийн үндсэн бүтэц болон мета өгөгдлийг ялгана.", tags: ["html", "head", "body"], practice: "Өөрийн портфолионы зөв үндсэн бүтцийг бич.", quizQuestions: 7 },
      { id: "html-text", title: "Текстийн таг: h1–h6, p, strong, em", kind: "concept", duration: "22 мин", summary: "Гарчиг, догол мөр, онцлолыг семантик утгаар сонгоно.", tags: ["h1-h6", "p", "strong", "em"], practice: "Курсийн танилцуулгыг зөв гарчгийн шатлалтай болго.", quizQuestions: 8 },
      { id: "html-semantic", title: "Утгатай бүтэц: header, nav, main, section, article, footer", kind: "concept", duration: "26 мин", summary: "Хуудсыг байрлалаар бус утгаар нь хэсэгчилж, хүртээмжийг сайжруулна.", tags: ["header", "main", "section", "article"], practice: "Мэдээний хуудсыг утгатай тагуудаар дахин байгуул.", quizQuestions: 10 },
      { id: "html-links-media", title: "Холбоос ба медиа: a, img, video, audio", kind: "concept", duration: "24 мин", summary: "Навигаци, alt тайлбар, дасан зохицох медиа болон гадаад холбоосын үндэс.", tags: ["a", "img", "video", "alt"], practice: "3 хэсэгтэй нүүр хуудсанд навигаци ба медиа нэм.", quizQuestions: 8 },
      { id: "html-forms", title: "Маягт: form, label, input, select, textarea, button", kind: "practice", duration: "32 мин", summary: "Хэрэглэгчийн мэдээлэл авах маягтыг зөв шошго, төрөл, шалгалттай хий.", tags: ["form", "label", "input", "button"], practice: "Курс бүртгүүлэх маягтыг гарнаас бүрэн ашиглагддаг болго.", quizQuestions: 10 },
      { id: "html-project", title: "Төсөл: Хүртээмжтэй сургалтын нүүр хуудас", kind: "project", duration: "70 мин", summary: "Сургалтын бүтээгдэхүүний бодит бүтэцтэй, дэлгэц уншигчид ээлтэй хуудас.", tags: ["semantic", "a11y", "project"], practice: "ARIA-г зөвхөн шаардлагатай газарт хэрэглэж, гарчгийн шалгалт хий.", quizQuestions: 12 },
    ],
  },
  {
    id: "css",
    title: "CSS — Харагдацын систем",
    subtitle: "Байрлал, дасан зохицох загвар, хөдөлгөөн болон загварын хувьсагчаар системтэй интерфэйс бүтээнэ.",
    color: "sky",
    lessons: [
      { id: "css-selectors", title: "Сонгогч, каскад, онцгой чанар", kind: "concept", duration: "22 мин", summary: "CSS дүрэм аль элементэд үйлчлэхийг урьдчилан тааж сурна.", tags: ["selector", "cascade", "specificity"], practice: "Компонентийн загварын зөрчлийг 3 аргаар зас.", quizQuestions: 8 },
      { id: "css-box", title: "Хайрцаг загвар: margin, border, padding, box-sizing", kind: "concept", duration: "24 мин", summary: "Хэмжээ ба хоорондын зайн зөрүүг хөгжүүлэгчийн хэрэгслээр олох.", tags: ["box-model", "spacing", "border"], practice: "Карт компонентийг яг тохирсон хэмжээнд тааруул.", quizQuestions: 8 },
      { id: "css-flex", title: "Flexbox байрлал", kind: "practice", duration: "30 мин", summary: "Нэг чиглэлийн байрлал, тэгшлэл, зай, мөр шилжилтийг бодит интерфэйст хэрэглэх.", tags: ["display:flex", "gap", "align"], practice: "Дасан зохицох навигаци ба картын мөр байгуул.", quizQuestions: 10 },
      { id: "css-grid", title: "Grid байрлал", kind: "practice", duration: "32 мин", summary: "Хоёр чиглэлийн grid, minmax, auto-fit ашиглан хяналтын самбар байгуулна.", tags: ["display:grid", "minmax", "auto-fit"], practice: "Курсийн жагсаалтыг 1–4 баганад уян болго.", quizQuestions: 10 },
      { id: "css-responsive", title: "Дасан зохицох загвар ба media query", kind: "concept", duration: "26 мин", summary: "Гар утаснаас эхлэх цэг, уян үсэглэл, мэдрэгчийн талбайг төлөвлөнө.", tags: ["media-query", "mobile-first", "responsive"], practice: "Компьютерийн хяналтын самбарыг 375px дэлгэцэд эвдэлгүй болго.", quizQuestions: 8 },
      { id: "css-project", title: "Төсөл: Хувийн сургалтын самбар", kind: "project", duration: "80 мин", summary: "Загварын хувьсагч, компонент, төлөвийн хувилбар ашигласан бодит хяналтын самбарын интерфэйс.", tags: ["tokens", "components", "project"], practice: "Цайвар горим, hover/focus, хөдөлгөөн багасгах хувилбар нэм.", quizQuestions: 12 },
    ],
  },
  {
    id: "javascript",
    title: "JavaScript — Вэбийн үйлдэл",
    subtitle: "DOM-оос API хүртэл интерактив, шалгахад амар, хэрэглэгчид ойлгомжтой интерфэйс бүтээнэ.",
    color: "yellow",
    lessons: [
      { id: "js-values", title: "Утга, хувьсагч, функц", kind: "concept", duration: "24 мин", summary: "const/let, анхдагч утга, харьцуулалт, функцийн илэрхийллийг ялгана.", tags: ["const", "let", "function"], practice: "Ахиц тооцдог цэвэр функцүүд бич.", quizQuestions: 8 },
      { id: "js-dom", title: "DOM сонголт ба шинэчлэлт", kind: "practice", duration: "28 мин", summary: "Элемент сонгож, текст/class/attribute-ийг аюулгүй шинэчилнэ.", tags: ["querySelector", "textContent", "classList"], practice: "Курсийн карт дээр шүүлтүүр ба ахицын шинэчлэлт хий.", quizQuestions: 10 },
      { id: "js-events", title: "Үйл явдал ба интерфэйсийн төлөв", kind: "practice", duration: "30 мин", summary: "Click, input, submit үйл явдлыг delegation-тэй зөв холбоно.", tags: ["event", "submit", "state"], practice: "Шалгалтын маягтад оноо бодож тайлбар харуул.", quizQuestions: 10 },
      { id: "js-async", title: "Асинхрон ажиллагаа, fetch, алдааны төлөв", kind: "concept", duration: "34 мин", summary: "Promise, async/await, ачаалж буй/алдаа/амжилттай гурван төлөвийг зохионо.", tags: ["async", "await", "fetch"], practice: "Нийтэд нээлттэй курсийн өгөгдлийг fetch хийгээд ачааллын загвар нэм.", quizQuestions: 10 },
      { id: "js-modules", title: "Модуль ба арчлахад хялбар код", kind: "concept", duration: "28 мин", summary: "export/import, модулийн хил зааг, жижиг тестийн суурь ойлголт.", tags: ["export", "import", "testing"], practice: "Шалгалтын хөдөлгүүрийг өгөгдөл, оноолт, интерфэйсийн модульд салга.", quizQuestions: 8 },
      { id: "js-project", title: "Төсөл: Интерактив шалгалтын хөдөлгүүр", kind: "project", duration: "90 мин", summary: "Олон асуулт, ахиц, хугацаа, үр дүнгийн хураангуй бүхий шалгалтын хөдөлгүүр.", tags: ["project", "api", "state"], practice: "Гарны навигаци, дахин оролдох, үр дүн хуваалцах үйлдэл нэм.", quizQuestions: 14 },
    ],
  },
];

export function getCourse(id: Course["id"]): Course {
  return curriculum.find((course) => course.id === id) ?? curriculum[0];
}

export type QuizQuestion = {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type LessonDetails = {
  examples: string[];
  advancedPractice: string;
  quiz: QuizQuestion[];
};

export const lessonDetails: Record<string, LessonDetails> = {
  "py-if": { examples: ["age = 16\nif age >= 13:\n    print(\"Teen\")"], advancedPractice: "Нас ба тасалбарын төлөвийг хамтад нь шалгаж, хоёр нөхцөлтэй access gate байгуул.", quiz: [{ prompt: "if block хэзээ ажиллах вэ?", options: ["Нөхцөл truthy үед", "Үргэлж", "Зөвхөн алдаатай үед"], answer: 0, explanation: "if нь truthy нөхцөлд өөрийн block-ийг ажиллуулна." }, { prompt: "Python-д block-ийг юу тодорхойлдог вэ?", options: ["Зөвхөн хаалт", "Indentation", "Таслал"], answer: 1, explanation: "Indentation нь block-ийн бүтцийг тодорхойлно." }] },
  "py-else": { examples: ["score = 55\nif score >= 60:\n    print(\"Passed\")\nelse:\n    print(\"Try again\")"], advancedPractice: "Хоосон username, буруу password, зөв хэрэглэгч гэсэн гурван төлөвийг цэвэр fallback логикоор ялга.", quiz: [{ prompt: "else хэдэн үндсэн замын fallback вэ?", options: ["Хоёр дахь", "Гурав дахь", "Дөрөв дэх"], answer: 0, explanation: "if/else нь хоёр боломжит замыг илэрхийлдэг." }, { prompt: "else дотор condition бичих үү?", options: ["Тийм", "Үгүй", "Зөвхөн string үед"], answer: 1, explanation: "Нэмэлт condition хэрэгтэй бол elif хэрэглэнэ." }] },
  "py-elif": { examples: ["score = 82\nif score >= 90:\n    grade = \"A\"\nelif score >= 80:\n    grade = \"B\"\nelse:\n    grade = \"C\""], advancedPractice: "Температурын ангиллыг өндөр утгаас бага руу эрэмбэлж, хил утгуудын тест нэм.", quiz: [{ prompt: "elif-үүдийг ямар дарааллаар шалгадаг вэ?", options: ["Дээрээс доош", "Санамсаргүй", "Доороос дээш"], answer: 0, explanation: "Python эхний truthy branch дээр зогсоно." }, { prompt: "Олон салаатай шийдвэрт юу хэрэглэдэг вэ?", options: ["elif", "import", "yield"], answer: 0, explanation: "elif нь нэмэлт нөхцөл шалгана." }] },
  "py-loops": { examples: ["for i in range(3):\n    print(i)"], advancedPractice: "Давталтын доторх нөхцөлөөр алгасах болон зогсоох хоёр хувилбарыг харьцуул.", quiz: [{ prompt: "for юун дээр давтдаг вэ?", options: ["Iterable", "Зөвхөн integer", "Зөвхөн file"], answer: 0, explanation: "for нь iterable-ийн item бүрээр гүйнэ." }, { prompt: "while ямар үед үргэлжилдэг вэ?", options: ["Condition truthy байх үед", "Нэг л удаа", "Хэзээ ч үгүй"], answer: 0, explanation: "while-ийн condition үнэн хэвээр байвал давтана." }] },
  "py-functions": { examples: ["def add(a, b):\n    return a + b"], advancedPractice: "Input validation хийдэг, жижиг, нэг зорилготой гурван function болгон кодоо refactor хий.", quiz: [{ prompt: "return юу хийдэг вэ?", options: ["Утга буцаана", "Module импортлоно", "Давталт эхлүүлнэ"], answer: 0, explanation: "return function-ийн үр дүнг буцаана." }, { prompt: "def-ийн дараа юу ордог вэ?", options: ["Function name", "HTML tag", "SQL query"], answer: 0, explanation: "def нь function definition эхлүүлнэ." }] },
  "py-project": { examples: ["tasks = []\ntasks.append({\"title\": \"if lesson\", \"done\": False})"], advancedPractice: "Tracker-д JSON файлд хадгалах, ахиц тооцох, invalid command-ийн error message нэм.", quiz: [{ prompt: "Жижиг project-ийн эхний алхам юу вэ?", options: ["Requirement-ийг жижиглэх", "Бүхнийг нэг function-д хийх", "Тестгүй орхих"], answer: 0, explanation: "Requirement-ийг жижиглэх нь хэрэгжүүлэлтийг хянахад тусална." }, { prompt: "CLI tracker юуг хадгалж болох вэ?", options: ["Task ба status", "Зөвхөн өнгө", "Зөвхөн зураг"], answer: 0, explanation: "Task-ийн title, done status зэрэг өгөгдөл хэрэгтэй." }] },
  "html-document": { examples: ["<!doctype html>\n<html lang=\"mn\">\n<head><meta charset=\"utf-8\"></head>\n<body></body>\n</html>"], advancedPractice: "Viewport, title, description, language attribute-тай production-ready document skeleton бич.", quiz: [{ prompt: "Харагдах content хаана байна вэ?", options: ["body", "head", "meta"], answer: 0, explanation: "body нь хэрэглэгчид харагдах document content-ийг агуулна." }, { prompt: "meta charset ямар үүрэгтэй вэ?", options: ["Encoding тодорхойлно", "Зураг зурна", "Form илгээнэ"], answer: 0, explanation: "UTF-8 зэрэг character encoding-ийг заана." }] },
  "html-text": { examples: ["<h1>Python Course</h1>\n<p>Код бичиж сурна.</p>\n<strong>Шинэ</strong>"], advancedPractice: "Heading hierarchy-г нэг h1-тэй, логик h2/h3 бүтэцтэй болгон accessibility audit хий.", quiz: [{ prompt: "Хамгийн гол гарчиг аль нь вэ?", options: ["h1", "h6", "p"], answer: 0, explanation: "h1 нь тухайн page-ийн үндсэн гарчиг." }, { prompt: "strong ямар утга илэрхийлдэг вэ?", options: ["Чухал emphasis", "Зөвхөн том үсэг", "Зураг"], answer: 0, explanation: "strong нь semantic importance илэрхийлдэг." }] },
  "html-semantic": { examples: ["<main>\n  <section><h2>Courses</h2></section>\n  <article><h2>Lesson</h2></article>\n</main>"], advancedPractice: "Div их ашигласан mock page-ийг semantic landmarks болгон refactor хий.", quiz: [{ prompt: "main хэд байх нь зөв бэ?", options: ["Нэг үндсэн main", "Арван main", "Заавал байхгүй"], answer: 0, explanation: "Нэг document-д үндсэн main нэг байна." }, { prompt: "article ямар content-д тохирох вэ?", options: ["Бие даасан content", "Зөвхөн өнгө", "CSS rule"], answer: 0, explanation: "article нь бие даан түгж болох content-д тохирно." }] },
  "html-links-media": { examples: ["<a href=\"/courses\">Courses</a>\n<img src=\"avatar.png\" alt=\"Бат-Эрдэнэ\">"], advancedPractice: "Media бүрт meaningful alt, external link-д rel, video-д captions нэм.", quiz: [{ prompt: "img-ийн alt юунд хэрэгтэй вэ?", options: ["Зургийн орлуулсан тайлбар", "CSS animation", "Database"], answer: 0, explanation: "alt нь зураг ачаалагдахгүй үед болон screen reader-д хэрэгтэй." }, { prompt: "a tag-ийн гол үүрэг юу вэ?", options: ["Navigation link", "Text color", "Form validation"], answer: 0, explanation: "a нь hyperlink үүсгэнэ." }] },
  "html-forms": { examples: ["<label for=\"email\">Email</label>\n<input id=\"email\" type=\"email\" required>"], advancedPractice: "Keyboard focus, invalid message, autocomplete, label association-ийг шалгаж form-оо сайжруул.", quiz: [{ prompt: "label юутай холбогдох ёстой вэ?", options: ["input id", "CSS class", "footer"], answer: 0, explanation: "for нь input-ийн id-тэй таарна." }, { prompt: "required ямар үүрэгтэй вэ?", options: ["Заавал бөглүүлэх", "Зураг харуулах", "API дуудах"], answer: 0, explanation: "required нь native validation идэвхжүүлнэ." }] },
  "html-project": { examples: ["<header>...</header>\n<main><section>...</section></main>\n<footer>...</footer>"], advancedPractice: "Lighthouse болон keyboard navigation ашиглан page-ийн accessibility checklist гарга.", quiz: [{ prompt: "Accessible page-ийн гол шалгуур юу вэ?", options: ["Keyboard ба semantic support", "Зөвхөн gradient", "Зөвхөн animation"], answer: 0, explanation: "Accessibility нь олон төрлийн хэрэглэгчийн хэрэглээг хамарна." }, { prompt: "ARIA-г хэзээ хэрэглэх вэ?", options: ["Native semantic хангалтгүй үед", "Бүх div дээр", "Зөвхөн зурагт"], answer: 0, explanation: "Native HTML боломжгүй үед ARIA нэмнэ." }] },
  "css-selectors": { examples: [".card > h2 { color: #17152c; }\n.card[aria-selected=\"true\"] { outline: 2px solid; }"], advancedPractice: "Specificity-г багасгаж, component styles-ийг predictable болго.", quiz: [{ prompt: "Cascade юуг шийддэг вэ?", options: ["Аль rule үйлчлэх", "HTML parser", "API response"], answer: 0, explanation: "Cascade нь conflicting declaration-ийг эрэмбэлнэ." }, { prompt: "Class selector ямар тэмдэгтэй вэ?", options: [".", "#", "@"], answer: 0, explanation: "Class selector цэгээр эхэлнэ." }] },
  "css-box": { examples: [".card { box-sizing: border-box; padding: 1rem; border: 1px solid; }"], advancedPractice: "Бүх element-д border-box хэрэглэж, visual spacing scale үүсгэ.", quiz: [{ prompt: "padding хаана байрладаг вэ?", options: ["Content ба border-ийн хооронд", "Border-ийн гадна", "Viewport дээр"], answer: 0, explanation: "padding нь content-ийн доторх зай." }, { prompt: "box-sizing border-box юу өгдөг вэ?", options: ["Width-д padding/border орно", "Font өөрчлөнө", "Grid үүсгэнэ"], answer: 0, explanation: "Declared width нь border хүртэл тооцогдоно." }] },
  "css-flex": { examples: [".nav { display: flex; align-items: center; gap: 1rem; }"], advancedPractice: "Wrap, grow, shrink ашиглан mobile navigation ба desktop action group-ийг нэг CSS-ээр дэмж.", quiz: [{ prompt: "Flexbox аль чиглэлд голчлон ажилладаг вэ?", options: ["Нэг чиглэл", "Зөвхөн диагональ", "Зөвхөн 3D"], answer: 0, explanation: "Flex нь row эсвэл column нэг үндсэн чиглэлтэй." }, { prompt: "gap юуг удирддаг вэ?", options: ["Item хоорондын зай", "Border radius", "Font weight"], answer: 0, explanation: "gap нь flex/grid item хоорондын зай." }] },
  "css-grid": { examples: [".catalog { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }"], advancedPractice: "Course catalog-г auto-fit ашиглан breakpoint багатайгаар responsive болго.", quiz: [{ prompt: "Grid хэдэн чиглэл удирдаж чаддаг вэ?", options: ["Хоёр", "Нэг ч үгүй", "Зөвхөн босоо"], answer: 0, explanation: "Grid нь row ба column хоёрыг удирдана." }, { prompt: "minmax юунд хэрэгтэй вэ?", options: ["Доод/дээд хэмжээ", "JS event", "HTML metadata"], answer: 0, explanation: "Grid track-ийн уян хэмжээ тодорхойлно." }] },
  "css-responsive": { examples: ["@media (max-width: 640px) {\n  .layout { grid-template-columns: 1fr; }\n}"], advancedPractice: "375, 768, 1280px гурван viewport-д typography ба touch target-ээ шалга.", quiz: [{ prompt: "Mobile-first гэж юу вэ?", options: ["Жижиг viewport-оос эхлэх", "Зөвхөн mobile app", "Зураггүй page"], answer: 0, explanation: "Base style-ийг жижиг дэлгэцэд бичээд өргөжүүлнэ." }, { prompt: "Media query юуг шалгаж чаддаг вэ?", options: ["Viewport condition", "Database row", "Python loop"], answer: 0, explanation: "Media query нь орчны нөхцөлд style өөрчилнө." }] },
  "css-project": { examples: [":root { --space-4: 1rem; --ink: #17152c; }\n.card { color: var(--ink); }"], advancedPractice: "Design token, dark mode, focus-visible, reduced-motion хувилбарыг нэг dashboard-д нэм.", quiz: [{ prompt: "CSS custom property юунд хэрэгтэй вэ?", options: ["Давтагдах утга хадгалах", "API дуудах", "HTML parse хийх"], answer: 0, explanation: "Token-оор consistency хангана." }, { prompt: "prefers-reduced-motion юуг хүндэтгэдэг вэ?", options: ["Хөдөлгөөн багасгах сонголт", "Цонхны хэмжээ", "Form value"], answer: 0, explanation: "Хэрэглэгчийн motion preference-ийг дагана." }] },
  "js-values": { examples: ["const progress = 68;\nconst label = progress >= 60 ? \"Ready\" : \"Keep going\";"], advancedPractice: "Pure function-уудаар progress, streak, badge eligibility тооцоол.", quiz: [{ prompt: "const хувьсагчийг дахин оноож болох уу?", options: ["Үгүй", "Тийм, үргэлж", "Зөвхөн string"], answer: 0, explanation: "const binding дахин оноогдохгүй." }, { prompt: "Function юу өгдөг вэ?", options: ["Дахин ашиглах behavior", "CSS only", "Database schema"], answer: 0, explanation: "Function нь behavior-ийг нэрлэж дахин хэрэглэнэ." }] },
  "js-dom": { examples: ["const title = document.querySelector(\"h1\");\ntitle.textContent = \"Updated\";"], advancedPractice: "DOM update бүрийн өмнө null case шалгаж, innerHTML-ээс зайлсхий.", quiz: [{ prompt: "querySelector юу буцаах вэ?", options: ["Matching element", "Python list", "CSS file"], answer: 0, explanation: "Selector-т таарсан эхний element-ийг буцаана." }, { prompt: "textContent юуг өөрчилдөг вэ?", options: ["Text", "Network", "Database"], answer: 0, explanation: "Element-ийн text content-ийг аюулгүй шинэчилнэ." }] },
  "js-events": { examples: ["button.addEventListener(\"click\", () => {\n  state.open = !state.open;\n});"], advancedPractice: "Quiz form-ийн event delegation, submit preventDefault, keyboard shortcut нэм.", quiz: [{ prompt: "click event хэзээ үүсэх вэ?", options: ["Хэрэглэгч дарсан үед", "Page build үед", "CSS parse үед"], answer: 0, explanation: "click нь pointer activation-оор үүснэ." }, { prompt: "preventDefault ямар үүрэгтэй вэ?", options: ["Default browser action зогсооно", "Color өөрчилнө", "API cache хийнэ"], answer: 0, explanation: "Form submit зэрэг default үйлдлийг зогсооно." }] },
  "js-async": { examples: ["async function loadCourses() {\n  const response = await fetch(\"/api/courses\");\n  return response.json();\n}"], advancedPractice: "Loading, empty, error, success дөрвөн UI state-ийг тусад нь харуул.", quiz: [{ prompt: "await хаана хэрэглэгддэг вэ?", options: ["async function дотор", "CSS selector дотор", "HTML tag дотор"], answer: 0, explanation: "await нь promise-г async function дотор хүлээнэ." }, { prompt: "fetch юу хийдэг вэ?", options: ["HTTP request эхлүүлнэ", "DOM устгана", "CSS compile хийнэ"], answer: 0, explanation: "fetch нь network request хийх API." }] },
  "js-modules": { examples: ["export function scoreQuiz(items) {\n  return items.filter(Boolean).length;\n}"], advancedPractice: "Quiz engine-ийг data, scoring, renderer, persistence гэсэн boundary-д салга.", quiz: [{ prompt: "export юу хийдэг вэ?", options: ["Module-ээс утга гаргана", "HTML render хийнэ", "CSS reset хийнэ"], answer: 0, explanation: "export нь өөр module-д ашиглуулах утга гаргана." }, { prompt: "Module boundary-ийн ашиг юу вэ?", options: ["Хариуцлагыг салгана", "Бүхнийг global болгоно", "Алдааг нуух"], answer: 0, explanation: "Жижиг, хариуцлага тусгаарласан код maintainable." }] },
  "js-project": { examples: ["const result = answers.reduce((score, answer) => score + (answer.correct ? 1 : 0), 0);"], advancedPractice: "Retry, result share, timer pause, keyboard navigation, optimistic save-г нэм.", quiz: [{ prompt: "Quiz engine-ийн result юуг агуулж болох вэ?", options: ["Score ба feedback", "Зөвхөн CSS", "Зөвхөн image"], answer: 0, explanation: "Learner-д score, тайлбар, next step хэрэгтэй." }, { prompt: "Async quiz-д error state хэрэгтэй юу?", options: ["Тийм", "Үгүй", "Зөвхөн offline"], answer: 0, explanation: "Network fail үед ойлгомжтой feedback зайлшгүй." }] },
};

export type PathStage = {
  stage: number;
  title: string;
  courseId: Course["id"];
  prerequisite: string;
  unlocks: string;
};

export const learningPath: PathStage[] = [
  { stage: 1, title: "Логик сэтгэлгээ ба тооцооллын суурь", courseId: "python", prerequisite: "Эхлэл", unlocks: "HTML-ийн утгатай бүтэц" },
  { stage: 2, title: "Вэбийн утгатай бүтэц", courseId: "html", prerequisite: "Python хичээлийн 60%", unlocks: "CSS-ийн байрлалын систем" },
  { stage: 3, title: "Байрлал ба дасан зохицох интерфэйс", courseId: "css", prerequisite: "HTML хичээлийн 70%", unlocks: "JavaScript DOM" },
  { stage: 4, title: "Интерактив вэб аппликейшн", courseId: "javascript", prerequisite: "CSS хичээлийн 60%", unlocks: "Төгсгөлийн портфолио төсөл" },
];

/** Full 20-keyword inventory from Python_Keywords_Complete_Course_MN.pdf. Related keywords are grouped into practice lessons to avoid duplicate beginner pages. */
export const pythonKeywordInventory = [
  "if", "else", "elif", "for", "while", "def", "return", "class", "import", "from",
  "try", "except", "True", "False", "None", "and", "or", "not", "in", "is",
] as const;

export const pythonKeywordLessonMapping: Record<string, string> = {
  if: "py-if", else: "py-else", elif: "py-elif", for: "py-loops", while: "py-loops",
  def: "py-functions", return: "py-functions", class: "py-project", import: "py-project", from: "py-project",
  try: "py-project", except: "py-project", True: "py-if", False: "py-else", None: "py-functions",
  and: "py-if", or: "py-elif", not: "py-else", in: "py-loops", is: "py-functions",
};

export type LearnerProgress = Partial<Record<Course["id"], number>>;

export type PathStageStatus = PathStage & {
  progress: number;
  unlocked: boolean;
  prerequisiteComplete: boolean;
  current: boolean;
};

export function getLearningPathStatus(progress: LearnerProgress): PathStageStatus[] {
  let previousComplete = true;
  let currentAssigned = false;
  return learningPath.map((stage) => {
    const courseProgress = Math.max(0, Math.min(100, progress[stage.courseId] ?? 0));
    const prerequisiteComplete = previousComplete;
    const unlocked = prerequisiteComplete;
    const current = unlocked && !currentAssigned && courseProgress < 100;
    if (current) currentAssigned = true;
    previousComplete = courseProgress >= 60;
    return { ...stage, progress: courseProgress, unlocked, prerequisiteComplete, current };
  });
}


export const courseCoverage = {
  html: {
    document: ["<!doctype html>", "html", "head", "meta", "title", "link", "style", "body"],
    text: ["h1", "h2", "h3", "h4", "h5", "h6", "p", "strong", "em", "blockquote", "code", "pre", "abbr"],
    structure: ["header", "nav", "main", "section", "article", "aside", "footer", "address"],
    media: ["a", "img", "picture", "source", "video", "audio", "track", "iframe"],
    data: ["ul", "ol", "li", "dl", "dt", "dd", "table", "caption", "thead", "tbody", "tr", "th", "td"],
    forms: ["form", "label", "input", "select", "option", "textarea", "button", "fieldset", "legend", "datalist", "output"],
    accessibility: ["lang", "alt", "for", "aria-label", "tabindex", "autocomplete"],
  },
  css: {
    foundations: ["selector", "cascade", "inheritance", "specificity", "box-sizing", "custom properties"],
    layout: ["display", "position", "z-index", "Flexbox", "Grid", "gap", "minmax", "container"],
    responsive: ["mobile-first", "@media", "fluid type", "clamp", "logical properties", "touch targets"],
    visual: ["color", "gradient", "border", "shadow", "transform", "transition", "@keyframes"],
    quality: [":focus-visible", "prefers-reduced-motion", "contrast", "design tokens", "component states"],
  },
  javascript: {
    language: ["const", "let", "primitive values", "arrays", "objects", "destructuring", "spread", "functions", "scope"],
    browser: ["querySelector", "textContent", "classList", "attributes", "events", "form submission", "event delegation"],
    async: ["Promise", "async/await", "fetch", "JSON", "loading state", "error state", "retry"],
    architecture: ["export", "import", "modules", "pure functions", "validation", "testing", "debugging"],
    projects: ["quiz engine", "API-driven catalog", "progress tracker", "accessible interaction"],
  },
} as const;
