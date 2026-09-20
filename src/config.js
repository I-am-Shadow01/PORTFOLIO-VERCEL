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
      th: ['ผู้รังสรรค์จากเงามืด', 'ผู้ทดลองปัญญาแห่งจักรกล', 'ผู้ตามหาความจริงที่ซ่อนอยู่ในฟิสิกส์'],
    },
    greeting: {
      en: 'From the shadows, I build.',
      th: 'เมื่อแสงถือกำเนิด เงาย่อมตื่นขึ้นตาม.',
    },
    location: {
      en: 'Trat, Thailand 🇹🇭',
      th: 'ตราด · ดินแดนปลายขอบของแสง 🇹🇭',
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
        'ฉันไม่เคยพอใจกับสิ่งที่แค่ “ใช้งานได้” — ทุกระบบควรเคลื่อนไหวอย่างเงียบงัน แม่นยำ และทิ้งไว้เพียงร่องรอยของความตั้งใจ',
        'AI/LLM, automation, native C, Android/Kotlin และฟิสิกส์ สำหรับฉันไม่ใช่คนละโลก — มันคือเศษเสี้ยวของกฎเดียวกัน ที่ยังรอให้ใครสักคนเปิดม่านเงาออกดู',
      ],
    },
    tags: ['AI / LLM', 'Automation', 'Physics', 'Discord Bots', 'Android', 'Open Source'],
    stats: [
      { number: '6', label: { en: 'Public Artifacts', th: 'ร่องรอยที่ปล่อยสู่แสง' } },
      { number: '4', label: { en: 'Featured Constructs', th: 'บทที่ถูกจารึกไว้' } },
      { number: '4', label: { en: 'Core Languages', th: 'ภาษาแห่งการรังสรรค์' } },
      { number: '∞', label: { en: 'Experiments in the Dark', th: 'การทดลองที่ยังไร้จุดจบ' } },
    ],
  },

  skills: [
    { category: { en: 'Languages', th: 'ถ้อยคำที่สั่งการโลก' }, tags: ['C', 'Python', 'JavaScript', 'Kotlin', 'HTML/CSS'] },
    { category: { en: 'AI & Automation', th: 'ปัญญาที่ถือกำเนิดจากจักรกล' }, tags: ['Gemini API', 'LLM Tooling', 'Discord Bots', 'yt-dlp', 'FFmpeg'] },
    { category: { en: 'App & Web', th: 'สิ่งที่ก่อร่างในโลกดิจิทัล' }, tags: ['Jetpack Compose', 'Media3', 'Chrome Extension', 'Vanilla JS', 'Vercel'] },
    { category: { en: 'Tools & Systems', th: 'กลไกที่อยู่เบื้องหลัง' }, tags: ['Git', 'GitHub Actions', 'Docker', 'Linux / Termux', 'llama.cpp'] },
  ],

  projects: [
    {
      name: 'Discord Bot in C + Gemini AI',
      description: {
        en: 'A native C Discord bot for Windows using WinHTTP + Gemini AI, with per-channel context and multithreading — quiet execution without losing tempo.',
        th: 'บอท Discord ที่ถูกหล่อขึ้นจาก native C เชื่อม Gemini AI ผ่าน WinHTTP พร้อม context แยกต่อ channel และ multi-threading — ไม่มีสิ่งฟุ่มเฟือย มีเพียงกลไกที่เคลื่อนไหวอย่างเงียบงัน',
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
        th: 'Chrome extension ที่ค่อย ๆ รื้อกำแพงการแปลซึ่งเว็บไซต์ซ่อนไว้ รองรับ SPA / React / Next.js และทำงานอยู่ภายในเครื่อง — เพราะข้อจำกัดทุกอย่าง ล้วนเป็นเพียงสิ่งที่รอวันถูกมองทะลุ',
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
        th: 'ระบบเพลงบน Discord ที่ควบคุม queue, loop, shuffle และ volume ผ่าน discord.py + yt-dlp + FFmpeg — ปล่อยให้ทุกท่วงทำนองไหลไปตามจังหวะ โดยไม่มีเสียงรบกวนจากสิ่งที่ไม่จำเป็น',
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
    heading: { en: 'Fuel the Shadow', th: 'จุดประกายให้เงายังคงเดินต่อ' },
    subheading: {
      en: 'If something born in the shadows proved useful, you may fuel the next experiment. ☕',
      th: 'หากสิ่งที่ถือกำเนิดจากเงานี้เคยช่วยอะไรคุณได้แม้เพียงเล็กน้อย คุณก็สามารถทิ้งประกายเล็ก ๆ ไว้ให้การทดลองครั้งถัดไป ☕',
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
    heading: { en: 'Enter the Shadow Network', th: 'ฝากถ้อยคำไว้ในเงา' },
    subheading: {
      en: 'Have something worthy of being built, or a problem the system still cannot solve? Send a signal into the dark.',
      th: 'หากมีบางสิ่งที่ควรถูกสร้าง หรือปัญหาที่ยังไม่มีใครมองเห็นโครงสร้างของมัน ลองฝากถ้อยคำไว้ในเงา — บางทีคำตอบอาจย้อนกลับมาในเวลาที่เหมาะสม',
    },
    links: [
      { label: 'Email', value: 'naphatsaranmek@gmail.com', icon: '✉', href: 'mailto:naphatsaranmek@gmail.com', copyable: true },
      { label: 'GitHub', value: '@I-am-Shadow01', icon: 'GH', href: 'https://github.com/I-am-Shadow01', copyable: false },
      { label: 'Discord', value: 'cid_kagenou_02', icon: 'DC', href: 'cid_kagenou_02', copyable: true },
      { label: 'Twitter / X', value: '@PPLEThai', icon: '𝕏', href: 'https://x.com/PPLEThai', copyable: false },
    ],
  },
};
