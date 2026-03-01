/**
 * src/i18n.js
 * Translation strings — English & Thai
 */

export const TRANSLATIONS = {
  en: {
    // Nav
    nav_about:    'About',
    nav_skills:   'Skills',
    nav_projects: 'Projects',
    nav_contact:  'Contact',

    // Hero
    available:    'Available for work',
    scroll:       'Scroll',
    cta_projects: 'View Projects',
    cta_contact:  'Get in Touch',

    // Section labels
    label_about:    'About',
    label_skills:   'Skills',
    label_projects: 'Projects',
    label_contact:  'Contact',

    // Section titles
    title_about:    'Who I Am',
    title_skills:   'Tech Stack',
    title_projects: "Things I've Built",

    // Projects
    github: 'GitHub',
    demo:   'Live Demo',

    // Contact
    copied: 'Copied!',

    // Footer
    back_top: 'Back to top',

    // Settings
    settings_title:       'Settings',
    settings_theme:       'Theme',
    settings_theme_dark:  'Dark',
    settings_theme_light: 'Light',
    settings_theme_sys:   'System',
    settings_lang:        'Language',
    settings_lang_en:     'English',
    settings_lang_th:     'ภาษาไทย',
    settings_lang_sys:    'System',
    settings_accent:      'Accent Color',
    settings_fontsize:    'Font Size',
    settings_fs_sm:       'S',
    settings_fs_md:       'M',
    settings_fs_lg:       'L',
    settings_anim:        'Animations',
    settings_cursor:      'Custom Cursor',
    settings_bgfx:        'Background FX',
    settings_on:          'On',
    settings_off:         'Off',
    settings_reset:       'Reset to Default',
    settings_close:       'Close settings',
  },
  th: {
    // Nav
    nav_about:    'เกี่ยวกับ',
    nav_skills:   'ทักษะ',
    nav_projects: 'โปรเจกต์',
    nav_contact:  'ติดต่อ',

    // Hero
    available:    'พร้อมรับงาน',
    scroll:       'เลื่อนลง',
    cta_projects: 'ดูโปรเจกต์',
    cta_contact:  'ติดต่อฉัน',

    // Section labels
    label_about:    'เกี่ยวกับ',
    label_skills:   'ทักษะ',
    label_projects: 'โปรเจกต์',
    label_contact:  'ติดต่อ',

    // Section titles
    title_about:    'ฉันคือใคร',
    title_skills:   'เทคโนโลยีที่ใช้',
    title_projects: 'สิ่งที่ฉันสร้าง',

    // Projects
    github: 'GitHub',
    demo:   'ดูตัวอย่าง',

    // Contact
    copied: 'คัดลอกแล้ว!',

    // Footer
    back_top: 'กลับด้านบน',

    // Settings
    settings_title:       'การตั้งค่า',
    settings_theme:       'ธีม',
    settings_theme_dark:  'มืด',
    settings_theme_light: 'สว่าง',
    settings_theme_sys:   'ระบบ',
    settings_lang:        'ภาษา',
    settings_lang_en:     'English',
    settings_lang_th:     'ภาษาไทย',
    settings_lang_sys:    'ตามระบบ',
    settings_accent:      'สีหลัก',
    settings_fontsize:    'ขนาดตัวอักษร',
    settings_fs_sm:       'เล็ก',
    settings_fs_md:       'กลาง',
    settings_fs_lg:       'ใหญ่',
    settings_anim:        'แอนิเมชัน',
    settings_cursor:      'เคอร์เซอร์',
    settings_bgfx:        'Background FX',
    settings_on:          'เปิด',
    settings_off:         'ปิด',
    settings_reset:       'รีเซ็ตค่าเริ่มต้น',
    settings_close:       'ปิดการตั้งค่า',
  },
};

/**
 * Get active locale from settings or system
 */
export function getLocale(settings) {
  if (settings.lang === 'en') return 'en';
  if (settings.lang === 'th') return 'th';
  // system
  const systemLang = navigator.language || 'en';
  return systemLang.startsWith('th') ? 'th' : 'en';
}

/**
 * Create a bound translate function for current locale
 * usage: const t = createT(settings)
 *        t('nav_about') → 'About' or 'เกี่ยวกับ'
 */
export function createT(settings) {
  const locale = getLocale(settings);
  const dict   = TRANSLATIONS[locale] || TRANSLATIONS.en;
  return (key) => dict[key] ?? TRANSLATIONS.en[key] ?? key;
}
