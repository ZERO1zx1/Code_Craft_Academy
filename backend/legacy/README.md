# Legacy backend code

`fastapi_app/` нь өмнөх FastAPI/Supabase reference implementation юм. Одоогийн ажиллаж буй CodeCraft Academy runtime нь Flask app бөгөөд `backend/api/`, `backend/services/`, `backend/db.py`, `app.py`-г ашигладаг.

Энэ folder-ийг устгаагүй; хуучин кодыг хадгалсан боловч одоогийн Flask route registration-д холбогдоогүй. Шинэ feature нэмэхдээ `backend/legacy/fastapi_app/` дотор биш, идэвхтэй Flask бүтэц дотор ажиллана.
