/**
 * ╔══════════════════════════════════════════════╗
 * ║          PORTFOLIO CONFIG                    ║
 * ║  แก้ข้อมูลทั้งหมดได้ที่นี่ที่เดียว           ║
 * ╚══════════════════════════════════════════════╝
 */

export const CONFIG = {

  // ─── General ──────────────────────────────────
  meta: {
    firstName: 'Cid',       // ชื่อ (ใช้ใน hero)
    lastName: 'Kagenou',        // นามสกุล
    fullName: 'Cid kagenou',   // ชื่อเต็ม (ใช้ใน nav, footer)
    roles: [                 // หน้าที่ / ตำแหน่ง (typing animation)
      'Full-Stack Developer',
      'DevOps Engineer',
      'Open Source Contributor',
    ],
    greeting: 'Hello, World.',
    location: 'Trat, Thailand 🇹🇭',
    available: true,         // true = แสดง "Available for work"
  },

  // ─── About / Bio ──────────────────────────────
  about: {
    bio: [
      `Developer ที่หลงใหลใน automation, system design, และการสร้างเครื่องมือที่ทำให้ชีวิตง่ายขึ้น`,
      `ชอบแก้ปัญหาที่ซับซ้อนด้วย solution ที่สะอาดและ maintain ได้ง่าย — ทั้ง backend, DevOps, และ tooling`,
    ],
    tags: ['Automation', 'Linux', 'Discord Bots', 'System Design', 'Open Source'],
    stats: [
      { number: '2+',  label: 'ปีที่ทำงาน' },
      { number: '20+', label: 'โปรเจกต์' },
      { number: '5+',  label: 'Tech Stacks' },
      { number: '∞',   label: 'Coffees ☕' },
    ],
  },

  // ─── Skills ───────────────────────────────────
  skills: [
    {
      category: 'Languages',
      tags: ['Python', 'JavaScript', 'TypeScript', 'Bash', 'SQL'],
    },
    {
      category: 'Backend & DevOps',
      tags: ['Node.js', 'FastAPI', 'Docker', 'Linux', 'Nginx', 'Supabase'],
    },
    {
      category: 'Frontend',
      tags: ['HTML', 'CSS', 'Vanilla JS', 'React', 'Tailwind CSS'],
    },
    {
      category: 'Tools & Ecosystem',
      tags: ['Git', 'VS Code', 'Termux', 'FFmpeg', 'yt-dlp', 'Discord.js'],
    },
  ],

  // ─── Projects ─────────────────────────────────
  // icon: emoji หรือ text สั้นๆ
  // github: URL หรือ null
  // demo: URL หรือ null
  projects: [
    {
      name: 'Discord Media Bot(ยังไม่ลงgithub)',
      description: 'บอท Discord สำหรับดาวน์โหลด media จาก YouTube และ platform อื่นๆ พร้อม persistent embed interface, quality selection, และ file management',
      tech: ['Python', 'Discord.py', 'yt-dlp', 'FFmpeg'],
      icon: '🤖',
      github: 'https://github.com/yourusername/project',
      demo: null,
    },
    {
      name: 'System Monitor Overlay(ยังไม่ลงgithub)',
      description: 'Real-time overlay สำหรับ Android/Termux แสดงข้อมูล CPU, GPU, RAM และ temperature แบบ live บนหน้าจอ',
      tech: ['Python', 'Termux', 'Bash', 'WebSocket'],
      icon: '📊',
      github: 'https://github.com/yourusername/project',
      demo: null,
    },
    {
      name: 'Project Three',
      description: 'Short description ของโปรเจกต์. เพิ่ม project จริงได้ใน config.js',
      tech: ['React', 'Supabase', 'TypeScript'],
      icon: '🚀',
      github: 'https://github.com/yourusername/project',
      demo: 'https://your-demo.vercel.app',
    },
  ],

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
        copyable: true,        // true = คลิกเพื่อ copy email
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
