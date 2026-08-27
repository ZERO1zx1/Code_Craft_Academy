# CodeCraft Academy — GitHub Learning Path Research

## Scope

GitHub path нь HTML, CSS, JavaScript, Python-ийн дараах **тав дахь тусдаа сургалтын зам** байна. Энэхүү зам нь GitHub account эсвэл backend шаардалгүйгээр ойлголт, command structure, workflow simulation, prediction/debug quiz-ийг browser дотор заана. Харин бодит repository үүсгэх, remote push хийх, collaborator invite хийх зэрэг үйлдлийг суралцагч өөрийн GitHub account дээрээ албан зааврын дагуу хийж гүйцэтгэнэ.

## Curriculum rationale

GitHub-ийн Hello World сургалт нь repository, branch, commit, pull request, merge гэсэн суурь урсгалыг дарааллаар тайлбарладаг. Repository нь холбоотой файлуудыг агуулдаг project folder; branch нь default branch-д шууд нөлөөлөхгүйгээр өөрчлөлт хийх тусгаарлагдсан орон зай; commit нь өөрчлөлт ба түүнд зориулсан тайлбартай history record юм. [1]

GitHub flow нь тусдаа, богино тодорхой branch, тусгаарлагдсан commit, pull request review, merge, branch cleanup гэсэн багийн ажлын давтагддаг урсгалыг зөвлөдөг. [2] Issues quickstart нь title, body, task list, assignee, label, milestone болон comment-ийг ажил төлөвлөх, харилцах зориулалтаар тайлбарладаг. [3]

## 24 atomic lesson outline

| Order | Atomic lesson | Practice goal |
|---:|---|---|
| 1–4 | GitHub, Git, account, repository | Project болон local/remote ойлголтыг ялгах |
| 5–8 | README, Markdown, public/private, clone | Repository-ийн үндсэн бүтэц ойлгох |
| 9–12 | status, add, commit, commit message | Нэг өөрчлөлт–нэг зорилго зарчмаар history бүтээх |
| 13–16 | branch, main, checkout/switch, push | Feature work-ийг default branch-ээс тусгаарлах |
| 17–20 | pull request, diff, review, merge | Change proposal ба review урсгалыг ажиллуулах |
| 21–24 | issue, label, assignee, milestone | Ажлыг тодорхойлж, ангилж, хянах |

## Frontend-only practice model

Command simulator нь ямар ч real terminal, repository, credential, remote API ашиглахгүй. Суралцагч `git status`, `git add`, `git commit`, `git switch`, `git push` зэргийг даалгаврын нөхцөлд зөв дарааллаар сонгох, command output-ыг таамаглах, буруу commit/branch workflow-ийг debug хийх байдлаар сурна. Lesson completion, XP, quiz result болон certificate eligibility-ийг тухайн browser-ийн `localStorage` л хадгална. Иймээс мэдээлэл төхөөрөмж хооронд синк хийгдэхгүй, харин ямар ч account шаарддаггүй.

## References

[1] [GitHub Docs — Hello World](https://docs.github.com/en/get-started/using-github/hello-world)

[2] [GitHub Docs — GitHub flow](https://docs.github.com/en/get-started/using-github/github-flow)

[3] [GitHub Docs — Quickstart for GitHub Issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/learning-about-issues/quickstart)
