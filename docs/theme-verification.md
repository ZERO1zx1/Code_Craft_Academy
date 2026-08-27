# Theme toggle — visual verification

2026-08-28-ны шалгалтаар root болон Python lesson page-ийн light render-ийг desktop (`1280 × 720`) ба mobile (`390 × 844`) хэмжээнд үзэв. Theme toggle нь shared header-д харагдаж, physical lesson page-д мөн орсон байна.

Mobile header-д урт “Үнэгүй · Бүртгэлгүй · Нээлттэй” status нь theme control-той өрсөлдөж байсан тул `640px`-ээс доош энэ status-ийг нуув. Toggle нь icon-only болж, `aria-label` ба `aria-pressed` state-г хадгална.

Засварын дараах root болон Python lesson mobile render дээр brand, “Танилцуулга” navigation, theme icon, lesson content тус тусдаа уншигдахуйц зайтай харагдав.
