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
      th: ['Developer ในเงา', 'AI / LLM Experimenter', 'คนที่ชอบไล่ตามความจริงของฟิสิกส์'],
    },
    greeting: {
      en: 'From the shadows, I build.',
      th: 'เมื่อมีแสง เงาจึงถือกำเนิด.',
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
        'ฉันชอบสร้างของที่ไม่ใช่แค่ใช้ได้ แต่ต้องเร็ว เรียบ และไม่มีอะไรเกินจำเป็น',
        'สนใจ AI/LLM, automation, native C, Android/Kotlin และฟิสิกส์ — ยิ่งระบบซับซ้อน ก็ยิ่งอยากรู้ว่าข้างใต้มันทำงานยังไง',
      ],
    },
    tags: ['AI / LLM', 'Automation', 'Physics', 'Discord Bots', 'Android', 'Open Source'],
    stats: [
      { number: '6', label: { en: 'Public Artifacts', th: 'Public Repos' } },
      { number: '4', label: { en: 'Featured Constructs', th: 'Featured Projects' } },
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
      name: 'Discord Bot in C + Gemini AI',
      description: {
        en: 'A native C Discord bot for Windows using WinHTTP + Gemini AI, with per-channel context and multithreading — quiet execution without losing tempo.',
        th: 'บอท Discord แบบ native C บน Windows เชื่อม Gemini AI ผ่าน WinHTTP รองรับ context แยกต่อ channel และ multi-threading โดยไม่พึ่ง runtime หนัก ๆ',
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
        th: 'Chrome extension ที่ลบตัวบล็อกการแปลอัตโนมัติ รองรับ SPA / React / Next.js และทำงานทั้งหมดในเครื่อง — ถ้ามีกำแพง ก็รื้อมันออก',
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
        th: 'บอทเพลง Discord ที่ใช้ discord.py + yt-dlp + FFmpeg รองรับ queue, loop, shuffle, volume และ music control panel',
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
        th: 'แอปเพลง Android แบบ standalone ที่ค้นหาและดึงเสียงจาก YouTube ภายในตัวเองด้วย NewPipeExtractor ใช้ Media3 + Jetpack Compose พร้อมสายอัปเดตอัตโนมัติ — ระบบที่ยืนได้ด้วยเงาของตัวเอง โดยไม่ต้องฝากชะตาไว้กับเซิร์ฟเวอร์ภายนอก',
      },
      tech: ['Kotlin', 'Jetpack Compose', 'Media3', 'NewPipeExtractor'],
      icon: '📱',
      github: 'https://github.com/I-am-Shadow01/music-app',
      demo: null,
    },
  ],

  donate: {
    heading: { en: 'Fuel the Shadow', th: 'Fuel the Shadow' },
    subheading: {
      en: 'If something born in the shadows proved useful, you may fuel the next experiment. ☕',
      th: 'ถ้า tool ที่ทำไว้มีประโยชน์กับคุณ จะเติมพลังให้โปรเจกต์ถัดไปก็ยินดี ☕',
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
    heading: { en: 'Enter the Shadow Network', th: 'Contact' },
    subheading: {
      en: 'Have something worthy of being built, or a problem the system still cannot solve? Send a signal into the dark.',
      th: 'มีโปรเจกต์น่าสนใจ หรืออยากคุยเรื่องโค้ด AI หรือฟิสิกส์ ก็ทักมาได้',
    },
    links: [
      { label: 'Email', value: 'naphatsaranmek@gmail.com', icon: '✉', href: 'mailto:naphatsaranmek@gmail.com', copyable: true },
      { label: 'GitHub', value: '@I-am-Shadow01', icon: 'GH', href: 'https://github.com/I-am-Shadow01', copyable: false },
      { label: 'Discord', value: 'cid_kagenou_02', icon: 'DC', href: 'cid_kagenou_02', copyable: true },
      { label: 'Twitter / X', value: '@PPLEThai', icon: '𝕏', href: 'https://x.com/PPLEThai', copyable: false },
    ],
  },
};
