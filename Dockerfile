# MahallaUsta — production uchun Docker obrazi
# Ilova tashqi paketlardan foydalanmaydi (faqat Node.js built-in modullari).

FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

# Barcha kerakli manba fayllar (.dockerignore orqali keraksizlari chiqarib tashlanadi)
COPY . .

# Baza fayli uchun katalog (birinchi ishga tushishda avtomatik to'ldiriladi)
RUN mkdir -p /app/data

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
