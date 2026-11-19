# MahallaUsta

Mahallangizning ishonchli ustalari — santexnik, elektrik, duradgor, bo'yoqchi va boshqa mutaxassislarni bir platformada topish uchun landing sahifa, mobil versiya, jonli ustalar xaritasi va AI yordamchi.

## 🔗 Jonli havolalar (hammaga ochiq)

| Versiya | Havola |
| --- | --- |
| 📱 **Mobil versiya** | **https://behruzabdurashidov0920-png.github.io/Mahalla-usta/mobile.html** |
| 🖥️ Desktop versiya | https://behruzabdurashidov0920-png.github.io/Mahalla-usta/ |

> GitHub Pages faqat statik fayllarni beradi. Shu sababli u yerda xarita ma'lumotlari, login va AI yordamchi API'lari ishlamaydi. To'liq funksiyalar uchun loyihani Render'da ishga tushiring — qarang: [`DEPLOY.md`](DEPLOY.md).

## ✨ Imkoniyatlar

- Uch tilda interfeys: o'zbek, rus, ingliz.
- Kunduzgi va tungi rejim.
- Ustalar ro'yxati, tariflar va buyurtma formasi.
- **Jonli xarita**: demo ustalar + joylashuvini ulashgan haqiqiy ustalar (OpenStreetMap plitalari).
- Mobil landing: pastki navigatsiya va AI panel.
- AI yordamchi (lokal bilim bazasi yoki tashqi API bilan).
- Admin va usta kabineti, autentifikatsiya.

## 🚀 Lokal ishga tushirish

```bash
npm install
npm start
```

So'ngra:

- Desktop: http://localhost:3000
- Mobil: http://localhost:3000/mobile.html

Demo loginlar:

| Rol | Login | Parol |
| --- | --- | --- |
| Administrator | `admin@mahallausta.uz` | `admin123` |
| Usta | `usta@mahallausta.uz` | `usta123` |

## 🗂 Loyiha tuzilishi

| Fayl | Vazifasi |
| --- | --- |
| `index.html` | Desktop landing |
| `mobile.html`, `mobile.css`, `mobile.js` | Mobil versiya |
| `styles.css`, `i18n.css` | Uslublar va tarjimalar |
| `script.js` | Umumiy logika, xarita, markerlar |
| `agent.js` | AI yordamchi |
| `server.js`, `lib/store.js` | Backend va ma'lumotlar saqlash |
| `Dockerfile`, `render.yaml` | Render.com uchun deploy |

## ☁️ Deploy

Render.com orqali 24/7 hosting uchun qadamlar [`DEPLOY.md`](DEPLOY.md) faylida.
