import type { Express, Request } from "express";
import multer from "multer";
import { sdk } from "./_core/sdk";
import { saveProjectAttachment } from "./db";
import { storagePut } from "./storage";

const courseIds = ["python", "html", "css", "javascript"] as const;
type CourseId = (typeof courseIds)[number];

const allowedMimeTypes = new Map<string, "image" | "pdf" | "text">([
  ["application/pdf", "pdf"],
  ["image/png", "image"],
  ["image/jpeg", "image"],
  ["image/webp", "image"],
  ["image/gif", "image"],
  ["text/plain", "text"],
  ["text/markdown", "text"],
  ["application/json", "text"],
  ["text/html", "text"],
  ["text/css", "text"],
  ["text/javascript", "text"],
  ["application/javascript", "text"],
  ["text/x-python", "text"],
  ["application/x-python-code", "text"],
]);

const extensionMimeFallback = new Map<string, [string, "text"]>([
  [".py", ["text/x-python", "text"]],
  [".js", ["text/javascript", "text"]],
  [".ts", ["text/plain", "text"]],
  [".html", ["text/html", "text"]],
  [".css", ["text/css", "text"]],
  [".md", ["text/markdown", "text"]],
  [".txt", ["text/plain", "text"]],
  [".json", ["application/json", "text"]],
]);

function normaliseAttachmentType(file: Express.Multer.File) {
  if (allowedMimeTypes.has(file.mimetype)) return { mimeType: file.mimetype, previewKind: allowedMimeTypes.get(file.mimetype)! };
  const extension = file.originalname.toLowerCase().match(/\.[a-z0-9]+$/)?.[0];
  const fallback = extension ? extensionMimeFallback.get(extension) : undefined;
  return fallback ? { mimeType: fallback[0], previewKind: fallback[1] } : undefined;
}

function safeFileName(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^\.+/, "").slice(-160);
  return cleaned || "attachment";
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
});

export function registerProjectAttachmentRoutes(app: Express) {
  app.post("/api/projects/:courseId/attachments", upload.single("file"), async (req: Request<{ courseId: string }>, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user) return res.status(401).json({ message: "Login шаардлагатай." });
      if (!courseIds.includes(req.params.courseId as CourseId)) return res.status(400).json({ message: "Курс буруу байна." });
      if (!req.file) return res.status(400).json({ message: "Нэг файл сонгоно уу." });

      const projectLessonId = typeof req.body.projectLessonId === "string" ? req.body.projectLessonId.trim() : "";
      if (projectLessonId.length < 3 || projectLessonId.length > 96) return res.status(400).json({ message: "Төслийн хичээлийн таних тэмдэг буруу байна." });

      const attachmentType = normaliseAttachmentType(req.file);
      if (!attachmentType) return res.status(415).json({ message: "Зөвхөн PDF, зураг, эсвэл аюулгүй текстэн source файл хавсаргана." });

      const courseId = req.params.courseId as CourseId;
      const fileName = safeFileName(req.file.originalname);
      const stored = await storagePut(`project-attachments/${user.id}/${courseId}/${Date.now()}-${fileName}`, req.file.buffer, attachmentType.mimeType);
      const attachment = await saveProjectAttachment({
        userId: user.id,
        courseId,
        projectLessonId,
        fileName,
        storageKey: stored.key,
        url: stored.url,
        mimeType: attachmentType.mimeType,
        sizeBytes: req.file.size,
        previewKind: attachmentType.previewKind,
      });
      return res.status(201).json({ attachment });
    } catch (error) {
      console.error("[Project attachments] Upload failed", error);
      return res.status(500).json({ message: "Файл хавсаргах үед алдаа гарлаа." });
    }
  });
}
