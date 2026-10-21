/**
 * ╔══════════════════════════════════════════════╗
 * ║          PORTFOLIO CONFIG                    ║
 * ║     ทุกสิ่งถูกควบคุมจากเงาเพียงจุดเดียว     ║
 * ╚══════════════════════════════════════════════╝
 */

export const CONFIG = {
  meta: {
    firstName: 'CID',
    lastName: 'KAGENOU',
    fullName: 'CID KAGENOU',
    roles: {
      en: ['Developer in the Shadows', 'AI / LLM Experimenter', 'Physics Seeker'],
      th: ['ผู้เดินอยู่ระหว่างแสงและเงา', 'ผู้ทดลอง AI / LLM', 'ผู้ไล่ตามกฎที่ซ่อนอยู่ในฟิสิกส์'],
    },
    greeting: {
      en: 'From the shadows, I build.',
      th: 'เมื่อมีแสง เงาจึงถือกำเนิด — และในเงานั้น ฉันยังคงสร้างต่อไป.',
    },
    location: {
      en: 'Trat, Thailand 🇹🇭',
      th: 'ตราด, ประเทศไทย 🇹🇭',
    },
    available: true,
  },

  about: {
    bio: {
      en: [
        'I do not build things merely to make them work — I make them fast, quiet, and precise enough to obey the system without wasted motion.',
        'AI/LLM, automation, native C, Android/Kotlin, and physics all live in the same shadow. What looks like complexity is usually just a structure that has not been decoded yet.',
      ],
      th: [
        'ฉันไม่ได้สร้างของเพื่อให้มันแค่ “ใช้ได้” — ถ้ามันยังช้า ยังรก หรือยังมีสิ่งเกินจำเป็น แปลว่างานนั้นยังไม่จบ',
        'AI/LLM, automation, native C, Android/Kotlin และฟิสิกส์ คือสิ่งที่ฉันไล่ตามอยู่เรื่อย ๆ — เพราะเบื้องหลังความซับซ้อน มักมีกฎบางอย่างซ่อนอยู่เสมอ',
      ],
    },
    tags: ['AI / LLM', 'Automation', 'Physics', 'Discord Bots', 'Android', 'Open Source'],
    stats: [
      { number: '6', label: { en: 'Public Artifacts', th: 'Public Repos' } },
      { number: '5', label: { en: 'Featured Projects', th: 'โปรเจกต์เด่น' } },
      { number: '4', label: { en: 'Core Languages', th: 'Core Languages' } },
      { number: '∞', label: { en: 'Experiments in the Dark', th: 'Experiments' } },
    ],
  },

  skills: [
    { category: { en: 'Languages', th: 'Languages' }, tags: ['C', 'Python', 'JavaScript', 'Kotlin', 'HTML/CSS'] },
    { category: { en: 'AI & Automation', th: 'AI & Automation' }, tags: ['Gemini API', 'LLM Tooling', 'Discord Bots', 'yt-dlp', 'FFmpeg'] },
    { category: { en: 'App & Web', th: 'App & Web' }, tags: ['Jetpack Compose', 'Media3', 'Chrome Extension', 'Vanilla JS', 'Vercel'] },
    { category: { en: 'Tools & Systems', th: 'Tools & Systems' }, tags: ['Git', 'GitHub Actions', 'Docker', 'Linux / Termux', 'llama.cpp'] },
  ],

  projects: [
    {
      slug: 'music-app',
      name: 'Music App for Android',
      type: 'apps',
      featured: true,
      updated: '2026-10-11',
      eyebrow: { en: 'ANDROID / MEDIA ENGINEERING', th: 'ANDROID / ระบบเล่นสื่อ' },
      description: {
        en: 'A standalone Android music player. Search and resolve audio on-device with NewPipeExtractor, play in the background with Media3, and ship updates through GitHub Actions.',
        th: 'แอปเพลง Android แบบ standalone ค้นหาและดึงแหล่งเสียงในตัวด้วย NewPipeExtractor เล่นเบื้องหลังผ่าน Media3 และส่งอัปเดตด้วย GitHub Actions',
      },
      highlights: {
        en: ['Compose UI, background playback, queue and sleep timer', 'Automated dependency checks, APK builds and in-app update flow'],
        th: ['Compose UI, เล่นเพลงเบื้องหลัง, คิวเพลง และตั้งเวลาปิด', 'ตรวจ dependency, build APK และรองรับการอัปเดตในแอป'],
      },
      approach: {
        en: 'A self-contained client rather than a Discord bot or separate streaming backend.',
        th: 'ออกแบบให้แอปทำงานได้ในตัวเอง ไม่ต้องพึ่ง Discord bot หรือ backend แยก',
      },
      preview: ['COMPOSE / UI', 'NEWPIPE / RESOLVE', 'MEDIA3 / PLAYBACK', 'CI / RELEASE'],
      tech: ['Kotlin', 'Jetpack Compose', 'Media3', 'GitHub Actions'],
      icon: '◈',
      github: 'https://github.com/I-am-Shadow01/music-app',
      demo: null,
    },
    {
      slug: 'portfolio-vercel',
      name: 'CID / Interactive Portfolio',
      type: 'web',
      featured: false,
      updated: '2026-09-21',
      eyebrow: { en: 'CREATIVE WEB / VISUAL SYSTEMS', th: 'WEB / ระบบภาพเคลื่อนไหว' },
      description: {
        en: 'A zero-framework portfolio built from native ES modules, an optimized Canvas2D visual engine and an adaptive shared animation loop.',
        th: 'Portfolio ที่ไม่พึ่ง framework ใช้ ES modules, Canvas2D และลูปแอนิเมชันส่วนกลางที่ปรับคุณภาพอัตโนมัติ',
      },
      highlights: {
        en: ['Single requestAnimationFrame loop across animated features', 'Adaptive effects, bilingual interface and reduced-motion support'],
        th: ['ใช้ requestAnimationFrame ส่วนกลางร่วมกันทุกเอฟเฟกต์', 'ปรับคุณภาพตามเครื่อง รองรับสองภาษาและ reduced motion'],
      },
      approach: {
        en: 'Keep the rendering engine lean: native modules, cached drawing work, and no client framework.',
        th: 'รักษา engine ให้เบา ใช้ native modules, cache งานวาด และไม่โหลด framework เพิ่ม',
      },
      preview: ['NATIVE / MODULES', 'CANVAS / 2D', 'RAF / SHARED', 'QUALITY / AUTO'],
      tech: ['JavaScript', 'Canvas2D', 'CSS', 'Vercel'],
      icon: '⌘',
      github: 'https://github.com/I-am-Shadow01/PORTFOLIO-VERCEL',
      demo: 'https://website-test-vercel-iota.vercel.app',
    },
    {
      slug: 'discord-bot-c',
      name: 'Native C / Discord AI Bot',
      type: 'ai',
      featured: false,
      updated: '2026-01-15',
      eyebrow: { en: 'SYSTEMS / AI INTEGRATION', th: 'SYSTEMS / เชื่อมต่อ AI' },
      description: {
        en: 'A Windows-native Discord bot using WinHTTP, Gemini AI, per-channel conversation context and background request workers.',
        th: 'Discord bot แบบ native C บน Windows เชื่อม Gemini AI ด้วย WinHTTP มี context แยก channel และทำงานแบบ multithread',
      },
      highlights: {
        en: ['No heavyweight application runtime', 'Nonblocking AI requests and channel-scoped context'],
        th: ['ไม่ต้องพึ่ง application runtime ขนาดใหญ่', 'เรียก AI โดยไม่บล็อกงานหลัก และแยก context ตาม channel'],
      },
      approach: {
        en: 'Explore the low-level boundaries between a real-time chat gateway and an AI inference API.',
        th: 'สำรวจการทำงานระดับล่างระหว่าง Discord gateway กับ AI API',
      },
      preview: ['GATEWAY / DISCORD', 'HTTP / NATIVE C', 'GEMINI / CONTEXT', 'WORKERS / ASYNC'],
      tech: ['C', 'WinHTTP', 'Gemini API', 'Discord API'],
      icon: '⌁',
      github: 'https://github.com/I-am-Shadow01/discord-bot-c',
      demo: null,
    },
    {
      slug: 'force-translate-unlocker',
      name: 'Force Translate Unlocker',
      type: 'tools',
      featured: false,
      updated: '2026-03-07',
      eyebrow: { en: 'BROWSER EXTENSION / ACCESSIBILITY', th: 'BROWSER EXTENSION / การแปลเว็บ' },
      description: {
        en: 'A Manifest V3 Chrome extension that removes translation-blocking DOM attributes, including on dynamically rendered SPA pages.',
        th: 'Chrome extension แบบ Manifest V3 ที่จัดการ DOM attributes ซึ่งขวางการแปล รองรับเว็บ SPA ที่อัปเดตเนื้อหาแบบ dynamic',
      },
      highlights: {
        en: ['Handles translation blockers and dynamically inserted content', 'Local-only operation with an on/off popup'],
        th: ['จัดการตัวบล็อกการแปลและเนื้อหาที่เพิ่มเข้ามาใหม่', 'ทำงานภายในเบราว์เซอร์ พร้อมปุ่มเปิด/ปิด'],
      },
      approach: {
        en: 'Repair browser behavior at the DOM layer, without an external translation service.',
        th: 'แก้ที่ชั้น DOM โดยไม่ต้องส่งข้อความไปยังบริการแปลภายนอก',
      },
      preview: ['MANIFEST / V3', 'DOM / OBSERVE', 'ATTR / PATCH', 'LOCAL / ONLY'],
      tech: ['JavaScript', 'Manifest V3', 'MutationObserver'],
      icon: '⌗',
      github: 'https://github.com/I-am-Shadow01/force-translate-unlocker',
      demo: null,
    },
    {
      slug: 'discord-music-bot',
      name: 'Discord Music Bot',
      type: 'bots',
      featured: false,
      updated: '2026-03-09',
      eyebrow: { en: 'AUTOMATION / AUDIO', th: 'AUTOMATION / ระบบเสียง' },
      description: {
        en: 'A Discord audio bot with slash commands, a playback queue, loop and shuffle controls, built with discord.py, yt-dlp and FFmpeg.',
        th: 'Discord music bot รองรับ slash commands, queue, loop, shuffle และ volume สร้างด้วย discord.py, yt-dlp และ FFmpeg',
      },
      highlights: {
        en: ['Voice playback and queue management', 'Slash commands and a music control panel'],
        th: ['เล่นเสียงใน voice channel และจัดการคิว', 'ควบคุมผ่าน slash commands และ music panel'],
      },
      approach: {
        en: 'Separate media retrieval, command handling and audio playback responsibilities.',
        th: 'แยกหน้าที่ของการค้นหาสื่อ คำสั่ง และการเล่นเสียงออกจากกัน',
      },
      preview: ['COMMAND / PLAY', 'YTDLP / EXTRACT', 'FFMPEG / STREAM', 'QUEUE / MANAGE'],
      tech: ['Python', 'discord.py', 'yt-dlp', 'FFmpeg'],
      icon: '♫',
      github: 'https://github.com/I-am-Shadow01/discord-music-bot',
      demo: null,
    },
  ],

  donate: {
    heading: { en: 'Fuel the Shadow', th: 'เติมเชื้อไฟให้เงา' },
    subheading: {
      en: 'If something born in the shadows proved useful, you may fuel the next experiment. ☕',
      th: 'ถ้าสิ่งที่สร้างจากเงานี้มีประโยชน์กับคุณ จะเติมเชื้อไฟให้การทดลองครั้งต่อไปก็ยินดี ☕',
    },
    promptpay: {
      enabled: true,
      id: '0889304036',
      accountName: 'CID KAGENOU',
      currency: 'THB',
      presetAmounts: [20, 50, 100, 200],
      defaultAmount: 50,
      allowCustomAmount: true,
    },
    trueMoneyWallet: { enabled: false, phoneNumber: '081-234-5678' },
    bankTransfer: {
      enabled: false,
      bankName: 'KASIKORNBANK (K+)',
      accountNumber: '221-8-12719-6',
      accountName: 'CID KAGENOU',
    },
    links: [],
  },

  contact: {
    heading: { en: 'Enter the Shadow Network', th: 'ส่งสัญญาณถึงฉัน' },
    subheading: {
      en: 'Have something worthy of being built, or a problem the system still cannot solve? Send a signal into the dark.',
      th: 'มีโปรเจกต์ที่น่าสนใจ ปัญหาที่แก้ไม่ลง หรือแค่เรื่อง AI กับฟิสิกส์ที่อยากคุย — ส่งสัญญาณมาได้',
    },
    links: [
      { label: 'Email', value: 'naphatsaranmek@gmail.com', icon: '✉', href: 'mailto:naphatsaranmek@gmail.com', copyable: true },
      { label: 'GitHub', value: '@I-am-Shadow01', icon: 'GH', href: 'https://github.com/I-am-Shadow01', copyable: false },
      { label: 'Discord', value: 'cid_kagenou_02', icon: 'DC', href: 'cid_kagenou_02', copyable: true },
      { label: 'Twitter / X', value: '@PPLEThai', icon: '𝕏', href: 'https://x.com/PPLEThai', copyable: false },
    ],
  },
};
