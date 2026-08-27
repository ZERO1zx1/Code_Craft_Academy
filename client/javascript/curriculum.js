export const COURSE_ORDER = ["html", "css", "javascript", "python", "github"];

const courseMeta = {
  html: { name: "HTML", accent: "#e86c31", topic: "Semantic HTML", source: "https://developer.mozilla.org/en-US/docs/Web/HTML", intro: "Веб хуудасны утгатай бүтэц ба агуулгыг бүтээ." },
  css: { name: "CSS", accent: "#2876d4", topic: "Layout & UI", source: "https://developer.mozilla.org/en-US/docs/Web/CSS", intro: "Харагдац, зохиомж, responsive интерфэйсийг удирд." },
  javascript: { name: "JavaScript", accent: "#b07d11", topic: "Browser logic", source: "https://developer.mozilla.org/en-US/docs/Web/JavaScript", intro: "Веб интерфэйсийг үйлдэлтэй, интерактив болго." },
  python: { name: "Python", accent: "#287852", topic: "Python data", source: "https://docs.python.org/3/", intro: "Өгөгдөл, нөхцөл, давталт, функцээр бодлого шийд." },
  github: { name: "GitHub", accent: "#6c4ca5", topic: "Git workflow", source: "https://docs.github.com/en", intro: "Repository, commit, branch, pull request урсгалыг ойлго." },
};

const concepts = {
  html: ["HTML гэж юу вэ?", "html element", "head element", "body element", "h1 heading", "p paragraph", "a link", "img image", "ul list", "ol list", "li item", "div container", "section", "article", "nav", "header", "footer", "main", "form", "label", "input", "button", "table", "semantic audit"],
  css: ["CSS гэж юу вэ?", "selector", "class selector", "color", "background", "margin", "padding", "border", "display", "width", "height", "font-size", "font-family", "flex", "grid", "gap", "position", "media query", ":hover", "transition", "box model", "responsive layout", "custom property", "CSS audit"],
  javascript: ["JavaScript гэж юу вэ?", "variable", "string", "number", "boolean", "array", "object", "function", "parameter", "return", "if statement", "loop", "forEach", "DOM query", "event listener", "click event", "textContent", "classList", "form event", "async", "fetch concept", "try catch", "module", "JS audit"],
  python: ["Python гэж юу вэ?", "print", "variable", "string", "integer", "float", "boolean", "list", "dictionary", "if", "elif", "for loop", "while loop", "function", "parameter", "return", "import", "range", "list method", "file concept", "exception", "comprehension", "module", "Python audit"],
  github: ["GitHub гэж юу вэ?", "repository", "README", "git status", "git add", "git commit", "commit message", "git push", "git pull", "branch", "git switch", "pull request", "code review", "issue", "label", "milestone", "clone", "fork", "merge conflict", ".gitignore", "profile README", "pinned repository", "project board", "Git workflow audit"],
};

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "lesson";
}

function codeFor(language, term) {
  if (language === "html") return `<main>\n  <h1>${term}</h1>\n  <p>CodeCraft Academy</p>\n</main>`;
  if (language === "css") return `.lesson-card {\n  display: flex;\n  gap: 1rem;\n  padding: 1rem;\n}`;
  if (language === "javascript") return `const lesson = "${term}";\nconsole.log(lesson);`;
  if (language === "python") return `lesson = "${term}"\nprint(lesson)`;
  return `git status\ngit add README.md\ngit commit -m "docs: update README"`;
}

function quizFor(lesson, language) {
  const common = [
    ["concept", `“${lesson.term}” хичээлийн гол ойлголт аль вэ?`, [lesson.term, "Санамсаргүй сонголт", "Хамааралгүй команд", "Нууц тохиргоо"], 0],
    ["keyword", `${lesson.term}-ийн түлхүүр үгийг танина уу.`, [lesson.keyword, "database", "secret token", "server port"], 0],
    ["prediction", "Энэ жишээг ажиллуулбал юу болох вэ?", ["Тайлбарласан үр дүн гарна", "Файл устна", "Network request явна", "Account үүснэ"], 0],
    ["debug", "Код ажиллахгүй бол эхлээд юу шалгах вэ?", ["Алдааны мэдэгдэл болон syntax", "Нууц token", "Компьютерийн нууц үг", "Repository-г устгах"], 0],
    ["build", "Build requirement-ийг зөв сонгоно уу.", ["Жишээг зорилготой нь тааруулах", "Код огт бичихгүй байх", "Зөвхөн зураг оруулах", "Random output"], 0],
    ["review", "Code review хийхэд аль нь хэрэгтэй вэ?", ["Уншигдахуйц нэр ба зорилго", "Нууц мэдээлэл", "Хамааралгүй мөр", "Шалгалт алгасах"], 0],
    ["match", "Эх сурвалжийг яагаад нээх вэ?", ["Дэлгэрэнгүй албан тайлбар унших", "Хичээлийг түгжих", "XP нэмэх", "Account холбох"], 0],
    ["practice", "Дасгалыг хаана турших вэ?", ["Browser доторх аюулгүй лабораторид", "Нийтийн server дээр", "Бусдын repository дээр", "Нууц сүлжээнд"], 0],
    ["source", "Энэ хичээлийн source link ямар зорилготой вэ?", ["Албан баримт руу очих", "Өгөгдөл цуглуулах", "Төлбөр авах", "Lesson түгжих"], 0],
    ["reflect", "Хичээлийн дараа хийх зөв алхам аль вэ?", ["Өөрийн жижиг жишээг турших", "Кодоо хадгалахгүй орхих", "Lesson хаах", "Хариуг цээжлэх"], 0],
  ];
  return common.map(([kind, question, choices, correct], index) => ({ id: `${lesson.id}-q${index + 1}`, kind, question, choices, correct, explanation: `“${lesson.term}” ойлголтыг жишээ, даалгавар болон албан эх сурвалжтай холбож бататгана.` }));
}

export const courses = COURSE_ORDER.map((id) => {
  const meta = courseMeta[id];
  return {
    id, ...meta,
    lessons: concepts[id].map((term, index) => {
      const lesson = {
        id: `${id}-${slugify(term)}`,
        order: index + 1,
        term,
        keyword: term.split(" ")[0],
        difficulty: index < 8 ? "Анхан" : index < 17 ? "Суурь" : "Сорилт",
        summary: `${term} нь ${meta.name} хөтөлбөрийн ${index + 1}-р ойлголт. Кодын утгыг жишээгээр харж, дараа нь өөрөө туршина.`,
        code: codeFor(id, term),
        source: meta.source,
      };
      return { ...lesson, quiz: quizFor(lesson, id) };
    }),
  };
});

export const findCourse = (id) => courses.find((course) => course.id === id);
export const findLesson = (courseId, lessonId) => findCourse(courseId)?.lessons.find((lesson) => lesson.id === lessonId);
