/**
 * ╔══════════════════════════════════════════════╗
 * ║          PORTFOLIO CONFIG                    ║
 * ║  แก้ข้อมูลทั้งหมดได้ที่นี่ที่เดียว           ║
 * ╚══════════════════════════════════════════════╝
 */

export const CONFIG = {

  // ─── General ──────────────────────────────────
  meta: {
    firstName: 'YOUR',       // ชื่อ (ใช้ใน hero)
    lastName: 'NAME',        // นามสกุล
    fullName: 'Your Name',   // ชื่อเต็ม (ใช้ใน nav, footer)
    roles: [                 // หน้าที่ / ตำแหน่ง (typing animation)
      'Full-Stack Developer',
      'DevOps Engineer',
      'Open Source Contributor',
    ],
    greeting: 'Hello, World.',
    location: 'Bangkok, Thailand 🇹🇭',
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
      { number: '3+',  label: 'ปีที่ทำงาน' },
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
      name: 'Discord Media Bot',
      description: 'บอท Discord สำหรับดาวน์โหลด media จาก YouTube และ platform อื่นๆ พร้อม persistent embed interface, quality selection, และ file management',
      tech: ['Python', 'Discord.py', 'yt-dlp', 'FFmpeg'],
      icon: '🤖',
      github: 'https://github.com/yourusername/project',
      demo: null,
    },
    {
      name: 'System Monitor Overlay',
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
        value: 'you@example.com',
        icon: '✉',
        href: 'mailto:you@example.com',
        copyable: true,        // true = คลิกเพื่อ copy email
      },
      {
        label: 'GitHub',
        value: '@yourusername',
        icon: 'GH',
        href: 'https://github.com/yourusername',
        copyable: false,
      },
      {
        label: 'LinkedIn',
        value: 'Your Name',
        icon: 'LI',
        href: 'https://linkedin.com/in/yourusername',
        copyable: false,
      },
      {
        label: 'Twitter / X',
        value: '@yourusername',
        icon: '𝕏',
        href: 'https://x.com/yourusername',
        copyable: false,
      },
    ],
  },

};
