/* MahallaUsta — uz / ru / en i18n engine */
(function () {
  "use strict";

  const STORAGE_KEY = "mu_lang";
  const LANGS = [
    { code: "uz", label: "O'zbekcha" },
    { code: "ru", label: "Русский" },
    { code: "en", label: "English" },
  ];

  const DICT = {
    uz: {
      meta: {
        landing: "MahallaUsta — Mahallangizning ishonchli ustalari",
        login: "Kirish — MahallaUsta boshqaruv paneli",
        admin: "Boshqaruv paneli — MahallaUsta",
      },
      aria: {
        menuOpen: "Menyuni ochish",
        menuClose: "Menyuni yopish",
        close: "Yopish",
        home: "MahallaUsta bosh sahifa",
        notifications: "Bildirishnomalar",
        search: "Qidirish",
        logout: "Tizimdan chiqish",
        showPassword: "Parolni ko'rsatish",
        hidePassword: "Parolni yashirish",
        clearChat: "Suhbatni tozalash",
        send: "Yuborish",
        lang: "Tilni tanlash",
      },
      common: {
        call: "Chaqirish",
        fromPrice: "so'mdan",
        currency: "so'm",
        million: "mln",
        sending: "Yuborilmoqda...",
        close: "Yopish",
        yesterday: "Kecha",
      },
      nav: {
        services: "Xizmatlar",
        masters: "Ustalar",
        how: "Qanday ishlaydi",
        why: "Nega biz",
        login: "Kirish",
        becomeMaster: "Usta bo'lish",
        callMaster: "Usta chaqirish",
      },
      hero: {
        badge: "Mahalla darajasidagi xizmatlar platformasi",
        titleHtml: 'Mahallangizning <span class="hl">ishonchli ustasi</span> — bir daqiqada',
        lead: "Santexnik, elektrik, duradgor yoki ta'mirchi — MahallaUsta sizga yaqin atrofdagi tekshirilgan ustalarni topadi. Narx oldindan aniq, to'lov xavfsiz.",
        ctaCall: "Usta chaqirish",
        ctaHow: "Qanday ishlaydi",
        verified: "Tekshirilgan usta",
        verifiedSub: "ID va malaka tasdiqlangan",
        reviews: "2 400+ baho",
      },
      stats: {
        activeMasters: "Faol ustalar",
        doneOrders: "Bajarilgan buyurtma",
        rating: "O'rtacha baho",
        regions: "Viloyatlar",
      },
      quick: {
        serviceLabel: "Xizmat turi",
        servicePlaceholder: "Xizmatni tanlang",
        districtLabel: "Tumaningiz",
        districtPlaceholder: "Masalan, Chilonzor",
        find: "Ustani topish",
      },
      services: {
        eyebrow: "Xizmatlar",
        title: "Uydagi har qanday ish — bitta joyda",
        sub: "Har bir yo'nalish bo'yicha tajribali, mahallangizda yashovchi ustalar.",
      },
      service: {
        plumbing: "Santexnika",
        plumbingDesc: "Quvurlar, kranlar, suv isitgichlar",
        electrical: "Elektr ishlari",
        electricalDesc: "Rozetka, chiroq, avtomatlar",
        carpentry: "Duradgorlik",
        carpentryDesc: "Mebel yig'ish, eshik, pol",
        painting: "Bo'yash va suvoq",
        paintingDesc: "Devor, shift, fasad ishlari",
        tiling: "Plitka va kafel",
        tilingDesc: "Hammom, oshxona, terrasa",
        aircon: "Konditsioner",
        airconDesc: "O'rnatish, tozalash, ta'mirlash",
      },
      how: {
        eyebrow: "Qanday ishlaydi",
        title: "Uch qadamda usta chaqiring",
        sub: "Ro'yxatdan o'tish shart emas — birinchi buyurtma bir daqiqada.",
        step1Title: "Xizmatni tanlang",
        step1Text: "Kerakli ish turini belgilang va manzilingizni kiriting. Yaqin atrofdagi ustalar ro'yxati darhol ochiladi.",
        step2Title: "Ustani tanlang",
        step2Text: "Reyting, narx va mijozlar sharhlarini solishtiring. Tashrif vaqtini o'zingizga qulay tarzda belgilang.",
        step3Title: "Xavfsiz to'lang",
        step3Text: "Ish tugagach, to'lovni ilova orqali qiling. Har bir buyurtma sifat kafolati bilan himoyalangan.",
      },
      masters: {
        eyebrow: "Ustalar",
        title: "Bugun bo'sh ustalar",
        sub: "Har biri mahallangizda yashaydi va tekshiruvdan o'tgan.",
        all: "Barcha ustalar",
        verified: "Tekshirilgan",
        reviews: "{n} baho",
      },
      master: {
        azizRole: "Santexnik · 9 yillik tajriba",
        azizLoc: "Toshkent, Chilonzor",
        azizT1: "Quvurlar",
        azizT2: "Suv isitgich",
        azizT3: "Tez tashrif",
        dilnozaRole: "Bo'yoqchi · 6 yillik tajriba",
        dilnozaLoc: "Toshkent, Yunusobod",
        dilnozaT1: "Devor",
        dilnozaT2: "Dekorativ suvoq",
        dilnozaT3: "Toza ish",
        sardorRole: "Elektrik · 11 yillik tajriba",
        sardorLoc: "Toshkent, Mirzo Ulug'bek",
        sardorT1: "Avtomatlar",
        sardorT2: "Chiroq",
        sardorT3: "24/7",
      },
      why: {
        eyebrow: "Nega MahallaUsta",
        title: "Ishonch — har bir buyurtmaning asosi",
        sub: "Mahalladagi tanish-bilishchilik emas, tizimli va xavfsiz xizmat.",
        f1Title: "Tekshirilgan ustalar",
        f1Text: "Pasport va malaka hujjatlari tekshirilgan. Har bir usta mahalla hamjamiyati tomonidan tasdiqlangan.",
        f2Title: "Aniq va kafolatlangan narx",
        f2Text: "Narxni oldindan kelishasiz. Yashirin to'lovlar yo'q — kelishilgan summa o'zgarmaydi.",
        f3Title: "Xavfsiz to'lov",
        f3Text: "To'lov ilova orqali amalga oshiriladi. Ish sifatli bajarilmaguncha mablag' himoyalangan bo'ladi.",
        f4Title: "24/7 qo'llab-quvvatlash",
        f4Text: "Savollaringiz bo'lsa, o'zbek, rus va ingliz tillarida yordam beramiz. Har bir murojaat 15 daqiqada ko'rib chiqiladi.",
      },
      quote: {
        text: "Uyimdagi kran bir kunda tuzatildi. Narx oldindan aytildi, usta o'z vaqtida keldi. Endi barcha tanishlarimga MahallaUsta'ni tavsiya qilaman.",
        author: "Nilufar Rahimova",
        location: "Yunusobod tumani, Toshkent",
      },
      cta: {
        eyebrow: "Bugun boshlang",
        title: "Usta chaqiring — 15 daqiqada javob oling",
        text: "Birinchi buyurtmada xizmat haqi 0 so'm. Ilova tez orada App Store va Google Play'da.",
        call: "Usta chaqirish",
        become: "Usta bo'lish",
      },
      footer: {
        tagline: "Mahallangizning ishonchli ustalari — bir platformada. O'zbekistonda ishlab chiqilgan.",
        platform: "Platforma",
        company: "Kompaniya",
        help: "Yordam",
        about: "Biz haqimizda",
        careers: "Karyera",
        partnership: "Hamkorlik",
        contact: "Aloqa",
        faq: "Ko'p so'raladigan savollar",
        safety: "Xavfsizlik",
        terms: "Foydalanish shartlari",
        privacy: "Maxfiylik siyosati",
        rights: "Barcha huquqlar himoyalangan.",
      },
      modal: {
        callTitle: "Usta chaqirish",
        callSub: "Ma'lumotlaringizni qoldiring — 15 daqiqada aloqaga chiqamiz.",
        masterTitle: "Usta bo'lish",
        masterSub: "Mutaxassisligingizni tanlang — jamoamiz ariza bo'yicha bog'lanadi.",
        withMaster: "{name} bilan aloqaga chiqamiz — 15 daqiqada javob beramiz.",
        nameLabel: "Ismingiz",
        namePlaceholder: "Ism va familiya",
        phoneLabel: "Telefon raqam",
        serviceLabel: "Xizmat turi",
        servicePlaceholder: "Xizmatni tanlang",
        districtLabel: "Tumaningiz",
        districtPlaceholder: "Masalan, Chilonzor",
        submit: "So'rov yuborish",
        note: "Yuborish orqali siz foydalanish shartlariga rozilik bildirasiz.",
        successTitle: "Rahmat!",
        successText: "So'rovingiz qabul qilindi. 15 daqiqada operatorimiz siz bilan bog'lanadi.",
        close: "Yopish",
      },
      toast: {
        phone: "Telefon raqamni to'liq kiriting",
        failed: "So'rovni yuborib bo'lmadi. Qayta urinib ko'ring.",
      },
      login: {
        back: "Bosh sahifa",
        nightMode: "Kechki rejim",
        titleHtml: 'Boshqaruv markazi — <span class="hl">bir joyda</span>.',
        lead: "Buyurtmalar, ustalar va mijozlar nazorati. AI yordamchi esa har bir qarorni tezroq qabul qilishga yordam beradi.",
        f1: "Jonli statistika",
        f1Sub: "Buyurtmalar va daromad real vaqtda",
        f2: "AI yordamchi",
        f2Sub: "Buyurtmalar bo'yicha aqlli suhbat",
        f3: "Xavfsiz kirish",
        f3Sub: "Faqat tasdiqlangan administratorlar uchun",
        statOrders: "oylik buyurtma",
        statMasters: "faol usta",
        statRating: "mijoz bahosi",
        welcome: "Xush kelibsiz",
        welcomeSub: "Boshqaruv paneliga kirish uchun ma'lumotlaringizni kiriting.",
        emailLabel: "Email yoki telefon",
        passwordLabel: "Parol",
        remember: "Meni eslab qol",
        forgot: "Parolni unutdingizmi?",
        error: "Email yoki parol noto'g'ri. Demo hisobdan foydalanib ko'ring.",
        missing: "Email va parolni kiriting.",
        rate: "Juda ko'p urinish. 5 daqiqadan so'ng qayta urinib ko'ring.",
        submit: "Kirish",
        busy: "Kirilmoqda...",
        or: "yoki",
        demo: "Demo hisob bilan kirish",
        footerPrivacy: "Maxfiylik siyosati",
        footerHelp: "Yordam",
      },
      admin: {
        sideMenu: "Bosh menyu",
        sideSystem: "Tizim",
        backToSite: "Saytga qaytish",
        search: "Qidirish...",
        view: {
          dashboardTitle: "Dashboard",
          dashboardSub: "Umumiy ko'rsatkichlar va bugungi holat",
          ordersTitle: "Buyurtmalar",
          ordersSub: "Barcha buyurtmalar va ularning holati",
          mastersTitle: "Ustalar",
          mastersSub: "Platformadagi ustalar ro'yxati",
          clientsTitle: "Mijozlar",
          clientsSub: "Ro'yxatdan o'tgan mijozlar",
          aiTitle: "AI suhbat",
          aiSub: "Buyurtmalar bo'yicha aqlli yordamchi",
          settingsTitle: "Sozlamalar",
          settingsSub: "Panel va bildirishnoma sozlamalari",
        },
        date: "Bugun, {day}-{month}",
        greetNight: "Xayrli tun, {name}",
        greetMorning: "Xayrli tong, {name}",
        greetDay: "Xayrli kun, {name}",
        greetEvening: "Xayrli kechqurun, {name}",
        welcomeText: "Bugun {orders} ta buyurtma qabul qilindi. {new} tasi hali ustaga biriktirilmagan — AI yordamchi bilan tezkor tahlil qiling.",
        chatAi: "AI bilan suhbat",
        kpi: {
          orders: "Jami buyurtmalar",
          masters: "Faol ustalar",
          clients: "Mijozlar",
          revenue: "Oylik daromad",
          vsLastMonth: "o'tgan oyga nisbatan",
          newMasters: "yangi ustalar",
          monthlyGrowth: "oylik o'sish",
        },
        chart: {
          title: "So'nggi 7 kun",
          sub: "Kunlik buyurtmalar soni",
          total: "Jami: {n}",
          du: "Du",
          se: "Se",
          ch: "Ch",
          pa: "Pa",
          ju: "Ju",
          sh: "Sh",
          ya: "Ya",
        },
        donut: {
          title: "Xizmatlar taqsimoti",
          sub: "Buyurtmalar bo'yicha ulush",
          center: "buyurtma",
          other: "Boshqa",
        },
        recent: {
          title: "So'nggi buyurtmalar",
          sub: "Bugungi eng yangi so'rovlar",
          all: "Barchasi →",
        },
        orders: {
          title: "Barcha buyurtmalar",
          sub: "Oxirgi 24 soatdagi buyurtmalar",
        },
        masters: {
          title: "Ustalar ro'yxati",
          sub: "Platformadagi faol va band ustalar",
          chip: "{n} usta",
        },
        clients: {
          title: "Mijozlar",
          sub: "Ro'yxatdan o'tgan foydalanuvchilar",
          chip: "{n} mijoz",
        },
        th: {
          client: "Mijoz",
          service: "Xizmat",
          master: "Usta",
          amount: "Summa",
          status: "Holat",
          time: "Vaqt",
          specialty: "Mutaxassislik",
          area: "Hudud",
          rating: "Reyting",
          orders: "Buyurtmalar",
          phone: "Telefon",
          last: "Oxirgi buyurtma",
        },
        filter: {
          all: "Barchasi",
          new: "Yangi",
          progress: "Jarayonda",
          done: "Bajarildi",
          canceled: "Bekor",
        },
        ai: {
          online: "Onlayn · panel ma'lumotlari asosida",
          suggest1: "Bugungi buyurtmalar qanday?",
          suggest2: "Eng faol ustalar",
          suggest3: "Oylik daromad",
          suggest4: "Muammoli buyurtmalar",
          placeholder: "Savolingizni yozing...",
          note: "AI demo rejimida ishlaydi — javoblar panel ma'lumotlari asosida shakllantiriladi.",
          intro: "Assalomu alaykum, {name}! Men MahallaUsta AI yordamchisiman.\n\nBugungi buyurtmalar, ustalar reytingi, mijozlar faolligi va daromad bo'yicha savollaringizga javob beraman. Pastdagi tayyor savollardan birini tanlashingiz yoki o'zingiz yozishingiz mumkin.",
          empty: "Javob shakllantirilmadi.",
        },
        settings: {
          title: "Umumiy sozlamalar",
          sub: "Panel va bildirishnomalar",
          notify: "Buyurtma bildirishnomalari",
          notifySub: "Yangi buyurtma kelganda xabar yuborilsin",
          assistant: "AI yordamchi",
          assistantSub: "Dashboardda AI tavsiyalarini ko'rsatish",
          autoConfirm: "Buyurtmani avtomatik tasdiqlash",
          autoConfirmSub: "Tekshirilgan ustalar uchun so'rov darhol tasdiqlanadi",
          language: "Interfeys tili",
          languageSub: "Panel ko'rinish tili",
          save: "Sozlamalarni saqlash",
        },
        profile: {
          title: "Profil",
          sub: "Administrator ma'lumotlari",
          email: "Email",
          phone: "Telefon",
          session: "Sessiya",
          night: "Kechki rejim",
          logout: "Tizimdan chiqish",
        },
        toast: {
          saved: "Sozlamalar saqlandi",
          cleared: "Suhbat tozalandi",
          demo: "Demo rejim: server ulanmagan",
        },
        aiReply: {
          problemHeader: "Diqqat talab qiladigan {n} ta holat:",
          problemCanceled: "• #{id} — bekor qilingan {service} buyurtmasi ({client}). Mijoz sababini aniqlashtirish kerak.",
          problemProgress: "• #{id} — {master} bilan jarayonda. Ustaga eslatma yuborish tavsiya etiladi.",
          problemNone: "Hozircha muammoli buyurtma qayd etilmagan — barcha buyurtmalar rejadagidek ketmoqda.",
          problemTail: "Xohlasangiz, mijozlar bilan qayta aloqa vazifasini yaratishni taklif qilaman.",
          ordersTitle: "Bugungi buyurtmalar:",
          ordersTotal: "• Jami: {n} ta",
          ordersNew: "• Yangi: {n}",
          ordersProgress: "• Jarayonda: {n}",
          ordersDone: "• Bajarildi: {n}",
          ordersCanceled: "• Bekor qilingan: {n}",
          ordersTop: "Eng ko'p so'ralgan xizmat — {service}. {n} ta yangi so'rov hali ustaga biriktirilmagan; ularni \"Buyurtmalar\" bo'limida ko'rishingiz mumkin.",
          mastersTitle: "Eng faol ustalar (buyurtma soni bo'yicha):",
          masterLine: "{i}. {name} — {jobs} buyurtma, {rating}★",
          mastersFooter: "Hozirda {active} usta faol, ulardan {free} tasi bugun bo'sh. Band ustalar: {busy}.",
          mastersNone: "yo'q",
          revenue: "Oylik daromad: {total} mln so'm (+{growth}%).\nO'rtacha buyurtma qiymati: {average} so'm.\nEng daromadli yo'nalish — {service}.",
          revenueForecast: "Prognoz: agar o'sish shu sur'atda davom etsa, oy oxirigacha {forecast} mln so'mga yetadi.",
          clients: "Platformada {total} mijoz ro'yxatdan o'tgan (+{growth}% o'sish).\nEng faol mijoz — {top}.\nQaytib kelish darajasi: {rate}%.\n\nBugun {new} ta yangi mijoz birinchi buyurtmasini berdi.",
          clientsTop: "{name} ({orders} buyurtma)",
          clientsNoTop: "hali yo'q",
          ideasTitle: "Bugungi 3 ta tavsiya:",
          ideas1: "1. {n} ta biriktirilmagan buyurtmani ustalarga taqsimlang — kutish vaqti qisqaradi.",
          ideas2: "2. Jarayondagi buyurtmalar bo'yicha ustalarga eslatma yuboring — kechikishlar kamayadi.",
          ideas3: "3. 18:00–21:00 oralig'ida santexnika ustalarini ko'proq onlayn qiling — talab eng yuqori.",
          greeting: "Assalomu alaykum! Bugun {orders} ta buyurtma qabul qilindi, {done} tasi allaqachon bajarilgan. Daromad o'tgan oyga nisbatan {growth}% yuqori.\n\nNima bilan yordam bera olaman?",
          thanks: "Arziydi! Yana savolingiz bo'lsa, yozing — yordam berishga tayyorman.",
          fallback: "Savolingizni tushundim. Men quyidagilar bo'yicha yordam bera olaman:\n• buyurtmalar holati va statistikasi\n• ustalar reytingi va bandligi\n• mijozlar faolligi\n• daromad va prognozlar\n• muammoli buyurtmalar tahlili\n\nMasalan: \"Bugungi buyurtmalar qanday?\" deb so'rang.",
          hello: "Assalomu alaykum! Nima bilan yordam bera olaman?",
        },
        role: "Administrator",
      },
      status: {
        new: "Yangi",
        progress: "Jarayonda",
        done: "Bajarildi",
        canceled: "Bekor qilindi",
        active: "Faol",
        inactive: "Nofaol",
        busy: "Band",
      },
      enum: {
        service: {
          plumbing: "Santexnika",
          electrical: "Elektr ishlari",
          carpentry: "Duradgorlik",
          painting: "Bo'yash va suvoq",
          tiling: "Plitka va kafel",
          aircon: "Konditsioner",
        },
        spec: {
          plumber: "Santexnik",
          painter: "Bo'yoqchi",
          electrician: "Elektrik",
          carpenter: "Duradgor",
          aircon: "Konditsioner ustasi",
        },
        district: {
          chilonzor: "Chilonzor",
          yunusobod: "Yunusobod",
          mirzoUlugbek: "Mirzo Ulug'bek",
          sergeli: "Sergeli",
          yakkasaroy: "Yakkasaroy",
        },
        city: { tashkent: "Toshkent" },
      },
      month: {
        1: "yanvar", 2: "fevral", 3: "mart", 4: "aprel", 5: "may", 6: "iyun",
        7: "iyul", 8: "avgust", 9: "sentabr", 10: "oktabr", 11: "noyabr", 12: "dekabr",
      },
    },

    ru: {
      meta: {
        landing: "MahallaUsta — надёжные мастера вашей махалли",
        login: "Вход — панель управления MahallaUsta",
        admin: "Панель управления — MahallaUsta",
      },
      aria: {
        menuOpen: "Открыть меню",
        menuClose: "Закрыть меню",
        close: "Закрыть",
        home: "Главная страница MahallaUsta",
        notifications: "Уведомления",
        search: "Поиск",
        logout: "Выйти из системы",
        showPassword: "Показать пароль",
        hidePassword: "Скрыть пароль",
        clearChat: "Очистить чат",
        send: "Отправить",
        lang: "Выбор языка",
      },
      common: {
        call: "Вызвать",
        fromPrice: "сум",
        currency: "сум",
        million: "млн",
        sending: "Отправка...",
        close: "Закрыть",
        yesterday: "Вчера",
      },
      nav: {
        services: "Услуги",
        masters: "Мастера",
        how: "Как это работает",
        why: "Почему мы",
        login: "Вход",
        becomeMaster: "Стать мастером",
        callMaster: "Вызвать мастера",
      },
      hero: {
        badge: "Платформа услуг на уровне махалли",
        titleHtml: 'Надёжный <span class="hl">мастер вашей махалли</span> — за минуту',
        lead: "Сантехник, электрик, столяр или мастер по ремонту — MahallaUsta найдёт проверенных мастеров рядом с вами. Цена известна заранее, оплата безопасна.",
        ctaCall: "Вызвать мастера",
        ctaHow: "Как это работает",
        verified: "Проверенный мастер",
        verifiedSub: "ID и квалификация подтверждены",
        reviews: "2 400+ отзывов",
      },
      stats: {
        activeMasters: "Активные мастера",
        doneOrders: "Выполненных заказов",
        rating: "Средняя оценка",
        regions: "Регионов",
      },
      quick: {
        serviceLabel: "Вид услуги",
        servicePlaceholder: "Выберите услугу",
        districtLabel: "Ваш район",
        districtPlaceholder: "Например, Чиланзар",
        find: "Найти мастера",
      },
      services: {
        eyebrow: "Услуги",
        title: "Любая работа по дому — в одном месте",
        sub: "Опытные мастера, живущие в вашей махалле, по каждому направлению.",
      },
      service: {
        plumbing: "Сантехника",
        plumbingDesc: "Трубы, краны, водонагреватели",
        electrical: "Электромонтаж",
        electricalDesc: "Розетки, светильники, автоматы",
        carpentry: "Столярные работы",
        carpentryDesc: "Сборка мебели, двери, полы",
        painting: "Покраска и штукатурка",
        paintingDesc: "Стены, потолки, фасады",
        tiling: "Плитка и кафель",
        tilingDesc: "Ванная, кухня, терраса",
        aircon: "Кондиционер",
        airconDesc: "Установка, чистка, ремонт",
      },
      how: {
        eyebrow: "Как это работает",
        title: "Вызовите мастера за три шага",
        sub: "Без регистрации — первый заказ за минуту.",
        step1Title: "Выберите услугу",
        step1Text: "Укажите нужный вид работ и адрес. Список мастеров рядом откроется сразу.",
        step2Title: "Выберите мастера",
        step2Text: "Сравните рейтинг, цену и отзывы клиентов. Выберите удобное время визита.",
        step3Title: "Платите безопасно",
        step3Text: "После работы оплатите через приложение. Каждый заказ защищён гарантией качества.",
      },
      masters: {
        eyebrow: "Мастера",
        title: "Мастера, свободные сегодня",
        sub: "Каждый живёт в вашей махалле и прошёл проверку.",
        all: "Все мастера",
        verified: "Проверен",
        reviews: "{n} отзывов",
      },
      master: {
        azizRole: "Сантехник · опыт 9 лет",
        azizLoc: "Ташкент, Чиланзар",
        azizT1: "Трубы",
        azizT2: "Водонагреватель",
        azizT3: "Быстрый визит",
        dilnozaRole: "Маляр · опыт 6 лет",
        dilnozaLoc: "Ташкент, Юнусабад",
        dilnozaT1: "Стены",
        dilnozaT2: "Декоративная штукатурка",
        dilnozaT3: "Аккуратно",
        sardorRole: "Электрик · опыт 11 лет",
        sardorLoc: "Ташкент, Мирзо Улугбек",
        sardorT1: "Автоматы",
        sardorT2: "Освещение",
        sardorT3: "24/7",
      },
      why: {
        eyebrow: "Почему MahallaUsta",
        title: "Доверие — основа каждого заказа",
        sub: "Не знакомства в махалле, а системный и безопасный сервис.",
        f1Title: "Проверенные мастера",
        f1Text: "Паспорт и документы о квалификации проверены. Каждый мастер подтверждён сообществом махалли.",
        f2Title: "Точная цена с гарантией",
        f2Text: "Цену согласуете заранее. Скрытых платежей нет — согласованная сумма не меняется.",
        f3Title: "Безопасная оплата",
        f3Text: "Оплата проходит через приложение. Средства защищены до качественного выполнения работы.",
        f4Title: "Поддержка 24/7",
        f4Text: "Если есть вопросы — поможем на узбекском, русском или английском. Каждое обращение рассматривается за 15 минут.",
      },
      quote: {
        text: "Кран в моём доме починили за один день. Цену назвали заранее, мастер пришёл вовремя. Теперь рекомендую MahallaUsta всем знакомым.",
        author: "Нилуфар Рахимова",
        location: "Юнусабадский район, Ташкент",
      },
      cta: {
        eyebrow: "Начните сегодня",
        title: "Вызовите мастера — ответ за 15 минут",
        text: "Первый заказ — без комиссии за сервис. Приложение скоро появится в App Store и Google Play.",
        call: "Вызвать мастера",
        become: "Стать мастером",
      },
      footer: {
        tagline: "Надёжные мастера вашей махалли — на одной платформе. Сделано в Узбекистане.",
        platform: "Платформа",
        company: "Компания",
        help: "Помощь",
        about: "О нас",
        careers: "Карьера",
        partnership: "Партнёрство",
        contact: "Контакты",
        faq: "Частые вопросы",
        safety: "Безопасность",
        terms: "Условия использования",
        privacy: "Политика конфиденциальности",
        rights: "Все права защищены.",
      },
      modal: {
        callTitle: "Вызвать мастера",
        callSub: "Оставьте свои данные — свяжемся в течение 15 минут.",
        masterTitle: "Стать мастером",
        masterSub: "Выберите специализацию — наша команда свяжется по заявке.",
        withMaster: "{name} свяжется с вами — ответим в течение 15 минут.",
        nameLabel: "Ваше имя",
        namePlaceholder: "Имя и фамилия",
        phoneLabel: "Номер телефона",
        serviceLabel: "Вид услуги",
        servicePlaceholder: "Выберите услугу",
        districtLabel: "Ваш район",
        districtPlaceholder: "Например, Чиланзар",
        submit: "Отправить заявку",
        note: "Отправляя заявку, вы соглашаетесь с условиями использования.",
        successTitle: "Спасибо!",
        successText: "Ваша заявка принята. Оператор свяжется с вами в течение 15 минут.",
        close: "Закрыть",
      },
      toast: {
        phone: "Введите номер телефона полностью",
        failed: "Не удалось отправить заявку. Попробуйте ещё раз.",
      },
      login: {
        back: "На главную",
        nightMode: "Ночной режим",
        titleHtml: 'Центр управления — <span class="hl">в одном месте</span>.',
        lead: "Заказы, мастера и клиенты под контролем. AI-помощник помогает быстрее принимать решения.",
        f1: "Живая статистика",
        f1Sub: "Заказы и доход в реальном времени",
        f2: "AI-помощник",
        f2Sub: "Умный чат по заказам",
        f3: "Безопасный вход",
        f3Sub: "Только для подтверждённых администраторов",
        statOrders: "заказов в месяц",
        statMasters: "активных мастеров",
        statRating: "оценка клиентов",
        welcome: "Добро пожаловать",
        welcomeSub: "Введите свои данные для входа в панель управления.",
        emailLabel: "Email или телефон",
        passwordLabel: "Пароль",
        remember: "Запомнить меня",
        forgot: "Забыли пароль?",
        error: "Неверный email или пароль. Попробуйте демо-аккаунт.",
        missing: "Введите email и пароль.",
        rate: "Слишком много попыток. Повторите через 5 минут.",
        submit: "Войти",
        busy: "Вход...",
        or: "или",
        demo: "Войти в демо-аккаунт",
        footerPrivacy: "Политика конфиденциальности",
        footerHelp: "Помощь",
      },
      admin: {
        sideMenu: "Главное меню",
        sideSystem: "Система",
        backToSite: "На сайт",
        search: "Поиск...",
        view: {
          dashboardTitle: "Дашборд",
          dashboardSub: "Общие показатели и состояние на сегодня",
          ordersTitle: "Заказы",
          ordersSub: "Все заказы и их статусы",
          mastersTitle: "Мастера",
          mastersSub: "Список мастеров платформы",
          clientsTitle: "Клиенты",
          clientsSub: "Зарегистрированные клиенты",
          aiTitle: "AI-чат",
          aiSub: "Умный помощник по заказам",
          settingsTitle: "Настройки",
          settingsSub: "Настройки панели и уведомлений",
        },
        date: "Сегодня, {day} {month}",
        greetNight: "Доброй ночи, {name}",
        greetMorning: "Доброе утро, {name}",
        greetDay: "Добрый день, {name}",
        greetEvening: "Добрый вечер, {name}",
        welcomeText: "Сегодня принято {orders} заказов. {new} из них ещё не назначены мастеру — быстро проанализируйте с AI-помощником.",
        chatAi: "Чат с AI",
        kpi: {
          orders: "Всего заказов",
          masters: "Активные мастера",
          clients: "Клиенты",
          revenue: "Месячный доход",
          vsLastMonth: "к прошлому месяцу",
          newMasters: "новые мастера",
          monthlyGrowth: "рост за месяц",
        },
        chart: {
          title: "Последние 7 дней",
          sub: "Заказы по дням",
          total: "Итого: {n}",
          du: "Пн",
          se: "Вт",
          ch: "Ср",
          pa: "Чт",
          ju: "Пт",
          sh: "Сб",
          ya: "Вс",
        },
        donut: {
          title: "Распределение услуг",
          sub: "Доля по заказам",
          center: "заказов",
          other: "Другое",
        },
        recent: {
          title: "Последние заказы",
          sub: "Самые новые заявки за сегодня",
          all: "Все →",
        },
        orders: {
          title: "Все заказы",
          sub: "Заказы за последние 24 часа",
        },
        masters: {
          title: "Список мастеров",
          sub: "Активные и занятые мастера платформы",
          chip: "Мастеров: {n}",
        },
        clients: {
          title: "Клиенты",
          sub: "Зарегистрированные пользователи",
          chip: "{n} клиентов",
        },
        th: {
          client: "Клиент",
          service: "Услуга",
          master: "Мастер",
          amount: "Сумма",
          status: "Статус",
          time: "Время",
          specialty: "Специальность",
          area: "Район",
          rating: "Рейтинг",
          orders: "Заказы",
          phone: "Телефон",
          last: "Последний заказ",
        },
        filter: {
          all: "Все",
          new: "Новые",
          progress: "В работе",
          done: "Выполнено",
          canceled: "Отменено",
        },
        ai: {
          online: "В сети · на основе данных панели",
          suggest1: "Как дела с заказами сегодня?",
          suggest2: "Самые активные мастера",
          suggest3: "Месячный доход",
          suggest4: "Проблемные заказы",
          placeholder: "Напишите вопрос...",
          note: "AI работает в демо-режиме — ответы формируются на основе данных панели.",
          intro: "Здравствуйте, {name}! Я AI-помощник MahallaUsta.\n\nОтвечу на вопросы о заказах, рейтинге мастеров, активности клиентов и доходе. Выберите готовый вопрос ниже или напишите свой.",
          empty: "Ответ не сформирован.",
        },
        settings: {
          title: "Общие настройки",
          sub: "Панель и уведомления",
          notify: "Уведомления о заказах",
          notifySub: "Присылать сообщение о новом заказе",
          assistant: "AI-помощник",
          assistantSub: "Показывать AI-рекомендации на дашборде",
          autoConfirm: "Автоподтверждение заказов",
          autoConfirmSub: "Заявки проверенных мастеров подтверждаются сразу",
          language: "Язык интерфейса",
          languageSub: "Язык отображения панели",
          save: "Сохранить настройки",
        },
        profile: {
          title: "Профиль",
          sub: "Данные администратора",
          email: "Email",
          phone: "Телефон",
          session: "Сессия",
          night: "Ночной режим",
          logout: "Выйти из системы",
        },
        toast: {
          saved: "Настройки сохранены",
          cleared: "Чат очищен",
          demo: "Демо-режим: сервер не подключён",
        },
        aiReply: {
          problemHeader: "Требуют внимания {n} случая:",
          problemCanceled: "• #{id} — отменённый заказ «{service}» ({client}). Нужно уточнить причину у клиента.",
          problemProgress: "• #{id} — в работе у {master}. Рекомендуется напомнить мастеру.",
          problemNone: "Проблемных заказов пока нет — все заказы идут по плану.",
          problemTail: "При желании могу создать задачу на повторную связь с клиентами.",
          ordersTitle: "Заказы за сегодня:",
          ordersTotal: "• Всего: {n}",
          ordersNew: "• Новые: {n}",
          ordersProgress: "• В работе: {n}",
          ordersDone: "• Выполнено: {n}",
          ordersCanceled: "• Отменено: {n}",
          ordersTop: "Самая востребованная услуга — {service}. {n} новых заявок ещё не назначены мастеру; их можно увидеть в разделе «Заказы».",
          mastersTitle: "Самые активные мастера (по числу заказов):",
          masterLine: "{i}. {name} — {jobs} заказов, {rating}★",
          mastersFooter: "Сейчас активны {active} мастеров, {free} из них свободны сегодня. Занятые мастера: {busy}.",
          mastersNone: "нет",
          revenue: "Доход за месяц: {total} млн сум (+{growth}%).\nСредняя стоимость заказа: {average} сум.\nСамое доходное направление — {service}.",
          revenueForecast: "Прогноз: при сохранении темпа к концу месяца доход достигнет {forecast} млн сум.",
          clients: "На платформе зарегистрировано {total} клиентов (+{growth}% роста).\nСамый активный клиент — {top}.\nДоля повторных заказов: {rate}%.\n\nСегодня {new} новых клиентов оформили первый заказ.",
          clientsTop: "{name} ({orders} заказов)",
          clientsNoTop: "пока нет",
          ideasTitle: "3 рекомендации на сегодня:",
          ideas1: "1. Распределите {n} неназначенных заказов между мастерами — время ожидания сократится.",
          ideas2: "2. Напомните мастерам о заказах в работе — задержек станет меньше.",
          ideas3: "3. С 18:00 до 21:00 держите больше сантехников онлайн — спрос максимальный.",
          greeting: "Здравствуйте! Сегодня принято {orders} заказов, {done} уже выполнены. Доход на {growth}% выше, чем в прошлом месяце.\n\nЧем могу помочь?",
          thanks: "Пожалуйста! Если появятся вопросы — пишите, я готов помочь.",
          fallback: "Я понял вопрос. Могу помочь по темам:\n• статус и статистика заказов\n• рейтинг и занятость мастеров\n• активность клиентов\n• доход и прогнозы\n• анализ проблемных заказов\n\nНапример: «Как дела с заказами сегодня?»",
          hello: "Здравствуйте! Чем могу помочь?",
        },
        role: "Администратор",
      },
      status: {
        new: "Новый",
        progress: "В работе",
        done: "Выполнено",
        canceled: "Отменено",
        active: "Активен",
        inactive: "Неактивен",
        busy: "Занят",
      },
      enum: {
        service: {
          plumbing: "Сантехника",
          electrical: "Электромонтаж",
          carpentry: "Столярные работы",
          painting: "Покраска и штукатурка",
          tiling: "Плитка и кафель",
          aircon: "Кондиционер",
        },
        spec: {
          plumber: "Сантехник",
          painter: "Маляр",
          electrician: "Электрик",
          carpenter: "Столяр",
          aircon: "Мастер по кондиционерам",
        },
        district: {
          chilonzor: "Чиланзар",
          yunusobod: "Юнусабад",
          mirzoUlugbek: "Мирзо Улугбек",
          sergeli: "Сергели",
          yakkasaroy: "Яккасарай",
        },
        city: { tashkent: "Ташкент" },
      },
      month: {
        1: "января", 2: "февраля", 3: "марта", 4: "апреля", 5: "мая", 6: "июня",
        7: "июля", 8: "августа", 9: "сентября", 10: "октября", 11: "ноября", 12: "декабря",
      },
    },

    en: {
      meta: {
        landing: "MahallaUsta — trusted handymen in your neighborhood",
        login: "Sign in — MahallaUsta admin panel",
        admin: "Admin panel — MahallaUsta",
      },
      aria: {
        menuOpen: "Open menu",
        menuClose: "Close menu",
        close: "Close",
        home: "MahallaUsta home",
        notifications: "Notifications",
        search: "Search",
        logout: "Sign out",
        showPassword: "Show password",
        hidePassword: "Hide password",
        clearChat: "Clear chat",
        send: "Send",
        lang: "Choose language",
      },
      common: {
        call: "Call",
        fromPrice: "UZS",
        currency: "UZS",
        million: "M",
        sending: "Sending...",
        close: "Close",
        yesterday: "Yesterday",
      },
      nav: {
        services: "Services",
        masters: "Masters",
        how: "How it works",
        why: "Why us",
        login: "Sign in",
        becomeMaster: "Become a master",
        callMaster: "Call a master",
      },
      hero: {
        badge: "A neighborhood-level services platform",
        titleHtml: 'Your neighborhood\'s <span class="hl">trusted handyman</span> — in a minute',
        lead: "Plumber, electrician, carpenter or repairman — MahallaUsta finds verified masters near you. The price is agreed upfront and payment is secure.",
        ctaCall: "Call a master",
        ctaHow: "How it works",
        verified: "Verified master",
        verifiedSub: "ID and skills confirmed",
        reviews: "2,400+ reviews",
      },
      stats: {
        activeMasters: "Active masters",
        doneOrders: "Completed orders",
        rating: "Average rating",
        regions: "Regions",
      },
      quick: {
        serviceLabel: "Type of service",
        servicePlaceholder: "Choose a service",
        districtLabel: "Your district",
        districtPlaceholder: "For example, Chilanzar",
        find: "Find a master",
      },
      services: {
        eyebrow: "Services",
        title: "Every home job — in one place",
        sub: "Experienced masters who live in your neighborhood, for every trade.",
      },
      service: {
        plumbing: "Plumbing",
        plumbingDesc: "Pipes, taps, water heaters",
        electrical: "Electrical work",
        electricalDesc: "Sockets, lights, breakers",
        carpentry: "Carpentry",
        carpentryDesc: "Furniture assembly, doors, floors",
        painting: "Painting & plastering",
        paintingDesc: "Walls, ceilings, facades",
        tiling: "Tiling",
        tilingDesc: "Bathroom, kitchen, terrace",
        aircon: "Air conditioning",
        airconDesc: "Install, clean, repair",
      },
      how: {
        eyebrow: "How it works",
        title: "Call a master in three steps",
        sub: "No registration needed — your first order takes a minute.",
        step1Title: "Choose a service",
        step1Text: "Pick the work you need and enter your address. Nearby masters appear instantly.",
        step2Title: "Pick a master",
        step2Text: "Compare ratings, prices and customer reviews. Set a visit time that suits you.",
        step3Title: "Pay securely",
        step3Text: "Pay in the app when the job is done. Every order is covered by a quality guarantee.",
      },
      masters: {
        eyebrow: "Masters",
        title: "Masters available today",
        sub: "Each one lives in your neighborhood and has been verified.",
        all: "All masters",
        verified: "Verified",
        reviews: "{n} reviews",
      },
      master: {
        azizRole: "Plumber · 9 years of experience",
        azizLoc: "Tashkent, Chilanzar",
        azizT1: "Pipes",
        azizT2: "Water heater",
        azizT3: "Fast visit",
        dilnozaRole: "Painter · 6 years of experience",
        dilnozaLoc: "Tashkent, Yunusabad",
        dilnozaT1: "Walls",
        dilnozaT2: "Decorative plaster",
        dilnozaT3: "Clean work",
        sardorRole: "Electrician · 11 years of experience",
        sardorLoc: "Tashkent, Mirzo Ulugbek",
        sardorT1: "Breakers",
        sardorT2: "Lighting",
        sardorT3: "24/7",
      },
      why: {
        eyebrow: "Why MahallaUsta",
        title: "Trust is the foundation of every order",
        sub: "Not favors around the block — a systematic and secure service.",
        f1Title: "Verified masters",
        f1Text: "Passport and qualification documents are verified. Every master is approved by the neighborhood community.",
        f2Title: "Clear, guaranteed pricing",
        f2Text: "Agree the price upfront. No hidden fees — the agreed amount never changes.",
        f3Title: "Secure payment",
        f3Text: "Payment goes through the app. Funds are protected until the job is done well.",
        f4Title: "24/7 support",
        f4Text: "Questions? We help in Uzbek, Russian or English. Every request is reviewed within 15 minutes.",
      },
      quote: {
        text: "The tap in my home was fixed in one day. The price was quoted upfront and the master arrived on time. Now I recommend MahallaUsta to everyone I know.",
        author: "Nilufar Rahimova",
        location: "Yunusabad district, Tashkent",
      },
      cta: {
        eyebrow: "Start today",
        title: "Call a master — get a reply in 15 minutes",
        text: "Your first order has zero service fee. The app is coming soon to the App Store and Google Play.",
        call: "Call a master",
        become: "Become a master",
      },
      footer: {
        tagline: "Your neighborhood's trusted masters — on one platform. Made in Uzbekistan.",
        platform: "Platform",
        company: "Company",
        help: "Support",
        about: "About us",
        careers: "Careers",
        partnership: "Partnership",
        contact: "Contact",
        faq: "FAQ",
        safety: "Safety",
        terms: "Terms of use",
        privacy: "Privacy policy",
        rights: "All rights reserved.",
      },
      modal: {
        callTitle: "Call a master",
        callSub: "Leave your details — we'll get back to you within 15 minutes.",
        masterTitle: "Become a master",
        masterSub: "Choose your specialty — our team will contact you about the application.",
        withMaster: "We'll connect you with {name} — reply within 15 minutes.",
        nameLabel: "Your name",
        namePlaceholder: "First and last name",
        phoneLabel: "Phone number",
        serviceLabel: "Type of service",
        servicePlaceholder: "Choose a service",
        districtLabel: "Your district",
        districtPlaceholder: "For example, Chilanzar",
        submit: "Send request",
        note: "By sending, you agree to the terms of use.",
        successTitle: "Thank you!",
        successText: "Your request has been received. Our operator will contact you within 15 minutes.",
        close: "Close",
      },
      toast: {
        phone: "Enter the full phone number",
        failed: "Could not send the request. Please try again.",
      },
      login: {
        back: "Home",
        nightMode: "Night mode",
        titleHtml: 'Your control center — <span class="hl">all in one place</span>.',
        lead: "Orders, masters and clients under control. The AI assistant helps you make decisions faster.",
        f1: "Live statistics",
        f1Sub: "Orders and revenue in real time",
        f2: "AI assistant",
        f2Sub: "Smart chat about your orders",
        f3: "Secure access",
        f3Sub: "For verified administrators only",
        statOrders: "monthly orders",
        statMasters: "active masters",
        statRating: "customer rating",
        welcome: "Welcome",
        welcomeSub: "Enter your details to sign in to the admin panel.",
        emailLabel: "Email or phone",
        passwordLabel: "Password",
        remember: "Remember me",
        forgot: "Forgot password?",
        error: "Wrong email or password. Try the demo account.",
        missing: "Enter your email and password.",
        rate: "Too many attempts. Try again in 5 minutes.",
        submit: "Sign in",
        busy: "Signing in...",
        or: "or",
        demo: "Sign in with demo account",
        footerPrivacy: "Privacy policy",
        footerHelp: "Help",
      },
      admin: {
        sideMenu: "Main menu",
        sideSystem: "System",
        backToSite: "Back to site",
        search: "Search...",
        view: {
          dashboardTitle: "Dashboard",
          dashboardSub: "Key metrics and today's status",
          ordersTitle: "Orders",
          ordersSub: "All orders and their statuses",
          mastersTitle: "Masters",
          mastersSub: "List of platform masters",
          clientsTitle: "Clients",
          clientsSub: "Registered clients",
          aiTitle: "AI chat",
          aiSub: "Smart assistant for your orders",
          settingsTitle: "Settings",
          settingsSub: "Panel and notification settings",
        },
        date: "Today, {month} {day}",
        greetNight: "Good night, {name}",
        greetMorning: "Good morning, {name}",
        greetDay: "Good afternoon, {name}",
        greetEvening: "Good evening, {name}",
        welcomeText: "{orders} orders were received today. {new} of them are not assigned to a master yet — analyze them quickly with the AI assistant.",
        chatAi: "Chat with AI",
        kpi: {
          orders: "Total orders",
          masters: "Active masters",
          clients: "Clients",
          revenue: "Monthly revenue",
          vsLastMonth: "vs last month",
          newMasters: "new masters",
          monthlyGrowth: "monthly growth",
        },
        chart: {
          title: "Last 7 days",
          sub: "Daily orders",
          total: "Total: {n}",
          du: "Mon",
          se: "Tue",
          ch: "Wed",
          pa: "Thu",
          ju: "Fri",
          sh: "Sat",
          ya: "Sun",
        },
        donut: {
          title: "Service breakdown",
          sub: "Share of orders",
          center: "orders",
          other: "Other",
        },
        recent: {
          title: "Recent orders",
          sub: "Today's newest requests",
          all: "View all →",
        },
        orders: {
          title: "All orders",
          sub: "Orders in the last 24 hours",
        },
        masters: {
          title: "Masters list",
          sub: "Active and busy masters on the platform",
          chip: "{n} masters",
        },
        clients: {
          title: "Clients",
          sub: "Registered users",
          chip: "{n} clients",
        },
        th: {
          client: "Client",
          service: "Service",
          master: "Master",
          amount: "Amount",
          status: "Status",
          time: "Time",
          specialty: "Specialty",
          area: "Area",
          rating: "Rating",
          orders: "Orders",
          phone: "Phone",
          last: "Last order",
        },
        filter: {
          all: "All",
          new: "New",
          progress: "In progress",
          done: "Done",
          canceled: "Canceled",
        },
        ai: {
          online: "Online · based on panel data",
          suggest1: "How are today's orders?",
          suggest2: "Top masters",
          suggest3: "Monthly revenue",
          suggest4: "Problem orders",
          placeholder: "Type your question...",
          note: "AI runs in demo mode — answers are based on panel data.",
          intro: "Hello, {name}! I'm the MahallaUsta AI assistant.\n\nI can answer questions about today's orders, master ratings, client activity and revenue. Pick a ready question below or type your own.",
          empty: "No answer was generated.",
        },
        settings: {
          title: "General settings",
          sub: "Panel and notifications",
          notify: "Order notifications",
          notifySub: "Send an alert when a new order arrives",
          assistant: "AI assistant",
          assistantSub: "Show AI suggestions on the dashboard",
          autoConfirm: "Auto-confirm orders",
          autoConfirmSub: "Requests from verified masters are confirmed instantly",
          language: "Interface language",
          languageSub: "Panel display language",
          save: "Save settings",
        },
        profile: {
          title: "Profile",
          sub: "Administrator details",
          email: "Email",
          phone: "Phone",
          session: "Session",
          night: "Night mode",
          logout: "Sign out",
        },
        toast: {
          saved: "Settings saved",
          cleared: "Chat cleared",
          demo: "Demo mode: server is not connected",
        },
        aiReply: {
          problemHeader: "{n} cases need attention:",
          problemCanceled: "• #{id} — canceled {service} order ({client}). The client's reason should be clarified.",
          problemProgress: "• #{id} — in progress with {master}. A reminder to the master is recommended.",
          problemNone: "No problem orders recorded yet — everything is on track.",
          problemTail: "If you like, I can create a follow-up task for the clients.",
          ordersTitle: "Today's orders:",
          ordersTotal: "• Total: {n}",
          ordersNew: "• New: {n}",
          ordersProgress: "• In progress: {n}",
          ordersDone: "• Done: {n}",
          ordersCanceled: "• Canceled: {n}",
          ordersTop: "Most requested service — {service}. {n} new requests are not assigned to a master yet; see them in the Orders section.",
          mastersTitle: "Most active masters (by order count):",
          masterLine: "{i}. {name} — {jobs} orders, {rating}★",
          mastersFooter: "There are {active} active masters; {free} are free today. Busy masters: {busy}.",
          mastersNone: "none",
          revenue: "Monthly revenue: {total}M UZS (+{growth}%).\nAverage order value: {average} UZS.\nMost profitable service — {service}.",
          revenueForecast: "Forecast: at this pace revenue will reach {forecast}M UZS by the end of the month.",
          clients: "{total} clients are registered on the platform (+{growth}% growth).\nMost active client — {top}.\nRepeat rate: {rate}%.\n\nToday {new} new clients placed their first order.",
          clientsTop: "{name} ({orders} orders)",
          clientsNoTop: "none yet",
          ideasTitle: "3 tips for today:",
          ideas1: "1. Assign the {n} unassigned orders to masters — waiting time will drop.",
          ideas2: "2. Remind masters about orders in progress — fewer delays.",
          ideas3: "3. Keep more plumbers online between 18:00 and 21:00 — demand peaks then.",
          greeting: "Hello! {orders} orders were received today and {done} are already completed. Revenue is {growth}% higher than last month.\n\nHow can I help?",
          thanks: "You're welcome! If you have more questions, just write — happy to help.",
          fallback: "I understood your question. I can help with:\n• order status and statistics\n• master ratings and availability\n• client activity\n• revenue and forecasts\n• analysis of problem orders\n\nFor example: \"How are today's orders?\"",
          hello: "Hello! How can I help?",
        },
        role: "Administrator",
      },
      status: {
        new: "New",
        progress: "In progress",
        done: "Done",
        canceled: "Canceled",
        active: "Active",
        inactive: "Inactive",
        busy: "Busy",
      },
      enum: {
        service: {
          plumbing: "Plumbing",
          electrical: "Electrical work",
          carpentry: "Carpentry",
          painting: "Painting & plastering",
          tiling: "Tiling",
          aircon: "Air conditioning",
        },
        spec: {
          plumber: "Plumber",
          painter: "Painter",
          electrician: "Electrician",
          carpenter: "Carpenter",
          aircon: "AC specialist",
        },
        district: {
          chilonzor: "Chilanzar",
          yunusobod: "Yunusabad",
          mirzoUlugbek: "Mirzo Ulugbek",
          sergeli: "Sergeli",
          yakkasaroy: "Yakkasaray",
        },
        city: { tashkent: "Tashkent" },
      },
      month: {
        1: "January", 2: "February", 3: "March", 4: "April", 5: "May", 6: "June",
        7: "July", 8: "August", 9: "September", 10: "October", 11: "November", 12: "December",
      },
    },
  };

  const VALID = new Set(LANGS.map((item) => item.code));

  function readLang() {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (valid(stored)) return stored;
    } catch (error) {
      /* storage mavjud emas */
    }
    return "uz";
  }

  function valid(code) {
    return VALID.has(String(code || "").toLowerCase());
  }

  let lang = readLang();

  function lookup(code, key) {
    return String(key)
      .split(".")
      .reduce((node, part) => (node && typeof node === "object" ? node[part] : undefined), DICT[code]);
  }

  function interpolate(template, vars) {
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, (match, name) =>
      vars[name] === undefined || vars[name] === null ? match : String(vars[name])
    );
  }

  function t(key, vars) {
    let value = lookup(lang, key);
    if (value === undefined) value = lookup("uz", key);
    if (value === undefined) return key;
    return interpolate(value, vars);
  }

  function has(key) {
    return lookup(lang, key) !== undefined || lookup("uz", key) !== undefined;
  }

  function formatNumber(value) {
    const n = Math.round(Number(value) || 0);
    const grouped = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, lang === "en" ? "," : " ");
    return (n < 0 ? "-" : "") + grouped;
  }

  function setDocumentTitle() {
    const key = document.documentElement.dataset.title;
    if (key) document.title = t(key);
  }

  function nodeVars(node) {
    if (!node.dataset.i18nVars) return undefined;
    try {
      return JSON.parse(node.dataset.i18nVars);
    } catch (error) {
      return undefined;
    }
  }

  function apply(root) {
    const scope = root || document;

    scope.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = t(node.dataset.i18n, nodeVars(node));
    });

    scope.querySelectorAll("[data-i18n-html]").forEach((node) => {
      node.innerHTML = t(node.dataset.i18nHtml, nodeVars(node));
    });

    scope.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
      node.placeholder = t(node.dataset.i18nPlaceholder);
    });

    scope.querySelectorAll("[data-i18n-aria]").forEach((node) => {
      node.setAttribute("aria-label", t(node.dataset.i18nAria));
    });

    scope.querySelectorAll("[data-i18n-title]").forEach((node) => {
      node.title = t(node.dataset.i18nTitle);
    });

    document.documentElement.lang = lang;
    setDocumentTitle();
    syncSwitchers();
  }

  function syncSwitchers() {
    document.querySelectorAll("[data-lang]").forEach((button) => {
      const active = button.dataset.lang === lang;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    document.querySelectorAll("select[data-lang-select]").forEach((select) => {
      select.value = lang;
    });
  }

  function buildSwitchers() {
    document.querySelectorAll("[data-lang-switch]").forEach((box) => {
      if (box.dataset.ready === "1") return;
      box.dataset.ready = "1";
      box.setAttribute("role", "group");
      box.setAttribute("aria-label", t("aria.lang"));

      LANGS.forEach((item) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.lang = item.code;
        button.textContent = item.code.toUpperCase();
        button.title = item.label;
        button.setAttribute("aria-label", item.label);
        box.appendChild(button);
      });
    });
    syncSwitchers();
  }

  function setLang(next) {
    const code = String(next || "").toLowerCase();
    if (!valid(code)) return;

    lang = code;
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
    } catch (error) {
      /* storage mavjud emas */
    }

    apply();
    document.dispatchEvent(new CustomEvent("mu:langchange", { detail: { lang: code } }));
  }

  function getLang() {
    return lang;
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-lang]");
    if (!button) return;
    setLang(button.dataset.lang);
  });

  document.addEventListener("change", (event) => {
    const select = event.target.closest("select[data-lang-select]");
    if (select) setLang(select.value);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      buildSwitchers();
      apply();
    });
  } else {
    buildSwitchers();
    apply();
  }

  window.MuI18n = { t, has, apply, setLang, getLang, formatNumber, langs: LANGS };
})();
