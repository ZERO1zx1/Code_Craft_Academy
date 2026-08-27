export type CourseId = "html" | "css" | "javascript" | "python";

export type QuizQuestion = {
  prompt: string;
  choices: string[];
  answer: number;
  explanation: string;
};

export type CourseModule = {
  id: CourseId;
  number: string;
  label: string;
  title: string;
  description: string;
  duration: string;
  lessons: number;
  color: string;
  pale: string;
  lessonId: string;
  concepts: string[];
  code: string;
  source: string;
  sourceLabel: string;
  quiz: QuizQuestion[];
};

export const courseModules: CourseModule[] = [
  {
    id: "html", number: "01", label: "HTML", title: "Хуудсын утгатай бүтцийг тавь", duration: "42 мин", lessons: 6,
    description: "Гарчиг, хэсэг, холбоос, semantic element ашиглан уншигдахуйц эхний хуудсаа байгуул.",
    color: "#E46F32", pale: "#FFF0E8", lessonId: "semantic-foundations",
    concepts: ["`main` нь тухайн хуудасны үндсэн агуулгыг тэмдэглэнэ.", "`section` нь холбоотой агуулгыг утгатай бүлэг болгоно.", "`h1` нь хуудасны гол гарчгийг тодорхойлно."],
    code: `<main>\n  <section>\n    <h1>Миний анхны хуудас</h1>\n    <p>Эндээс кодын аялал эхэлнэ.</p>\n  </section>\n</main>`,
    source: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content", sourceLabel: "MDN · HTML content structure",
    quiz: [
      { prompt: "Хуудасны гол агуулгыг илэрхийлэх semantic element аль нь вэ?", choices: ["`main`", "`mark`", "`meta`"], answer: 0, explanation: "`main` нь тухайн баримт бичгийн давтагдашгүй гол агуулгыг тэмдэглэдэг." },
      { prompt: "Хамгийн чухал хуудасны гарчгийг аль tag-ээр эхлүүлэх нь зөв бэ?", choices: ["`p`", "`h1`", "`header`"], answer: 1, explanation: "`h1` нь хуудасны үндсэн гарчигт зориулагдсан." },
      { prompt: "Нэг сэдвийн холбоотой хэсгийг зохион байгуулахад аль element илүү тохиромжтой вэ?", choices: ["`section`", "`span`", "`br`"], answer: 0, explanation: "`section` нь гарчигтай, утгын хувьд холбоотой контентыг бүлэглэхэд ашиглагдана." },
    ],
  },
  {
    id: "css", number: "02", label: "CSS", title: "Бүтцийг уншигдах хэв маягт оруул", duration: "55 мин", lessons: 7,
    description: "Сонгогч, cascade, box model ашиглан HTML бүтцийг зайтай, тэнцвэртэй, responsive харагдацтай болго.",
    color: "#2866D4", pale: "#EAF1FF", lessonId: "box-model-basics",
    concepts: ["Сонгогч нь загварлах HTML элементийг заана.", "Padding нь агуулга ба border-ын доторх зай.", "Margin нь элементүүдийн хоорондох гаднах зай."],
    code: `.profile {\n  max-width: 42rem;\n  margin: 0 auto;\n  padding: 2rem;\n}`,
    source: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics", sourceLabel: "MDN · CSS styling basics",
    quiz: [
      { prompt: "Элементийн агуулга ба border-ын хоорондох зайг аль property удирдах вэ?", choices: ["`margin`", "`padding`", "`gap`"], answer: 1, explanation: "Padding нь box model-ийн дотоод зай юм." },
      { prompt: "Блок элементийг хөндлөн тэнхлэгт төвлөрүүлэх түгээмэл бичлэг аль вэ?", choices: ["`margin: 0 auto`", "`padding: auto`", "`display: center`"], answer: 0, explanation: "Өргөн нь тодорхой эсвэл хязгаарлагдсан блок элементэд `margin: 0 auto` ашиглана." },
      { prompt: "`.card` гэж эхэлсэн selector юу сонгох вэ?", choices: ["class=`card` элемент", "id=`card` элемент", "card нэртэй HTML tag"], answer: 0, explanation: "Цэгээр эхэлсэн selector нь class attribute-д тулгуурладаг." },
    ],
  },
  {
    id: "javascript", number: "03", label: "JavaScript", title: "Хуудасны зан үйлийг холбож эхэл", duration: "64 мин", lessons: 8,
    description: "Өгөгдөл, нөхцөл, функцийн үндсээр хэрэглэгчийн үйлдэлд хариулах жижиг логик бичиж сур.",
    color: "#B98712", pale: "#FFF8DD", lessonId: "functions-and-conditions",
    concepts: ["`const` нь дахин оноохгүй утгыг хадгална.", "Function нь давтагдах логикийг нэрлэж, дахин ашиглахад тусалдаг.", "`if` нь нөхцөлөөс хамаарсан сонголт хийдэг."],
    code: `const learner = "Naraa";\n\nfunction greet(name) {\n  return \`Сайн уу, \${name}!\`;\n}\n\nconsole.log(greet(learner));`,
    source: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", sourceLabel: "MDN · JavaScript Guide",
    quiz: [
      { prompt: "Дахин оноохгүй утгад аль түлхүүр үг илүү тохиромжтой вэ?", choices: ["`const`", "`switch`", "`return`"], answer: 0, explanation: "`const` нь холбоосыг дахин оноохгүй байхад ашиглагдана." },
      { prompt: "Function-аас үр дүн буцаахад аль үг ашиглах вэ?", choices: ["`output`", "`return`", "`yielded`"], answer: 1, explanation: "`return` нь function-ийн үр дүнг буцаадаг." },
      { prompt: "Нөхцөл шалгах үндсэн control flow statement аль нь вэ?", choices: ["`if`", "`import`", "`className`"], answer: 0, explanation: "`if` нь өгөгдсөн илэрхийлэл үнэн эсэхээс хамааран салаалдаг." },
    ],
  },
  {
    id: "python", number: "04", label: "Python", title: "Өгөгдөлтэй ажиллах сэтгэлгээг бэхжүүл", duration: "58 мин", lessons: 7,
    description: "Хувьсагч, list, давталт, function-оор энгийн өгөгдөлтэй ажиллах программын сууриа тавь.",
    color: "#3E7A58", pale: "#EAF6EE", lessonId: "lists-and-loops",
    concepts: ["List нь олон утгыг дарааллаар хадгална.", "`for` нь дараалсан утгуудыг нэг нэгээр нь тойрч ажиллана.", "Function нь тодорхой ажлыг багцлан нэрлэдэг."],
    code: `topics = ["HTML", "CSS", "Python"]\n\nfor topic in topics:\n    print(f"Өнөөдөр: {topic}")`,
    source: "https://docs.python.org/3/tutorial/index.html", sourceLabel: "Python Docs · The Python Tutorial",
    quiz: [
      { prompt: "Python-д олон утгыг дарааллаар хадгалах энгийн бүтэц аль нь вэ?", choices: ["list", "integer", "comment"], answer: 0, explanation: "List нь олон объект агуулж болдог дараалсан бүтэц юм." },
      { prompt: "List-ийн элемент бүрийг тойрон ажиллахад аль бичлэг тохиромжтой вэ?", choices: ["`for item in items:`", "`item -> items`", "`loop(items)`"], answer: 0, explanation: "Python-ийн `for` давталт нь iterable-ээр дарааллаар явдаг." },
      { prompt: "Python блокыг тодорхойлоход юу онцгой үүрэгтэй вэ?", choices: ["Догол мөр", "Таслал", "Хос хаалт"], answer: 0, explanation: "Python нь блокийн бүтцийг догол мөрөөр илэрхийлдэг." },
    ],
  },
];

export const sandboxStarter = {
  javascript: `const topics = ["HTML", "CSS", "JavaScript"];\n\ntopics.forEach((topic, index) => {\n  console.log(\`\${index + 1}. \${topic}\`);\n});`,
  python: `topics = ["HTML", "CSS", "Python"]\n\nfor index, topic in enumerate(topics, start=1):\n    print(f"{index}. {topic}")`,
} as const;
