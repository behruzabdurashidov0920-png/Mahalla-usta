# MahallaUsta — 24/7 onlayn hostingga chiqarish

Loyiha Render.com uchun to'liq tayyor: `Dockerfile`, `.dockerignore` va `render.yaml` qo'shilgan.
Render GitHub repo'ga ulangan holda har push'da avtomatik qayta deploy qiladi.

---

## 1. Render'ga joylash (5 daqiqa)

1. **https://render.com** ga kiring → **Get Started** → **GitHub** bilan ro'yxatdan o'ting.
2. Dashboard'da **New +** → **Blueprint** ni tanlang.
3. Repozitoriyni ulang: `behruzabdurashidov0920-png/Mahalla-usta`
4. Render `render.yaml` ni o'qib chiqadi → **Apply** / **Create Resources** ni bosing.
5. So'ralganda:
   - **ADMIN_PASSWORD** — kuchli parol kiriting (masalan `Mahalla2026!x`). Bu admin panel paroli.
   - **AI_API_KEY** — bo'sh qoldirsangiz ham bo'ladi: agent lokal rejimda ishlaydi.
6. Deploy tugashini kuting (2–3 daqiqa). URL shunday ko'rinishda bo'ladi:
   `https://mahallausta.onrender.com`

> Blueprint ishlamasa: **New +** → **Web Service** → repo tanlang → **Runtime: Docker** → **Create Web Service**.
> `render.yaml`dagi env o'zgaruvchilarni qo'lda ham kiritish mumkin.

---

## 2. 24/7 haqida muhim ma'lumot

| Reja | Holat | Narx |
|---|---|---|
| **Free** | 15 daqiqa harakatsizlikdan keyin uxlaydi; birinchi ochilish 30–60 soniya | $0 |
| **Starter** | Doimiy ishlaydi, uxlamaydi — haqiqiy 24/7 | ~$7/oy |

**Bepul variantda 24/7 usuli:** [cron-job.org](https://cron-job.org) yoki shunga o'xshash bepul xizmatda
har **10 daqiqada** sayt URL'iga GET so'rov yuboradigan job yarating. Render'ning bepul 750 soat/oy
limiti bitta doimiy saytga yetadi.

**Ma'lumotlar (buyurtmalar, foydalanuvchilar):**
- Free planda disk vaqtinchalik — har deploy/restartda `data/db.json` boshlang'ich holatga qaytadi.
- Doimiy saqlash uchun **Starter** tarifiga o'tib, **Persistent Disk** qo'shing:
  - Mount path: `/app/data`
  - Size: 1 GB
  - `render.yaml`dagi izohli `disk:` blokini ochish ham mumkin.

---

## 3. AI agent sozlamalari (ixtiyoriy)

Haqiqiy LLM javoblari uchun Render → **Environment** bo'limida qo'shing:

```
AI_API_KEY=sk-...
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```

OpenRouter misoli:

```
AI_API_KEY=sk-or-v1-...
AI_BASE_URL=https://openrouter.ai/api/v1
AI_MODEL=openai/gpt-4o-mini
```

Kalit bo'lmasa ham chat ishlaydi — lokal bilim bazasi javob beradi (24/7, tashqi xizmatsiz).

---

## 4. Xavfsizlik (albatta bajaring)

- **ADMIN_PASSWORD** ni standart `admin123` dan o'zgartiring — aks holda admin panelga kirish mumkin.
- `AI_API_KEY` ni hech qachon kodga yoki GitHub'ga yozmang — faqat Render Environment'ga kiriting.
- Demo usta paroli `usta123` — real foydalanuvchilar uchun o'zgartirish tavsiya etiladi.

---

## 5. Tekshirish

Deploydan keyin:

1. `https://<domen>/` — landing sahifa ochiladi.
2. `https://<domen>/mobile.html` — telefonlar uchun mobil versiya (pastki navigatsiya, AI panel).
3. O'ng pastdagi AI tugma → "qalaysan?" yoki "Santexnik qancha turadi?" yozib ko'ring.
4. `https://<domen>/login.html` — admin bilan kirish.
5. API tekshiruvi (PowerShell):

```powershell
Invoke-RestMethod -Uri "https://<domen>/api/agent" -Method Post `
  -ContentType "application/json" `
  -Body '{"message":"qalaysan?","lang":"uz"}'
```

---

## 6. Muammolar va yechimlari

| Muammo | Yechim |
|---|---|
| Build failed | Render → **Logs** → Dockerfile qatorini tekshiring |
| 502 / sayt ochilmaydi | Loglarda `PORT` va `server.js` xatosini ko'ring |
| Birinchi ochilish sekin | Free plan uyqudan uyg'onyapti — 30–60 s normal |
| Ma'lumotlar yo'qoladi | Starter + Persistent Disk `/app/data` |
| AI javob bermaydi | `AI_API_KEY` to'g'riligini va `AI_BASE_URL` ni tekshiring |

---

## 7. Muqobil hostinglar

- **Railway** — https://railway.app (Dockerfile avtomatik aniqlanadi)
- **Fly.io** — https://fly.io (`fly launch`; karta talab qiladi)
- **VPS** (Hetzner, DigitalOcean) — Docker o'rnatib `docker build -t mahallausta .` va
  `docker run -d -p 80:3000 --restart always mahallausta`

---

## 8. Yangilanishlarni chiqarish

Kod o'zgargach:

```bash
git add .
git commit -m "yangilanish"
git push origin master
```

Render `autoDeployTrigger: commit` tufayli o'zi qayta deploy qiladi.
