/**
 * ╔══════════════════════════════════════════════╗
 * ║          PORTFOLIO CONFIG                    ║
 * ║     ทุกสิ่งถูกควบคุมจากเงาเพียงจุดเดียว     ║
 * ╚══════════════════════════════════════════════╝
 */

export const CONFIG = {

  // ─── General ──────────────────────────────────
  meta: {
    firstName: 'CID',
    lastName: 'KAGENOU',
    fullName: 'CID KAGENOU',
    roles: [
      'Developer in the Shadows',
      'AI / LLM Experimenter',
      'Physics Seeker',
    ],
    greeting: 'From the shadows, I build.',
    location: 'Trat, Thailand 🇹🇭',
    available: true,
  },

  // ─── About / Bio ──────────────────────────────
  about: {
    bio: [
      `ผมไม่ได้สร้างสิ่งต่าง ๆ เพื่อให้มันแค่ “ทำงานได้” — ผมสร้างให้มันเร็ว นิ่ง และเชื่อฟังเจตจำนงของระบบอย่างสมบูรณ์`,
      `ในเงามีทั้ง AI/LLM, automation, native C, Android/Kotlin และฟิสิกส์ — สิ่งที่คนอื่นมองว่าเป็นความซับซ้อน สำหรับผมมันเป็นแค่โครงสร้างที่ยังถอดรหัสไม่หมด`,
    ],
    tags: ['AI / LLM', 'Automation', 'Physics', 'Discord Bots', 'Android', 'Open Source'],
    stats: [
      { number: '6',  label: 'Public Artifacts' },
      { number: '4',  label: 'Featured Constructs' },
      { number: '4',  label: 'Core Languages' },
      { number: '∞',  label: 'Experiments in the Dark' },
    ],
  },

  // ─── Skills ───────────────────────────────────
  skills: [
    {
      category: 'Languages',
      tags: ['C', 'Python', 'JavaScript', 'Kotlin', 'HTML/CSS'],
    },
    {
      category: 'AI & Automation',
      tags: ['Gemini API', 'LLM Tooling', 'Discord Bots', 'yt-dlp', 'FFmpeg'],
    },
    {
      category: 'App & Web',
      tags: ['Jetpack Compose', 'Media3', 'Chrome Extension', 'Vanilla JS', 'Vercel'],
    },
    {
      category: 'Tools & Systems',
      tags: ['Git', 'GitHub Actions', 'Docker', 'Linux / Termux', 'llama.cpp'],
    },
  ],

  // ─── Projects ─────────────────────────────────
  projects: [
    {
      name: 'Discord Bot in C + Gemini AI',
      description: 'บอท Discord ฝั่ง native C ที่ตัด runtime หนักออกไป เชื่อม Gemini AI ผ่าน WinHTTP พร้อม context แยกต่อ channel และ multi-threading — ทำงานเงียบ ๆ แต่ไม่เสียจังหวะ',
      tech: ['C', 'WinHTTP', 'Gemini API', 'Discord API'],
      icon: '🤖',
      github: 'https://github.com/I-am-Shadow01/discord-bot-c',
      demo: null,
    },
    {
      name: 'Force Translate Unlocker',
      description: 'Chrome extension ที่ลบข้อจำกัดการแปลซึ่งเว็บพยายามซ่อนไว้ รองรับ SPA / React / Next.js และทำงานในเครื่องทั้งหมด — ถ้ามีกำแพง ก็แค่รื้อมันออก',
      tech: ['JavaScript', 'Chrome Extension', 'Manifest V3'],
      icon: '🌐',
      github: 'https://github.com/I-am-Shadow01/force-translate-unlocker',
      demo: null,
    },
    {
      name: 'Discord Music Bot',
      description: 'ระบบเพลงบน Discord ที่ควบคุม queue, loop, shuffle และ volume ผ่าน discord.py + yt-dlp + FFmpeg — ให้เสียงเดินตามคำสั่งโดยไม่สร้างความวุ่นวายเกินจำเป็น',
      tech: ['Python', 'discord.py', 'yt-dlp', 'FFmpeg'],
      icon: '🎵',
      github: 'https://github.com/I-am-Shadow01/discord-music-bot',
      demo: null,
    },
    {
      name: 'Music App for Android',
      description: 'แอปเพลง Android แบบ standalone ที่ค้นหาและดึงเสียงจาก YouTube ภายในตัวเองด้วย NewPipeExtractor ใช้ Media3 และ Jetpack Compose พร้อมสายอัปเดตอัตโนมัติผ่าน GitHub Actions',
      tech: ['Kotlin', 'Jetpack Compose', 'Media3', 'NewPipeExtractor'],
      icon: '📱',
      github: 'https://github.com/I-am-Shadow01/music-app',
      demo: null,
    },
  ],

  // ─── Donate / Support ──────────────────────────
  donate: {
    heading: 'Fuel the Shadow',
    subheading: 'ถ้าเครื่องมือจากเงามีประโยชน์กับคุณ จะเติมพลังให้การทดลองครั้งต่อไปก็ยินดี ☕',

    promptpay: {
      enabled: true,
      id: '0889304036',
      accountName: 'CID KAGENOU',
      currency: 'THB',
      presetAmounts: [20, 50, 100, 200],
      defaultAmount: 50,
      allowCustomAmount: true,
    },

    trueMoneyWallet: {
      enabled: false,
      phoneNumber: '081-234-5678',
    },

    bankTransfer: {
      enabled: false,
      bankName: 'KASIKORNBANK (K+)',
      accountNumber: '221-8-12719-6',
      accountName: 'CID KAGENOU',
    },

    links: [],
  },

  // ─── Contact & Social ─────────────────────────
  contact: {
    heading: 'Enter the Shadow Network',
    subheading: 'มีโปรเจกต์ที่คู่ควรจะถูกสร้าง หรือปัญหาที่ระบบยังแก้ไม่ได้? ส่งสัญญาณมา แล้วค่อยดูว่าความมืดจะตอบกลับหรือไม่',
    links: [
      {
        label: 'Email',
        value: 'naphatsaranmek@gmail.com',
        icon: '✉',
        href: 'mailto:naphatsaranmek@gmail.com',
        copyable: true,
      },
      {
        label: 'GitHub',
        value: '@I-am-Shadow01',
        icon: 'GH',
        href: 'https://github.com/I-am-Shadow01',
        copyable: false,
      },
      {
        label: 'Discord',
        value: 'cid_kagenou_02',
        icon: 'DC',
        href: 'cid_kagenou_02',
        copyable: true,
      },
      {
        label: 'Twitter / X',
        value: '@PPLEThai',
        icon: '𝕏',
        href: 'https://x.com/PPLEThai',
        copyable: false,
      },
    ],
  },

};
