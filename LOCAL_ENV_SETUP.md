# CodeCraft Academy — локал `.env` тохиргоо

Энэ төсөлд жинхэнэ нууц утгыг эх кодод оруулдаггүй. Өөрийн компьютер дээр төслийн үндсэн хавтаст `.env` нэртэй шинэ файл үүсгээд, доорх загварыг хуулж утгуудыг бөглөнө. `.env` нь `.gitignore`-д багтсан тул Git-д орохгүй.

```dotenv
NODE_ENV=development
PORT=3000
VITE_APP_TITLE=CodeCraft Academy
VITE_APP_LOGO=

DATABASE_URL=mysql://USERNAME:PASSWORD@HOST:3306/DATABASE_NAME
JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET

VITE_APP_ID=YOUR_MANUS_APP_ID
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=YOUR_MANUS_OAUTH_PORTAL_URL
OWNER_OPEN_ID=YOUR_OWNER_OPEN_ID
OWNER_NAME=YOUR_OWNER_DISPLAY_NAME

BUILT_IN_FORGE_API_URL=YOUR_FORGE_API_URL
BUILT_IN_FORGE_API_KEY=YOUR_SERVER_FORGE_API_KEY
VITE_FRONTEND_FORGE_API_URL=YOUR_FRONTEND_FORGE_API_URL
VITE_FRONTEND_FORGE_API_KEY=YOUR_FRONTEND_FORGE_API_KEY

VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=

GMAIL_SMTP_USER=your-address@gmail.com
GMAIL_SMTP_APP_PASSWORD=YOUR_16_CHARACTER_GOOGLE_APP_PASSWORD

VAPID_PUBLIC_KEY=YOUR_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY=YOUR_VAPID_PRIVATE_KEY
VAPID_SUBJECT=mailto:your-address@example.com
```

| Бүлэг | Хувьсагч | Шаардлага | Зориулалт |
|---|---|---|---|
| Өгөгдөл ба сесс | `DATABASE_URL`, `JWT_SECRET` | Заавал | MySQL холболт болон нэвтрэх сессийн гарын үсэг |
| OAuth | `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL` | Нэвтрэх ашиглавал заавал | OAuth нэвтрэх урсгал |
| Эзэмшигч | `OWNER_OPEN_ID`, `OWNER_NAME` | Owner эрх ашиглавал заавал | Эзэмшигчийн эрхийг тогтоох мэдээлэл |
| И-мэйл | `GMAIL_SMTP_USER`, `GMAIL_SMTP_APP_PASSWORD` | И-мэйл мэдэгдэл ашиглавал заавал | Суралцагчийн зөвшөөрсөн и-мэйл мэдэгдэл |
| Хөтчийн мэдэгдэл | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Push мэдэгдэл ашиглавал заавал | Push мэдэгдлийн гарын үсэг |
| Forge/Storage/AI | `BUILT_IN_FORGE_*`, `VITE_FRONTEND_FORGE_*` | AI tutor, файл, дотоод интеграц ашиглавал заавал | Сервер болон клиент талын Manus үйлчилгээний холболт |

> Эхний удаа зөвхөн дизайн, статик хуудас үзэх бол Gmail болон VAPID хэсгийг хоосон үлдээж болно. Харин нэвтрэх, өгөгдөл хадгалах, AI tutor, файл хавсаргах, и-мэйл, push зэрэг бодит урсгалыг туршихдаа харгалзах утгуудыг заавал бөглөнө.

## Gmail App Password

`GMAIL_SMTP_APP_PASSWORD` талбарт энгийн Gmail нууц үгээ бүү ашиглаарай. Gmail бүртгэл дээрээ хоёр шатлалт баталгаажуулалт идэвхжүүлээд, Google Account-ийн **App passwords** цэснээс 16 тэмдэгттэй нууц үг үүсгэж оруулна. Хуучирсан эсвэл цуцлагдсан App Password нь SMTP-ийн `535` нэвтрэх алдаа үүсгэдэг.

## Аюулгүй дамжуулах арга

`.env` файлыг чат, GitHub commit, эсвэл дэлгэцийн зураг хэлбэрээр бүү илгээгээрэй. Локал орчноо ажиллуулж шалгасны дараа зөвхөн шаардлагатай нууц утгыг хамгаалагдсан нууц тохиргооны талбараар оруулна. Хэрэв локал орчинд асуудал гарвал нууц утгыг халхалсан алдааны мөрийг илгээж болно.

## Локал орчинд ажиллуулах

`.env`-ээ бөглөсний дараа төслийн үндсэн хавтсанд дараах тушаалыг ажиллуулна:

```bash
pnpm install
pnpm db:push
pnpm dev
```

Дараа нь `http://localhost:3000` хаягийг нээж нэвтрэх, профайлын дэлгэцийн нэр солих, хөтөлбөр, кодын орчин, төсөл илгээх хэсгийг шалгана. Тохиргоо өөрчилсний дараа хөгжүүлэлтийн серверээ дахин эхлүүлнэ.

## Баталгаажуулах дараалал

```bash
pnpm check
pnpm test
```

Gmail-ийн App Password бэлэн болсон үед SMTP credential шалгалтыг дахин ажиллуулна. `535` алдаа гарвал энгийн Gmail нууц үг биш, идэвхтэй 16 тэмдэгттэй App Password оруулсан эсэхээ шалгаарай.

## Нууц утгыг харуулахгүй локал шалгалт

Тохиргооны бодит утгыг чат, terminal output, эсвэл screenshot-д гаргахгүйгээр өөрийн компьютер дээр дараах тушаалыг ажиллуулж болно. Энэ нь утгыг хэвлэхгүй, зөвхөн хувьсагч бүр **populated**, **blank**, эсвэл **placeholder** эсэхийг харуулна.

```bash
awk 'BEGIN { FS="=" } /^[A-Za-z_][A-Za-z0-9_]*=/ { value=substr($0, index($0,"=")+1); state=(value=="" ? "blank" : (value ~ /^(YOUR_|REPLACE_|USERNAME|PASSWORD|HOST|DATABASE_NAME|your-address@|mailto:your-address)/ ? "placeholder" : "populated")); print $1 "=" state }' .env | sort
```

> Хамгаалалттай төслийн орчин нь таны хавсаргасан `.env`-ийн бодит утгыг задлан шинжлэх эсвэл эх кодод хуулахгүй. Энэ redacted audit тушаалыг **та өөрийн локал компьютер дээрээ** ажиллуулна; үйлчилгээ нь таны `.env` файлыг уншихгүй. Түлхүүрийг тухайн үйлчилгээ рүү оруулах шаардлагатай бол зөвхөн хамгаалагдсан нууц тохиргооны талбарыг ашиглана.

SMTP нэвтрэлт болон application-ийн мэдэгдэл хүргэлтийн гэрээний нууц задруулахгүй шалгалтын үр дүнг `NOTIFICATION_VALIDATION.md` файлаас үзэж болно.

## Түгээмэл асуудал

| Шинж тэмдэг | Шалгах зүйл |
|---|---|
| `DATABASE_URL` холбогдохгүй | Host, port, database нэр, хэрэглэгчийн эрх болон MySQL сервис ажиллаж буй эсэхийг шалгана. |
| Нэвтрэх буцахгүй | OAuth-ийн `VITE_APP_ID`, portal URL, callback тохиргоо болон серверийн URL таарч буй эсэхийг шалгана. |
| И-мэйл илгээгдэхгүй, `535` гарна | 2 шатлалт баталгаажуулалт идэвхтэй эсэх, App Password шинэ бөгөөд 16 тэмдэгттэй эсэхийг шалгана. |
| Push бүртгэгдэхгүй | `https` эсвэл localhost ашиглаж буй эсэх, VAPID public/private key ба subject зөв эсэхийг шалгана. |
