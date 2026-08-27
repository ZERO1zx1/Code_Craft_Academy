export type QuizQuestionKind = "concept" | "keyword" | "predict" | "debug" | "build" | "review" | "source";

export type LessonQuizQuestion = {
  id: string;
  kind: QuizQuestionKind;
  label: string;
  question: string;
  code?: string;
  choices: string[];
  answer: number;
  explanation: string;
};

export type QuizSeed = {
  lessonId: string;
  language: string;
  term: string;
  meaning: string;
  code: string;
  starter: string;
  expected: string[];
};

const distractors = ["Зөвхөн зураг оруулдаг command.", "Browser эсвэл terminal-ийг хаадаг command.", "Ямар ч шаардлагагүй placeholder."];

export function buildLessonQuiz(seed: QuizSeed): LessonQuizQuestion[] {
  const requirement = seed.expected[0] ?? seed.term;
  const codeLine = seed.code.split("\n").find((line) => line.trim()) ?? seed.code;
  const questions: LessonQuizQuestion[] = [
    { id: "concept", kind: "concept", label: "CONCEPT CHECK", question: `${seed.term} ямар зорилготой вэ?`, choices: [seed.meaning, ...distractors.slice(0, 2)], answer: 0, explanation: seed.meaning },
    { id: "keyword", kind: "keyword", label: "KEYWORD FINDER", question: "Энэ lesson-ийн гол tag, property эсвэл keyword аль нь вэ?", choices: [seed.term, "document.close", "image-only"], answer: 0, explanation: `Энэ lesson-ийн төв ойлголт нь ${seed.term} юм.` },
    { id: "predict", kind: "predict", label: "OUTPUT PREDICT", question: "Доорх example-ийг ажиглаад ямар ойлголт хэрэгжсэнийг сонго.", code: codeLine, choices: [`${seed.term} ашигласан жишээ`, "Network request эхлүүлсэн жишээ", "Файл устгах жишээ"], answer: 0, explanation: `Example нь ${seed.term}-ийн үндсэн хэрэглээг харуулж байна.` },
    { id: "debug", kind: "debug", label: "DEBUG DIAGNOSIS", question: `Code review хийхэд ${seed.term}-тэй холбоотой ямар зүйл эхэлж шалгах вэ?`, code: seed.starter, choices: [`${requirement} requirement биелсэн эсэх`, "Browser history арилсан эсэх", "Screen-ийн хэмжээг өөрчилсөн эсэх"], answer: 0, explanation: `Энэ lesson-ийн challenge-д ${requirement} requirement шаардлагатай.` },
    { id: "build", kind: "build", label: "BUILD REQUIREMENT", question: "Ижил төрлийн жижиг дасгал эхлүүлэхэд аль алхам хамгийн зөв бэ?", choices: [`${seed.term}-ийг purpose-той нь ашиглаад, requirement-аа шалгах`, "Code-ийг ойлголгүйгээр шууд хуулж тавих", "Хамааралгүй command ажиллуулах"], answer: 0, explanation: `Эхлээд ${seed.term}-ийн зориулалтыг ойлгож, дараа нь шаардлагатай бүтэц эсвэл behavior-ийг шалгана.` },
    { id: "review", kind: "review", label: "CODE REVIEW", question: "Review-ийн дараа сайн хариулт аль нь вэ?", choices: [`${seed.term}-ийн хэрэглээг жишээ болон requirement-тэй тулгах`, "Асуултыг алгасаж дараагийн lesson рүү орох", "Зөвхөн өнгийг өөрчлөх"], answer: 0, explanation: `Code review нь ${seed.term} зөв purpose-оор ашиглагдсан эсэхийг батлахад тусална.` },
    { id: "meaning", kind: "concept", label: "MEANING MATCH", question: `${seed.term}-ийн тайлбарт хамгийн тохирох өгүүлбэр аль нь вэ?`, choices: [seed.meaning, "Энэ нь дан ганц design image үүсгэнэ.", "Энэ нь account нууц үг солиход ашиглагдана."], answer: 0, explanation: seed.meaning },
    { id: "requirement", kind: "build", label: "REQUIREMENT CHECK", question: "Automated check амжилттай болохын тулд юу хэрэгтэй вэ?", choices: [`Exercise-ийн шаардсан ${requirement} болон зөв бүтэц/behavior`, "Зөвхөн урт тайлбар", "Хамааралгүй шинэ package"], answer: 0, explanation: `Validator нь ${requirement} зэрэг lesson-specific requirement-ийг шалгана.` },
    { id: "practice", kind: "review", label: "PRACTICE DECISION", question: "Дараагийн бодит project дээр энэ ойлголтыг хэрэглэх зөв арга аль нь вэ?", choices: [`${seed.term}-ийг жижиг, утгатай хэрэглээн дээр туршиж source-оо лавлах`, "Source-гүйгээр random code ажиллуулах", "Exercise-ийг дангаар нь цээжлэх"], answer: 0, explanation: `Жижиг, purpose-той туршилт ба source check нь ${seed.term}-ийг тогтоох найдвартай арга юм.` },
    { id: "source", kind: "source", label: "SOURCE AWARENESS", question: "Энэ lesson-ийн дараа албан source-оос юу шалгах нь хамгийн хэрэгтэй вэ?", choices: [`${seed.term}-ийн reference, syntax, өөр жишээнүүд`, "Хамааралгүй social post", "Төхөөрөмжийн wallpaper"], answer: 0, explanation: `Official reference нь ${seed.term}-ийн нарийн syntax болон хэрэглэх нөхцөлийг тайлбарладаг.` },
  ];
  return questions.map((question, index) => ({ ...question, id: `${seed.lessonId}-${index + 1}-${question.id}` }));
}
