import type { LanguagePath, PathLesson } from "./curriculumData";
import { difficultyGuidance } from "./curriculumDifficulty";
import { buildLessonQuiz } from "./curriculumQuiz";

type QuestKind = "build" | "debug" | "predict" | "timed";

function gitLesson(id: string, order: number, term: string, title: string, meaning: string, command: string, kind: QuestKind = "build", starter = command): PathLesson {
  const difficulty = difficultyGuidance(order);
  return {
    id,
    order,
    title: `${title} · ${difficulty.label}`,
    duration: "12–18 мин",
    summary: meaning,
    keywords: [{ term, meaning }],
    code: `# ${title}\n${command}`,
    challenge: {
      prompt: `${term} ойлголтын ${difficulty.label.toLowerCase()} шатны Git/GitHub command quest. ${difficulty.guidance}`,
      starter,
      expected: [command],
      hint: `Коммандын дараалал, branch нэр болон option-оо жишээтэй тулгаж шалгана уу: ${command}`,
      xp: kind === "timed" ? 30 : 20,
      kind,
      prediction: kind === "predict" ? { prompt: "Кодыг шалгахаас өмнө энэ lesson-ийн гол command-ийг яг бичнэ үү.", answer: term } : undefined,
    },
    checkpoint: {
      question: `${term} ямар зорилготой вэ?`,
      choices: [meaning, "Repository-г шууд устгадаг command.", "Browser-г хаадаг command."],
      answer: 0,
      explanation: meaning,
    },
    quiz: buildLessonQuiz({ lessonId: id, language: "github", term, meaning, code: command, starter, expected: [command] }),
  };
}

const lessons: PathLesson[] = [
  gitLesson("github-what-is-github", 1, "GitHub", "GitHub гэж юу вэ?", "Git repository-г байршуулж, change history болон collaboration удирддаг cloud platform.", "git --version", "build"),
  gitLesson("github-git-vs-github", 2, "Git", "Git ба GitHub", "Git нь local version-control tool; GitHub нь repository-г remote-д хамтран удирдах platform.", "git status", "predict"),
  gitLesson("github-repository", 3, "repository", "Repository — төслийн сан", "Project-ийн файл, history болон тохиргоог агуулдаг үндсэн сан.", "git init", "build"),
  gitLesson("github-readme", 4, "README.md", "README — төслийн тайлбар", "Project-ийн зорилго, суулгах заавар, ашиглалтыг Markdown-аар тайлбарлах файл.", "touch README.md", "build"),
  gitLesson("github-public-private", 5, "public / private", "Repository-ийн харагдац", "Public repository-г бусад хүн үзэж болно; private repository-д зөвшөөрөлтэй хэрэглэгч л хандана.", "git remote -v", "predict"),
  gitLesson("github-status", 6, "git status", "status — ажлын төлөв", "Working tree, staging area болон commit хүлээж буй өөрчлөлтийг харуулна.", "git status", "timed"),
  gitLesson("github-add", 7, "git add", "add — staging area", "Commit-д оруулах файлын snapshot-ыг staging area-д сонгоно.", "git add README.md", "build"),
  gitLesson("github-commit", 8, "git commit", "commit — history record", "Staged өөрчлөлтийг шалтгааныг тайлбарласан message-тэй history record болгон хадгална.", "git commit -m \"docs: add README\"", "build"),
  gitLesson("github-message", 9, "commit message", "Commit message — тодорхой зорилго", "Commit message нь ямар өөрчлөлт, яагаад хийгдсэнийг дараа нь ойлгоход тусалдаг.", "git commit -m \"fix: correct lesson title\"", "debug", "git commit \"fix: correct lesson title\""),
  gitLesson("github-log", 10, "git log", "log — өөрчлөлтийн түүх", "Commit author, date, message болон hash-тэй history-г уншина.", "git log --oneline", "build"),
  gitLesson("github-clone", 11, "git clone", "clone — remote repository авах", "Remote repository-ийн local copy болон remote connection-ийг үүсгэнэ.", "git clone https://github.com/example/learning-lab.git", "build"),
  gitLesson("github-remote", 12, "origin", "remote — origin холбоос", "Origin нь ихэвчлэн clone эсвэл remote add-аар холбосон default remote-ийн нэр.", "git remote add origin https://github.com/example/learning-lab.git", "debug", "git remote origin https://github.com/example/learning-lab.git"),
  gitLesson("github-fetch", 13, "git fetch", "fetch — remote history татах", "Remote-ийн шинэ history-г local tracking branch-д авчирна, working branch-г шууд өөрчлөхгүй.", "git fetch origin", "predict"),
  gitLesson("github-pull", 14, "git pull", "pull — remote өөрчлөлт авах", "Remote history-г fetch хийж, одоогийн branch-д нэгтгэнэ.", "git pull origin main", "build"),
  gitLesson("github-push", 15, "git push", "push — commit-оо remote руу илгээх", "Local branch-ийн commit-үүдийг remote branch руу илгээж backup болон collaboration-д бэлэн болгоно.", "git push origin main", "timed"),
  gitLesson("github-branch", 16, "git branch", "branch — тусгаарлагдсан ажил", "Default branch-д нөлөөлөхгүйгээр feature эсвэл засварыг тусад нь хийх орон зай үүсгэнэ.", "git branch feature/lesson-card", "build"),
  gitLesson("github-switch", 17, "git switch", "switch — branch солих", "Одоогийн working tree-г сонгосон branch-ийн snapshot руу шилжүүлнэ.", "git switch feature/lesson-card", "build"),
  gitLesson("github-diff", 18, "git diff", "diff — өөрчлөлт харьцуулах", "Commit хийхээсээ өмнө файлын нэмсэн, устгасан мөрүүдийг review хийнэ.", "git diff main...feature/lesson-card", "predict"),
  gitLesson("github-pull-request", 19, "pull request", "Pull request — change proposal", "Branch-ийн өөрчлөлтийг review болон merge хийхээр санал болгодог collaboration record.", "gh pr create --title \"Add lesson card\"", "build"),
  gitLesson("github-review", 20, "review", "Review — feedback ба approval", "Pull request дээр code, diff, comment-ийг шалгаж санал эсвэл approval өгнө.", "gh pr review --approve", "build"),
  gitLesson("github-merge", 21, "merge", "merge — өөрчлөлт нэгтгэх", "Approved pull request-ийн branch өөрчлөлтийг default branch-д нэгтгэнэ.", "git merge feature/lesson-card", "build"),
  gitLesson("github-issue", 22, "issue", "Issue — ажил, алдаа, санаа", "Bug, feature эсвэл task-ийг тайлбар, холбоос, discussion-тойгоор хянах record.", "gh issue create --title \"Add CSS quiz\"", "build"),
  gitLesson("github-label", 23, "label", "Label — issue ангилах", "Issue болон pull request-ийг type, priority, status-аар ангилж filter хийх metadata.", "gh issue edit 1 --add-label \"good first issue\"", "debug", "gh issue edit 1 --label \"good first issue\""),
  gitLesson("github-flow", 24, "GitHub flow", "GitHub flow — багийн ажлын урсгал", "Тодорхой branch үүсгэж, жижиг commit-ууд хийж, pull request review болон merge-ээр өөрчлөлт нийлүүлэх lightweight workflow.", "git switch main && git pull origin main", "timed"),
];

export const githubPath: LanguagePath = {
  id: "github",
  label: "GitHub",
  accent: "#6E5494",
  pale: "#F3EEFA",
  source: "https://docs.github.com/en/get-started/using-github/hello-world",
  sourceLabel: "GitHub Docs · Hello World & GitHub flow",
  description: "Repository, commit, branch, pull request, issue бүрийг command simulator-аар дадлагажуулж portfolio workflow бүтээ.",
  project: "Open Source Workflow Lab",
  lessons,
};
