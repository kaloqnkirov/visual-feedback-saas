export type GuideLang =
  | 'en'
  | 'bg'
  | 'es'
  | 'de'
  | 'fr'
  | 'pt'
  | 'zh'
  | 'ru'
  | 'ar'
  | 'ja'

export const GUIDE_LANGS: { code: GuideLang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'bg', label: 'Български' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
  { code: 'zh', label: '中文' },
  { code: 'ru', label: 'Русский' },
  { code: 'ar', label: 'العربية' },
  { code: 'ja', label: '日本語' },
]

export type GuideSection = {
  title: string
  body: string[]
}

export type GuideDoc = {
  title: string
  intro: string
  sections: GuideSection[]
}

const en: GuideDoc = {
  title: 'ProofFlow User Guide',
  intro:
    'ProofFlow helps teams collect visual feedback on websites, images, PDFs, video, audio, and other files. Use this guide to create projects, share review links, and leave precise notes.',
  sections: [
    {
      title: '1. Sign in',
      body: [
        'Open /login and create an account or sign in with email and password.',
        'The dashboard requires an account. Shared project links can be opened without signing in.',
      ],
    },
    {
      title: '2. Create a project',
      body: [
        'In Dashboard click New project.',
        'Add a title and either paste an asset URL (website, image, PDF, video…) or upload a file.',
        'Choose share permission: Can comment or View only.',
        'Websites are captured as a full-page scrollable preview automatically.',
      ],
    },
    {
      title: '3. Review and annotate',
      body: [
        'Open a project from the dashboard or a share link.',
        'Click once to place a point pin.',
        'Click and drag to highlight a whole text block or area. Drag the corner handles to reshape.',
        'In the sidebar add a short summary, optional long change notes, and an attachment.',
        'Save with Pin (or Ctrl/Cmd + Enter).',
      ],
    },
    {
      title: '4. Zoom, pan, and shortcuts',
      body: [
        'Zoom with the header controls, + / -, or Ctrl/Cmd + scroll.',
        'Pan with Space + drag (or middle mouse).',
        'Esc cancels a draft. R toggles resolved on the selected pin.',
      ],
    },
    {
      title: '5. Sidebar tools',
      body: [
        'Filter pins by All / Open / Resolved and search by text.',
        'Reply in a pin thread for follow-up discussion.',
        'Export all pins to CSV.',
        'Owners can upload a new asset version and switch versions from the header.',
      ],
    },
    {
      title: '6. Sharing and embed',
      body: [
        'Copy the share link from the dashboard. Clients open /project/[id].',
        'View only links hide commenting; Can comment allows pins and replies.',
        'Optional embed: add /embed.js with data-project-id on any website to show a feedback button.',
      ],
    },
    {
      title: '7. Notifications',
      body: [
        'When someone adds a pin, the project owner gets an in-app notification (bell icon on the dashboard).',
      ],
    },
  ],
}

const bg: GuideDoc = {
  title: 'Ръководство за употреба на ProofFlow',
  intro:
    'ProofFlow събира визуална обратна връзка за сайтове, изображения, PDF, видео, аудио и други файлове. Това ръководство обяснява създаване на проекти, споделяне и точни забележки.',
  sections: [
    {
      title: '1. Вход',
      body: [
        'Отвори /login и създай акаунт или влез с имейл и парола.',
        'Dashboard изисква акаунт. Споделен линк към проект може да се отвори и без вход.',
      ],
    },
    {
      title: '2. Създаване на проект',
      body: [
        'В Dashboard натисни New project / Нов проект.',
        'Въведи заглавие и постави URL (сайт, картинка, PDF, видео…) или качи файл.',
        'Избери права за споделяне: Can comment (може да коментира) или View only (само преглед).',
        'Сайтовете автоматично се заснемат като цяла скролваща се страница.',
      ],
    },
    {
      title: '3. Преглед и забележки',
      body: [
        'Отвори проект от dashboard или от share линк.',
        'Единичен клик = точка (pin).',
        'Влачене = маркиране на цял текст/област. С ъглите можеш да разтегнеш селекцията.',
        'Вдясно попълни кратко резюме, по желание дълги бележки и прикачен файл.',
        'Запиши с Pin (или Ctrl/Cmd + Enter).',
      ],
    },
    {
      title: '4. Zoom, pan и клавиши',
      body: [
        'Zoom от бутоните, с + / - или Ctrl/Cmd + scroll.',
        'Pan с Space + влачене.',
        'Esc отменя чернова. R сменя open/resolved на избрания pin.',
      ],
    },
    {
      title: '5. Инструменти в страничния панел',
      body: [
        'Филтрирай All / Open / Resolved и търси по текст.',
        'Отговаряй в нишка под всеки pin.',
        'Експортирай всички pins като CSV.',
        'Собственикът може да качи нова версия на asset и да превключва версии.',
      ],
    },
    {
      title: '6. Споделяне и embed',
      body: [
        'Копирай share линка от dashboard. Клиентите отварят /project/[id].',
        'View only скрива коментирането; Can comment позволява pins и replies.',
        'По желание: добави /embed.js с data-project-id в сайт за бутон „Leave visual feedback“.',
      ],
    },
    {
      title: '7. Известия',
      body: [
        'При нов pin собственикът получава известие в звънеца на dashboard.',
      ],
    },
  ],
}

const es: GuideDoc = {
  title: 'Guía de uso de ProofFlow',
  intro:
    'ProofFlow permite recopilar feedback visual sobre sitios web, imágenes, PDF, vídeo, audio y otros archivos.',
  sections: [
    {
      title: '1. Iniciar sesión',
      body: [
        'Abre /login y crea una cuenta o inicia sesión.',
        'El panel requiere cuenta. Los enlaces compartidos se pueden abrir sin iniciar sesión.',
      ],
    },
    {
      title: '2. Crear un proyecto',
      body: [
        'En el Dashboard pulsa New project.',
        'Añade un título y una URL o sube un archivo.',
        'Elige Can comment o View only.',
        'Los sitios web se capturan a página completa automáticamente.',
      ],
    },
    {
      title: '3. Revisar y anotar',
      body: [
        'Clic = pin de punto. Arrastrar = resaltar un área o texto.',
        'Ajusta el área con las esquinas y añade resumen, detalle y archivo.',
        'Guarda con Pin o Ctrl/Cmd + Enter.',
      ],
    },
    {
      title: '4. Zoom y atajos',
      body: [
        'Zoom con controles, +/-, o Ctrl/Cmd + scroll. Pan con Space + arrastrar.',
        'Esc cancela. R cambia el estado del pin seleccionado.',
      ],
    },
    {
      title: '5. Barra lateral',
      body: [
        'Filtra, busca, responde en hilos y exporta CSV.',
        'El propietario puede subir nuevas versiones del asset.',
      ],
    },
    {
      title: '6. Compartir',
      body: [
        'Copia el enlace desde el dashboard. View only solo permite ver; Can comment permite comentar.',
        'Embed opcional con /embed.js y data-project-id.',
      ],
    },
    {
      title: '7. Notificaciones',
      body: [
        'Los nuevos pins generan una notificación para el propietario.',
      ],
    },
  ],
}

const de: GuideDoc = {
  title: 'ProofFlow Benutzerhandbuch',
  intro:
    'ProofFlow sammelt visuelles Feedback zu Websites, Bildern, PDFs, Video, Audio und anderen Dateien.',
  sections: [
    {
      title: '1. Anmelden',
      body: [
        'Öffne /login und erstelle ein Konto oder melde dich an.',
        'Das Dashboard braucht ein Konto. Freigabelinks funktionieren ohne Login.',
      ],
    },
    {
      title: '2. Projekt erstellen',
      body: [
        'Im Dashboard auf New project klicken.',
        'Titel plus URL oder Datei-Upload angeben.',
        'Freigabe: Can comment oder View only.',
        'Websites werden automatisch als Full-Page-Capture geladen.',
      ],
    },
    {
      title: '3. Prüfen und markieren',
      body: [
        'Klick = Punkt. Ziehen = Bereich/Text markieren.',
        'Ecken zum Anpassen nutzen; Notiz und Anhang hinzufügen.',
        'Mit Pin oder Ctrl/Cmd + Enter speichern.',
      ],
    },
    {
      title: '4. Zoom und Shortcuts',
      body: [
        'Zoom über Buttons, +/-, Ctrl/Cmd + Scroll. Pan mit Space + Ziehen.',
        'Esc bricht ab. R wechselt den Status des ausgewählten Pins.',
      ],
    },
    {
      title: '5. Seitenleiste',
      body: [
        'Filtern, suchen, in Threads antworten, CSV exportieren.',
        'Owner können neue Asset-Versionen hochladen.',
      ],
    },
    {
      title: '6. Teilen',
      body: [
        'Share-Link im Dashboard kopieren. View only = nur lesen, Can comment = kommentieren.',
        'Optional /embed.js mit data-project-id einbinden.',
      ],
    },
    {
      title: '7. Benachrichtigungen',
      body: [
        'Neue Pins erzeugen eine In-App-Benachrichtigung für den Owner.',
      ],
    },
  ],
}

const fr: GuideDoc = {
  title: 'Guide d’utilisation ProofFlow',
  intro:
    'ProofFlow sert à recueillir des retours visuels sur des sites, images, PDF, vidéos, audios et autres fichiers.',
  sections: [
    {
      title: '1. Connexion',
      body: [
        'Ouvrez /login pour créer un compte ou vous connecter.',
        'Le tableau de bord nécessite un compte. Les liens partagés s’ouvrent sans connexion.',
      ],
    },
    {
      title: '2. Créer un projet',
      body: [
        'Dans Dashboard, cliquez New project.',
        'Ajoutez un titre et une URL ou un fichier.',
        'Choisissez Can comment ou View only.',
        'Les sites sont capturés en pleine page automatiquement.',
      ],
    },
    {
      title: '3. Annoter',
      body: [
        'Clic = point. Glisser = zone/texte. Ajustez via les coins.',
        'Ajoutez résumé, détails et pièce jointe, puis Pin.',
      ],
    },
    {
      title: '4. Zoom et raccourcis',
      body: [
        'Zoom via boutons, +/-, Ctrl/Cmd + molette. Pan = Espace + glisser.',
        'Échap annule. R change le statut du pin sélectionné.',
      ],
    },
    {
      title: '5. Panneau latéral',
      body: [
        'Filtres, recherche, réponses en fil, export CSV.',
        'Le propriétaire peut uploader une nouvelle version.',
      ],
    },
    {
      title: '6. Partage',
      body: [
        'Copiez le lien depuis le dashboard. View only / Can comment selon le droit.',
        'Embed optionnel : /embed.js + data-project-id.',
      ],
    },
    {
      title: '7. Notifications',
      body: [
        'Un nouveau pin notifie le propriétaire dans le dashboard.',
      ],
    },
  ],
}

const pt: GuideDoc = {
  title: 'Manual do usuário ProofFlow',
  intro:
    'O ProofFlow coleta feedback visual sobre sites, imagens, PDFs, vídeo, áudio e outros arquivos.',
  sections: [
    {
      title: '1. Entrar',
      body: [
        'Abra /login para criar conta ou entrar.',
        'O dashboard exige conta. Links compartilhados abrem sem login.',
      ],
    },
    {
      title: '2. Criar projeto',
      body: [
        'No Dashboard clique em New project.',
        'Informe título e URL ou envie um arquivo.',
        'Escolha Can comment ou View only.',
        'Sites são capturados em página inteira automaticamente.',
      ],
    },
    {
      title: '3. Revisar e marcar',
      body: [
        'Clique = ponto. Arraste = área/texto. Ajuste pelos cantos.',
        'Adicione resumo, detalhes e anexo; salve com Pin.',
      ],
    },
    {
      title: '4. Zoom e atalhos',
      body: [
        'Zoom pelos botões, +/-, Ctrl/Cmd + scroll. Pan com Space + arrastar.',
        'Esc cancela. R alterna o status do pin selecionado.',
      ],
    },
    {
      title: '5. Barra lateral',
      body: [
        'Filtre, pesquise, responda em threads e exporte CSV.',
        'O dono pode enviar novas versões do asset.',
      ],
    },
    {
      title: '6. Compartilhar',
      body: [
        'Copie o link no dashboard. View only só visualiza; Can comment permite comentar.',
        'Embed opcional com /embed.js e data-project-id.',
      ],
    },
    {
      title: '7. Notificações',
      body: [
        'Novos pins geram notificação para o proprietário.',
      ],
    },
  ],
}

const zh: GuideDoc = {
  title: 'ProofFlow 使用指南',
  intro:
    'ProofFlow 用于对网站、图片、PDF、视频、音频及其他文件收集可视化反馈。',
  sections: [
    {
      title: '1. 登录',
      body: [
        '打开 /login 注册或登录。',
        '控制台需要账号；分享链接无需登录即可打开。',
      ],
    },
    {
      title: '2. 创建项目',
      body: [
        '在 Dashboard 点击 New project。',
        '填写标题，粘贴资源 URL 或上传文件。',
        '选择 Can comment（可评论）或 View only（仅查看）。',
        '网站会自动生成整页可滚动截图。',
      ],
    },
    {
      title: '3. 审阅与标注',
      body: [
        '单击 = 点标注；拖拽 = 框选文字/区域，可用角点调整。',
        '在侧边栏填写摘要、详细说明和附件，然后保存 Pin。',
      ],
    },
    {
      title: '4. 缩放与快捷键',
      body: [
        '使用按钮、+/- 或 Ctrl/Cmd + 滚轮缩放；Space + 拖动平移。',
        'Esc 取消草稿；R 切换所选 Pin 的状态。',
      ],
    },
    {
      title: '5. 侧边栏',
      body: [
        '可筛选、搜索、回复线程并导出 CSV。',
        '所有者可上传新版本资源。',
      ],
    },
    {
      title: '6. 分享',
      body: [
        '从控制台复制分享链接。View only 仅查看，Can comment 可评论。',
        '可选嵌入：/embed.js 并设置 data-project-id。',
      ],
    },
    {
      title: '7. 通知',
      body: [
        '有人添加 Pin 时，所有者会在控制台收到通知。',
      ],
    },
  ],
}

const ru: GuideDoc = {
  title: 'Руководство пользователя ProofFlow',
  intro:
    'ProofFlow собирает визуальную обратную связь по сайтам, изображениям, PDF, видео, аудио и другим файлам.',
  sections: [
    {
      title: '1. Вход',
      body: [
        'Откройте /login и создайте аккаунт или войдите.',
        'Для Dashboard нужен аккаунт. Общие ссылки открываются без входа.',
      ],
    },
    {
      title: '2. Создание проекта',
      body: [
        'В Dashboard нажмите New project.',
        'Укажите название и URL или загрузите файл.',
        'Выберите Can comment или View only.',
        'Сайты автоматически захватываются целиком со скроллом.',
      ],
    },
    {
      title: '3. Проверка и заметки',
      body: [
        'Клик = точка. Перетаскивание = область/текст. Углы меняют размер.',
        'Добавьте краткое описание, детали и файл, затем Pin.',
      ],
    },
    {
      title: '4. Масштаб и горячие клавиши',
      body: [
        'Zoom кнопками, +/-, Ctrl/Cmd + scroll. Pan = Space + перетаскивание.',
        'Esc отменяет. R меняет статус выбранного pin.',
      ],
    },
    {
      title: '5. Боковая панель',
      body: [
        'Фильтры, поиск, ответы в треде, экспорт CSV.',
        'Владелец может загрузить новую версию asset.',
      ],
    },
    {
      title: '6. Доступ',
      body: [
        'Скопируйте ссылку в dashboard. View only / Can comment задают права.',
        'Опционально: /embed.js с data-project-id.',
      ],
    },
    {
      title: '7. Уведомления',
      body: [
        'Новый pin создаёт уведомление владельцу в dashboard.',
      ],
    },
  ],
}

const ar: GuideDoc = {
  title: 'دليل استخدام ProofFlow',
  intro:
    'يساعد ProofFlow على جمع ملاحظات بصرية حول المواقع والصور وملفات PDF والفيديو والصوت وغيرها.',
  sections: [
    {
      title: '1. تسجيل الدخول',
      body: [
        'افتح /login لإنشاء حساب أو تسجيل الدخول.',
        'لوحة التحكم تتطلب حسابًا. روابط المشاركة تُفتح بدون تسجيل دخول.',
      ],
    },
    {
      title: '2. إنشاء مشروع',
      body: [
        'من Dashboard اختر New project.',
        'أضف عنوانًا ورابطًا أو ارفع ملفًا.',
        'حدد Can comment أو View only.',
        'يتم التقاط المواقع كصفحة كاملة قابلة للتمرير تلقائيًا.',
      ],
    },
    {
      title: '3. المراجعة والتعليق',
      body: [
        'نقرة = نقطة. سحب = تحديد نص/منطقة مع مقابض الزوايا.',
        'أضف ملخصًا وتفاصيل ومرفقًا ثم احفظ Pin.',
      ],
    },
    {
      title: '4. التكبير والاختصارات',
      body: [
        'التكبير عبر الأزرار أو +/− أو Ctrl/Cmd مع التمرير. التحريك: Space مع السحب.',
        'Esc يلغي المسودة. R يغيّر حالة الـ pin المحدد.',
      ],
    },
    {
      title: '5. الشريط الجانبي',
      body: [
        'صفِّ، ابحث، رد في المحادثات، وصدِّر CSV.',
        'يمكن للمالك رفع إصدار جديد للأصل.',
      ],
    },
    {
      title: '6. المشاركة',
      body: [
        'انسخ رابط المشاركة من لوحة التحكم.',
        'اختياريًا استخدم /embed.js مع data-project-id.',
      ],
    },
    {
      title: '7. الإشعارات',
      body: [
        'إضافة pin جديد ترسل إشعارًا لمالك المشروع.',
      ],
    },
  ],
}

const ja: GuideDoc = {
  title: 'ProofFlow ユーザーガイド',
  intro:
    'ProofFlow は、ウェブサイト、画像、PDF、動画、音声、その他ファイルへのビジュアルフィードバックを集めます。',
  sections: [
    {
      title: '1. ログイン',
      body: [
        '/login でアカウント作成またはログインします。',
        'ダッシュボードにはログインが必要です。共有リンクは未ログインでも開けます。',
      ],
    },
    {
      title: '2. プロジェクト作成',
      body: [
        'Dashboard で New project をクリック。',
        'タイトルと URL、またはファイルを追加。',
        '共有権限は Can comment / View only。',
        'ウェブサイトは自動でフルページキャプチャされます。',
      ],
    },
    {
      title: '3. レビューと注釈',
      body: [
        'クリック = ポイント。ドラッグ = 範囲/テキスト。角でサイズ変更。',
        '要約・詳細・添付を追加して Pin で保存。',
      ],
    },
    {
      title: '4. ズームとショートカット',
      body: [
        'ボタン、+/−、Ctrl/Cmd + スクロールでズーム。Space + ドラッグでパン。',
        'Esc で下書き取消。R で選択中ピンの状態切替。',
      ],
    },
    {
      title: '5. サイドバー',
      body: [
        'フィルタ、検索、スレッド返信、CSV 書き出し。',
        '所有者は新しいアセット版をアップロードできます。',
      ],
    },
    {
      title: '6. 共有',
      body: [
        'ダッシュボードから共有リンクをコピー。',
        '任意で /embed.js と data-project-id を埋め込み。',
      ],
    },
    {
      title: '7. 通知',
      body: [
        '新しいピンは所有者にダッシュボード通知されます。',
      ],
    },
  ],
}

export const GUIDE_BY_LANG: Record<GuideLang, GuideDoc> = {
  en,
  bg,
  es,
  de,
  fr,
  pt,
  zh,
  ru,
  ar,
  ja,
}
