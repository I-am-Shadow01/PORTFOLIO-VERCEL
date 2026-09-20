/**
 * ╔══════════════════════════════════════════════╗
 * ║          PORTFOLIO CONFIG                    ║
 * ║  แก้ข้อมูลทั้งหมดได้ที่นี่ที่เดียว           ║
 * ╚══════════════════════════════════════════════╝
 */

export const CONFIG = {

  // ─── General ──────────────────────────────────
  meta: {
    firstName: 'CID',
    lastName: 'KAGENOU',
    fullName: 'CID KAGENOU',
    roles: [
      'Student Developer',
      'AI / LLM Enthusiast',
      'Physics Enthusiast',
    ],
    greeting: 'Hello, World.',
    location: 'Trat, Thailand 🇹🇭',
    available: true,
  },

  // ─── About / Bio ──────────────────────────────
  about: {
    bio: [
      `นักเรียนและ developer ที่ชอบสร้างเครื่องมือจริง เน้น AI/LLM, automation, performance และการแก้ปัญหาให้ตรงจุด`,
      `สนใจฟิสิกส์ โดยเฉพาะ high-energy physics และชอบทดลองเทคโนโลยีตั้งแต่ native C, Python bots, browser extensions ไปจนถึง Android/Kotlin`,
    ],
    tags: ['AI / LLM', 'Automation', 'Physics', 'Discord Bots', 'Android', 'Open Source'],
    stats: [
      { number: '6',  label: 'Public Repos' },
      { number: '4',  label: 'Featured Projects' },
      { number: '4',  label: 'Core Languages' },
      { number: '∞',  label: 'Experiments' },
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
  // icon: emoji หรือ text สั้นๆ
  // github: URL หรือ null
  // demo: URL หรือ null
  projects: [
    {
      name: 'Discord Bot in C + Gemini AI',
      description: 'บอท Discord แบบ native C สำหรับ Windows ใช้ WinHTTP เชื่อม Gemini AI, รองรับ context ต่อ channel และทำงานแบบ multi-threaded',
      tech: ['C', 'WinHTTP', 'Gemini API', 'Discord API'],
      icon: '🤖',
      github: 'https://github.com/I-am-Shadow01/discord-bot-c',
      demo: null,
    },
    {
      name: 'Force Translate Unlocker',
      description: 'Chrome extension ที่ลบตัวบล็อกการแปลจากเว็บไซต์อัตโนมัติ รองรับ SPA / React / Next.js และทำงานทั้งหมดในเครื่อง',
      tech: ['JavaScript', 'Chrome Extension', 'Manifest V3'],
      icon: '🌐',
      github: 'https://github.com/I-am-Shadow01/force-translate-unlocker',
      demo: null,
    },
    {
      name: 'Discord Music Bot',
      description: 'บอทเพลง Discord ที่ใช้ discord.py + yt-dlp รองรับ queue, loop, shuffle, volume และ music control panel',
      tech: ['Python', 'discord.py', 'yt-dlp', 'FFmpeg'],
      icon: '🎵',
      github: 'https://github.com/I-am-Shadow01/discord-music-bot',
      demo: null,
    },
    {
      name: 'Music App for Android',
      description: 'แอปเล่นเพลง Android แบบ standalone ค้นหาและดึงเสียงจาก YouTube ในแอปด้วย NewPipeExtractor พร้อม Media3 และระบบอัปเดตผ่าน GitHub Actions',
      tech: ['Kotlin', 'Jetpack Compose', 'Media3', 'NewPipeExtractor'],
      icon: '📱',
      github: 'https://github.com/I-am-Shadow01/music-app',
      demo: null,
    },
  ],

  // ─── Donate / Support ──────────────────────────
  // แก้ค่าทั้งหมดในนี้ที่เดียว — ห้ามแก้ใน sections/donate.js
  donate: {
    heading: 'Buy Me a Coffee',
    subheading: 'ถ้าโปรเจกต์หรือ tool ที่ผมทำมีประโยชน์ เลี้ยงกาแฟกันได้ครับ ☕',

    // PromptPay QR — สร้าง QR ฝั่ง client ทั้งหมด
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

    // ยังไม่มีช่องทางอื่นที่ยืนยันแล้ว จึงไม่แสดง placeholder
    links: [],
  },

  // ─── Contact & Social ─────────────────────────
  contact: {
    heading: "Let's Work Together",
    subheading: 'มีโปรเจกต์น่าสนใจ อยากร่วมงาน หรือแค่อยากทักทาย? ยินดีเสมอ',
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
