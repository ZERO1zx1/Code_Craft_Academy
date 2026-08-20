export type CourseDocument = {
  id: string;
  courseId: "python" | "html" | "css" | "javascript";
  title: string;
  description: string;
  kind: "pdf" | "guide";
  href: string;
  pages?: number;
};

export const courseDocuments: CourseDocument[] = [
  {
    id: "python-keywords-mn",
    courseId: "python",
    title: "Python Keywords Complete Course — MN",
    description: "Python keyword, condition, loop, function болон project сэдвүүдийн Монгол хэл дээрх лавлах материал.",
    kind: "pdf",
    href: "/manus-storage/python-keywords-complete-course-mn_a4a9970b.pdf",
    pages: 29,
  },
];
