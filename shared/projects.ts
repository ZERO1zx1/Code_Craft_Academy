import type { Course } from "./curriculum";

export type ProjectRubricKey = "functionality" | "codeQuality" | "userExperience" | "completeness";

export type CourseProject = {
  courseId: Course["id"];
  lessonId: string;
  title: string;
  summary: string;
  requirements: string[];
  rubric: Record<ProjectRubricKey, { label: string; max: number; description: string }>;
};

export const courseProjects: CourseProject[] = [
  {
    courseId: "python",
    lessonId: "py-project",
    title: "Тушаалын мөрийн сургалтын бүртгэл",
    summary: "Сурсан хичээл, оноо болон ахицыг бүртгэж, хайж, тайлан гаргадаг Python командын мөрийн апп.",
    requirements: ["Даалгавар болон төлөвийг бүтэцтэй өгөгдөлд хадгалах", "Нэмэх, харах, хайх гэсэн үндсэн урсгалыг хэрэгжүүлэх", "Буруу тушаалд ойлгомжтой алдаа болон дараагийн алхмыг харуулах"],
    rubric: {
      functionality: { label: "Ажиллагаа", max: 40, description: "Гол урсгалууд найдвартай ажиллаж байгаа эсэх" },
      codeQuality: { label: "Кодын чанар", max: 25, description: "Функцийн задаргаа, нэршил, уншихад ойлгомжтой байдал" },
      userExperience: { label: "Хэрэглэгчийн урсгал", max: 20, description: "Тушаал, гаралт болон алдааны мэдэгдлийн ойлгомж" },
      completeness: { label: "Гүйцэтгэл", max: 15, description: "Шаардлага болон баримтжуулалт бүрэн эсэх" },
    },
  },
  {
    courseId: "html",
    lessonId: "html-project",
    title: "Хүртээмжтэй сургалтын нүүр хуудас",
    summary: "Утга бүхий бүтэцтэй, гарын товчлуур болон дэлгэц уншигчаар ашиглахад ойлгомжтой сургалтын нүүр хуудас.",
    requirements: ["Нэг h1-тэй зөв гарчгийн шатлал ашиглах", "Header, nav, main, section, footer элементээр утга бүхий бүтэц үүсгэх", "Маягт болон медиа элементүүдэд хүртээмжийн үндсэн шаардлагыг хэрэгжүүлэх"],
    rubric: {
      functionality: { label: "Ажиллагаа", max: 40, description: "Шилжилт, маягт болон медиа урсгалууд ажиллах эсэх" },
      codeQuality: { label: "Тэмдэглэгээний чанар", max: 25, description: "Утга бүхий бүтэц, энгийн ба засварлахад хялбар тэмдэглэгээ" },
      userExperience: { label: "Хүртээмж", max: 20, description: "Гарын товчлуур, шошго, alt тайлбар болон харааны шатлал" },
      completeness: { label: "Гүйцэтгэл", max: 15, description: "Даалгаврын гол хэсгүүд бүрэн эсэх" },
    },
  },
  {
    courseId: "css",
    lessonId: "css-project",
    title: "Хувийн сургалтын самбар",
    summary: "Загварын хувьсагч болон дахин ашиглах бүрэлдэхүүнээр бүтсэн дэлгэцэд дасан зохицох сургалтын самбар.",
    requirements: ["Гар утсыг тэргүүнд тавьсан, дэлгэцэд дасан зохицох байрлал хэрэгжүүлэх", "Зай, өнгө, булангийн радиуст загварын хувьсагч ашиглах", "Фокус, заагч очих болон хөдөлгөөнийг багасгах төлөвийг харгалзах"],
    rubric: {
      functionality: { label: "Ажиллагаа", max: 40, description: "Байрлал болон дэлгэцийн цэгүүд тогтвортой ажиллах эсэх" },
      codeQuality: { label: "CSS систем", max: 25, description: "Загварын хувьсагч, бүрэлдэхүүнийг дахин ашиглах, онцгой байдлын хяналт" },
      userExperience: { label: "Хэрэглэгчийн интерфейс ба туршлага", max: 20, description: "Харааны шатлал, хүрэхэд тохирох талбай, фокус ба хөдөлгөөний туршлага" },
      completeness: { label: "Гүйцэтгэл", max: 15, description: "Төлөвлөгдсөн дэлгэц болон төлвүүд бүрэн эсэх" },
    },
  },
  {
    courseId: "javascript",
    lessonId: "js-project",
    title: "Интерактив шалгалтын хөдөлгүүр",
    summary: "Олон асуулт, явц, хугацаа, үр дүн, дахин оролдох урсгалтай интерактив шалгалтын хөдөлгүүр.",
    requirements: ["Асуулт, сонголт, оноо болон үр дүнгийн төлвийг удирдах", "Гарын товчлуурын удирдлага болон дахин оролтын урсгал нэмэх", "Ачаалж буй, алдаатай, амжилттай төлвийн бодит өгөгдлийн урсгалын аль нэгийг хэрэгжүүлэх"],
    rubric: {
      functionality: { label: "Ажиллагаа", max: 40, description: "Шалгалтын төлөв, оноолт болон дахин оролт найдвартай эсэх" },
      codeQuality: { label: "JavaScript бүтэц", max: 25, description: "Модулийн зааг, функцийн зохиомж, төлвийн ойлгомж" },
      userExperience: { label: "Харилцан үйлдэл", max: 20, description: "Санал хүсэлт, гарын товчлуурын урсгал, алдаа ба ачаалж буй төлөв" },
      completeness: { label: "Гүйцэтгэл", max: 15, description: "Шаардлага болон богино баримтжуулалт бүрэн эсэх" },
    },
  },
];

export function getCourseProject(courseId: Course["id"]) {
  return courseProjects.find((project) => project.courseId === courseId);
}
