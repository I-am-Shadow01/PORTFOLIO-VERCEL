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
      th: ['นักพัฒนาแห่งเงา', 'ผู้ทดลอง AI / LLM', 'ผู้แสวงหาความจริงแห่งฟิสิกส์'],
    },
    greeting: {
      en: 'From the shadows, I build.',
      th: 'เมื่อมีแสง เงาจึงถือกำเนิด.',
    },
    location: {
      en: 'Trat, Thailand 🇹🇭',
      th: 'ตราด ประเทศไทย 🇹🇭',
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
        'ฉันไม่ได้สร้างระบบเพื่อให้มันเพียง “ใช้ได้” — มันต้องเร็ว นิ่ง และเคลื่อนไหวตามเจตจำนงโดยไร้ส่วนเกิน',
        'AI/LLM, automation, native C, Android/Kotlin และฟิสิกส์ล้วนอยู่ในเงาเดียวกัน — สิ่งที่คนอื่นเรียกว่าความซับซ้อน สำหรับฉันคือกฎที่ยังไม่ถูกเปิดเผย',
      ],
    },
    tags: ['AI / LLM', 'Automation', 'Physics', 'Discord Bots', 'Android', 'Open Source'],
    stats: [
      { number: '6', label: { en: 'Public Artifacts', th: 'สิ่งประดิษฐ์ที่เปิดเผย' } },
      { number: '4', label: { en: 'Featured Constructs', th: 'ผลงานที่ถูกเปิดเผย' } },
      { number: '4', label: { en: 'Core Languages', th: 'ภาษาหลักในคลังอาวุธ' } },
      { number: '∞', label: { en: 'Experiments in the Dark', th: 'การทดลองในเงามืด' } },
    ],
  },

  skills: [
    { category: { en: 'Languages', th: 'ภาษาแห่งคำสั่ง' }, tags: ['C', 'Python', 'JavaScript', 'Kotlin', 'HTML/CSS'] },
    { category: { en: 'AI & Automation', th: 'ปัญญาและจักรกล' }, tags: ['Gemini API', 'LLM Tooling', 'Discord Bots', 'yt-dlp', 'FFmpeg'] },
    { category: { en: 'App & Web', th: 'โลกดิจิทัล' }, tags: ['Jetpack Compose', 'Media3', 'Chrome Extension', 'Vanilla JS', 'Vercel'] },
    { category: { en: 'Tools & Systems', th: 'เครื่องมือและระบบ' }, tags: ['Git', 'GitHub Actions', 'Docker', 'Linux / Termux', 'llama.cpp'] },
  ],

  projects: [
    {
      name: 'Discord Bot in C + Gemini AI',
      description: {
        en: 'A native C Discord bot for Windows using WinHTTP + Gemini AI, with per-channel context and multithreading — quiet execution without losing tempo.',
        th: 'บอท Discord ฝั่ง native C ที่ตัด runtime หนักออกไป เชื่อม Gemini AI ผ่าน WinHTTP พร้อม context แยกต่อ channel และ multi-threading — เคลื่อนไหวอยู่ในเงาโดยไม่เสียจังหวะ',
      },
      tech: ['C', 'WinHTTP', 'Gemini API', 'Discord API'],
      icon: '🤖',
      github: 'https://github.com/I-am-Shadow01/discord-bot-c',
      demo: null,
    },
    {
      name: 'Force Translate Unlocker',
      description: {
        en: 'A Chrome extension that strips translation barriers from websites, including SPA / React / Next.js pages. If a wall exists, remove the wall.',
        th: 'Chrome extension ที่ฉีกข้อจำกัดการแปลซึ่งเว็บไซต์ซ่อนไว้ รองรับ SPA / React / Next.js และทำงานในเครื่องทั้งหมด — หากมีกำแพง ก็เพียงรื้อมันทิ้ง',
      },
      tech: ['JavaScript', 'Chrome Extension', 'Manifest V3'],
      icon: '🌐',
      github: 'https://github.com/I-am-Shadow01/force-translate-unlocker',
      demo: null,
    },
    {
      name: 'Discord Music Bot',
      description: {
        en: 'A Discord music system controlling queue, loop, shuffle, and volume through discord.py + yt-dlp + FFmpeg — every sound moves only when commanded.',
        th: 'ระบบเพลงบน Discord ที่ควบคุม queue, loop, shuffle และ volume ผ่าน discord.py + yt-dlp + FFmpeg — ให้ทุกเสียงเคลื่อนไหวเมื่อเงาออกคำสั่งเท่านั้น',
      },
      tech: ['Python', 'discord.py', 'yt-dlp', 'FFmpeg'],
      icon: '🎵',
      github: 'https://github.com/I-am-Shadow01/discord-music-bot',
      demo: null,
    },
    {
      name: 'Music App for Android',
      description: {
        en: 'A standalone Android music app that searches and resolves YouTube audio inside the app with NewPipeExtractor, powered by Media3, Jetpack Compose, and an automated GitHub Actions update pipeline.',
        th: 'แอปเพลง Android แบบ standalone ที่ค้นหาและดึงเสียงจาก YouTube ภายในตัวเองด้วย NewPipeExtractor ใช้ Media3 + Jetpack Compose และมีสายอัปเดตอัตโนมัติ — ระบบที่พึ่งพาเงาของตัวเอง ไม่ต้องรอคำสั่งจากเซิร์ฟเวอร์ภายนอก',
      },
      tech: ['Kotlin', 'Jetpack Compose', 'Media3', 'NewPipeExtractor'],
      icon: '📱',
      github: 'https://github.com/I-am-Shadow01/music-app',
      demo: null,
    },
  ],

  donate: {
    heading: { en: 'Fuel the Shadow', th: 'หล่อเลี้ยงเงา' },
    subheading: {
      en: 'If something born in the shadows proved useful, you may fuel the next experiment. ☕',
      th: 'หากสิ่งที่ถือกำเนิดจากเงานี้มีประโยชน์กับคุณ จะส่งพลังให้การทดลองครั้งต่อไปก็ยินดี ☕',
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
    heading: { en: 'Enter the Shadow Network', th: 'ส่งสัญญาณสู่เงา' },
    subheading: {
      en: 'Have something worthy of being built, or a problem the system still cannot solve? Send a signal into the dark.',
      th: 'มีบางสิ่งที่คู่ควรจะถูกสร้าง หรือปัญหาที่ยังไม่มีใครเปิดโปงกฎของมัน? ส่งสัญญาณมา แล้วเงาจะเป็นผู้ตอบเอง',
    },
    links: [
      { label: 'Email', value: 'naphatsaranmek@gmail.com', icon: '✉', href: 'mailto:naphatsaranmek@gmail.com', copyable: true },
      { label: 'GitHub', value: '@I-am-Shadow01', icon: 'GH', href: 'https://github.com/I-am-Shadow01', copyable: false },
      { label: 'Discord', value: 'cid_kagenou_02', icon: 'DC', href: 'cid_kagenou_02', copyable: true },
      { label: 'Twitter / X', value: '@PPLEThai', icon: '𝕏', href: 'https://x.com/PPLEThai', copyable: false },
    ],
  },
};
