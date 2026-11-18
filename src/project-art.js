// Decorative visual studies. The compositions are illustrations, not screenshots or telemetry.
const wrap = (id, viewBox, body) =>
  `<div class="project-artwork project-artwork--${id}" aria-hidden="true">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet" focusable="false" fill="none">${body}</svg>
  </div>`;

const bars = (heights, x, center, step, width, color) =>
  heights.map((h, i) => `<rect class="pa-meter" style="--pa-delay:${-(i % 7) * .37}s;--pa-duration:${3.1 + (i % 4) * .55}s" x="${x + i * step}" y="${center - h / 2}" width="${width}" height="${h}" rx="${width / 2}" fill="${color}" opacity="${i % 4 === 0 ? '.55' : '.92'}"/>`).join('');

const audio = () => wrap('music-app', '0 0 640 570', `
  <defs>
    <linearGradient id="pa-a-metal" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#e3e8fa"/><stop offset=".22" stop-color="#7786a3"/><stop offset=".42" stop-color="#2b3855"/><stop offset=".7" stop-color="#7986bb"/><stop offset="1" stop-color="#222c46"/></linearGradient>
    <linearGradient id="pa-a-case" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#3c496d"/><stop offset=".45" stop-color="#111a2d"/><stop offset="1" stop-color="#212b47"/></linearGradient>
    <linearGradient id="pa-a-glass" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#263655"/><stop offset=".44" stop-color="#10192b"/><stop offset="1" stop-color="#0b1425"/></linearGradient>
    <linearGradient id="pa-a-accent" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e4e5ff"/><stop offset=".44" stop-color="#a5baff"/><stop offset="1" stop-color="#9079ff"/></linearGradient>
    <radialGradient id="pa-a-disc"><stop stop-color="#b3bdff"/><stop offset=".34" stop-color="#6763b8"/><stop offset=".73" stop-color="#28375e"/><stop offset="1" stop-color="#101b32"/></radialGradient>
    <radialGradient id="pa-a-light"><stop stop-color="#827dff" stop-opacity=".27"/><stop offset="1" stop-color="#827dff" stop-opacity="0"/></radialGradient>
    <pattern id="pa-a-grid" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M22 0H0V22" stroke="#8fa7e4" stroke-opacity=".11" stroke-width=".7"/></pattern>
  </defs>
  <ellipse cx="332" cy="296" rx="300" ry="245" fill="url(#pa-a-light)"/>
  <rect x="40" y="45" width="560" height="480" rx="12" fill="url(#pa-a-grid)" opacity=".56"/>
  <g stroke="#a8baf8" stroke-opacity=".16">
    <circle cx="320" cy="287" r="216"/><circle cx="320" cy="287" r="231" stroke-dasharray="2 9"/>
    <path d="M52 287H588M320 44V527" stroke-dasharray="3 7"/>
    <path d="M48 104V54H98M542 54H592V104M48 467V517H98M542 517H592V467" stroke-opacity=".5"/>
    <path d="M77 208h50l33 31M486 138l44-35h44M494 429l34 28h52"/>
  </g>
  <g class="pa-label" fill="#abb9dc" opacity=".83" font-size="11">
    <text x="79" y="198">01 / SIGNAL</text><text x="488" y="94">FORM / 01</text>
    <text x="480" y="473">PLAYBACK</text>
  </g>
  <!-- A tilted rear plate gives the object a physical thickness and a visible second plane. -->
  <g transform="translate(76 31) rotate(14 322 285)" opacity=".88">
    <rect x="184" y="83" width="266" height="418" rx="32" fill="#0b1224" stroke="#7180b6" stroke-opacity=".65"/>
    <rect x="192" y="91" width="250" height="402" rx="25" stroke="#a6b5ee" stroke-opacity=".23"/>
    <path d="M213 112H421M213 119H421M213 468H421" stroke="#8794ca" stroke-opacity=".28"/>
    <g fill="#bac9f1" opacity=".62"><circle cx="207" cy="107" r="2"/><circle cx="426" cy="107" r="2"/><circle cx="207" cy="477" r="2"/><circle cx="426" cy="477" r="2"/></g>
    <path d="M420 157v116M430 157v116" stroke="#7384bc" stroke-opacity=".35"/>
  </g>
  <g transform="rotate(-10 315 285)">
    <rect x="165" y="70" width="280" height="445" rx="36" fill="#081122" opacity=".6" transform="translate(12 13)"/>
    <rect x="166" y="69" width="277" height="443" rx="36" fill="url(#pa-a-metal)" stroke="#bac8eb" stroke-width=".6"/>
    <rect x="170" y="73" width="269" height="435" rx="32" fill="url(#pa-a-case)" stroke="#dbe3fb" stroke-opacity=".4"/>
    <rect x="177" y="80" width="255" height="421" rx="27" fill="url(#pa-a-glass)" stroke="#6f83ae" stroke-opacity=".7"/>
    <path d="M181 137H428M181 438H428" stroke="#8c9dce" stroke-opacity=".25"/>
    <rect x="274" y="90" width="62" height="5" rx="2.5" fill="#8291b7" opacity=".43"/>
    <g fill="#d7e0ff" class="pa-label" font-size="10"><text x="194" y="118">SOUND / OBJECT</text><text x="415" y="118" text-anchor="end" opacity=".55">VOL. 01</text></g>
    <circle cx="304" cy="236" r="87" fill="#081324" stroke="#7284bd" stroke-opacity=".55" stroke-width="1"/>
    <circle cx="304" cy="236" r="78" fill="url(#pa-a-disc)" stroke="#c3caff" stroke-opacity=".75"/>
    <g class="pa-rotor" stroke="#c1ccff" stroke-width=".8">
      <circle cx="304" cy="236" r="78" stroke-opacity="0"/>
      ${[20,29,38,47,56,65,72].map((r,i)=>`<circle cx="304" cy="236" r="${r}" stroke-opacity="${i%2 ? '.27' : '.45'}"/>`).join('')}
      <path d="M304 158A78 78 0 0 1 375 269" stroke="url(#pa-a-accent)" stroke-width="4" stroke-linecap="round"/>
      <path d="M304 174A62 62 0 0 0 249 265" stroke="#dce3ff" stroke-opacity=".65" stroke-width="3"/>
      <circle cx="304" cy="174" r="3" fill="#e8e8ff"/>
    </g>
    <circle cx="304" cy="236" r="29" fill="#1a2849" stroke="#b8c1fe" stroke-opacity=".9"/>
    <circle cx="304" cy="236" r="17" fill="url(#pa-a-accent)"/><circle cx="304" cy="236" r="5" fill="#222d4c"/>
    <rect x="195" y="341" width="219" height="50" rx="8" fill="#0c182b" stroke="#40547d"/>
    <path d="M204 366H405" stroke="#55658d" stroke-opacity=".36"/>
    ${bars([9,15,22,12,30,38,21,26,13,34,40,28,14,29,38,24,12,21,32,19,9,16,12,8,14],207,366,8,3,'url(#pa-a-accent)')}
    <rect x="197" y="403" width="216" height="3" rx="1.5" fill="#43506d"/><rect x="197" y="403" width="124" height="3" rx="1.5" fill="url(#pa-a-accent)"/><circle cx="321" cy="404.5" r="4" fill="#d6d9ff"/>
    <g stroke="#c2cdeb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M248 425l-9 6 9 6zm-12 0v12M360 425l9 6-9 6zm12 0v12"/></g>
    <circle cx="304" cy="431" r="22" fill="url(#pa-a-accent)"/><path d="M300 423l12 8-12 8z" fill="#171d39"/>
    <g stroke="#697da9" opacity=".55"><path d="M203 473H405"/><path d="M214 482H396"/></g>
    <path d="M166 170v38M443 157v22M443 188v46" stroke="#a6b2d8" stroke-width="2.5" stroke-linecap="round"/>
  </g>
  <g transform="translate(428 326)">
    <rect width="153" height="92" rx="9" fill="#0a1529" fill-opacity=".94" stroke="#7d91c7" stroke-opacity=".75"/>
    <path d="M12 23H141" stroke="#697aa4" stroke-opacity=".45"/>
    <text class="pa-label" x="12" y="15" fill="#b9c7ea" font-size="9">SPECTRAL STUDY</text>
    <path d="M12 74H141M12 48H141" stroke="#7086bc" stroke-opacity=".22" stroke-dasharray="3 3"/>
    ${bars([10,18,24,16,35,43,26,29,44,34,20,12,17,8],13,58,9,4,'#a6b8ff')}
  </g>
`);

const network = () => wrap('native-c-bot', '0 0 440 270', `
  <defs>
    <linearGradient id="pa-n-shell" x2="1" y2="1"><stop stop-color="#8ea8ca"/><stop offset=".45" stop-color="#35496c"/><stop offset="1" stop-color="#182a47"/></linearGradient>
    <linearGradient id="pa-n-chip" x2="1" y2="1"><stop stop-color="#293f63"/><stop offset="1" stop-color="#101e35"/></linearGradient>
    <radialGradient id="pa-n-wash"><stop stop-color="#72a9f0" stop-opacity=".21"/><stop offset="1" stop-color="#72a9f0" stop-opacity="0"/></radialGradient>
  </defs>
  <ellipse cx="220" cy="135" rx="216" ry="120" fill="url(#pa-n-wash)"/>
  <g stroke="#91b8ee" stroke-opacity=".12" stroke-width=".8">
    ${Array.from({length:9},(_,i)=>`<path d="M32 ${48+i*23}H408"/>`).join('')}
    ${Array.from({length:13},(_,i)=>`<path d="M${40+i*30} 38V241"/>`).join('')}
    <circle cx="220" cy="138" r="84"/><circle cx="220" cy="138" r="104" stroke-dasharray="3 6"/>
  </g>
  <g stroke="#7faddf" stroke-opacity=".66" stroke-width="1.2" stroke-linejoin="round">
    <path d="M115 83H137L160 105H178M115 193H137L160 171H178M262 105H280L303 83H325M262 171H280L303 193H325"/>
    <path d="M138 83v-18h42M138 193v20h42M302 83v-18h-42M302 193v20h-42" stroke-opacity=".28"/>
    <path d="M147 138H178M262 138H293" stroke-dasharray="3 4"/>
  </g>
  <g class="pa-label" fill="#d4e4fa" font-size="9" text-anchor="middle">
    <g transform="translate(35 64)"><rect width="80" height="39" rx="4" fill="#12243b" stroke="#648bb7"/><text x="40" y="17">DISCORD</text><text x="40" y="29" fill="#819ec5" font-size="7">GATEWAY</text></g>
    <g transform="translate(35 174)"><rect width="80" height="39" rx="4" fill="#12243b" stroke="#648bb7"/><text x="40" y="17">CONTEXT</text><text x="40" y="29" fill="#819ec5" font-size="7">CHANNEL</text></g>
    <g transform="translate(325 64)"><rect width="80" height="39" rx="4" fill="#12243b" stroke="#648bb7"/><text x="40" y="23">GEMINI</text></g>
    <g transform="translate(325 174)"><rect width="80" height="39" rx="4" fill="#12243b" stroke="#648bb7"/><text x="40" y="23">WINHTTP</text></g>
  </g>
  <g stroke="#a3c3ed" stroke-width="1.3" stroke-opacity=".7" stroke-linecap="round">
    ${Array.from({length:7},(_,i)=>`<path d="M${189+i*10} 91v-8M${189+i*10} 184v8M174 ${107+i*10}h-8M266 ${107+i*10}h8"/>`).join('')}
  </g>
  <rect x="178" y="93" width="84" height="90" rx="8" fill="url(#pa-n-shell)"/>
  <rect x="182" y="97" width="76" height="82" rx="5" fill="url(#pa-n-chip)" stroke="#a8c5ec" stroke-opacity=".8"/>
  <rect x="189" y="104" width="62" height="68" rx="3" stroke="#91b8e8" stroke-opacity=".32"/>
  <text x="220" y="145" text-anchor="middle" fill="#d7e7ff" font-size="36" font-weight="700" font-family="system-ui,sans-serif">C</text>
  <text x="220" y="160" text-anchor="middle" fill="#9fbbdf" font-size="8" class="pa-label">NATIVE</text>
  ${[[138,83],[160,171],[303,83],[280,171],[220,83],[220,192]].map(([x,y],i)=>`<circle class="pa-node" style="--pa-delay:${-i*.6}s" cx="${x}" cy="${y}" r="2.8" fill="#b7deff"/>`).join('')}
  <text class="pa-label" x="405" y="244" text-anchor="end" fill="#a6c1e4" font-size="9">ASYNC / DATA PATHS</text>
`);

const translation = () => wrap('translate-unlocker', '0 0 440 270', `
  <defs>
    <linearGradient id="pa-t-window" x2="1" y2="1"><stop stop-color="#1f3a50"/><stop offset="1" stop-color="#102435"/></linearGradient>
    <linearGradient id="pa-t-sheet" x2="1" y2="1"><stop stop-color="#405d77"/><stop offset="1" stop-color="#1b354b"/></linearGradient>
    <linearGradient id="pa-t-active" x2="1" y2="1"><stop stop-color="#d2eeff"/><stop offset="1" stop-color="#7eabd8"/></linearGradient>
  </defs>
  <g stroke="#83b5d3" stroke-opacity=".20">
    <path d="M38 68H402M38 219H402M59 48V239M381 48V239" stroke-dasharray="2 5"/>
    <path d="M37 54v-9h9M394 45h9v9M37 227v12h9M394 239h9v-12" stroke-opacity=".7"/>
  </g>
  <g transform="translate(43 68) rotate(-7 106 70)">
    <rect x="4" y="8" width="213" height="146" rx="8" fill="#071a29" opacity=".6"/>
    <rect width="213" height="146" rx="8" fill="url(#pa-t-window)" stroke="#668fa9"/>
    <path d="M0 23H213" stroke="#658ca7" stroke-opacity=".7"/>
    <circle cx="12" cy="12" r="2.4" fill="#9dc3d9"/><circle cx="22" cy="12" r="2.4" fill="#5d8dad"/><circle cx="32" cy="12" r="2.4" fill="#365976"/>
    <rect x="54" y="7" width="147" height="10" rx="3" fill="#101f2d" stroke="#476a80" stroke-width=".5"/>
    <text class="pa-label" x="12" y="40" font-size="8" fill="#91b4c9">DOCUMENT / DOM</text>
    <path d="M12 52h175M12 60h139M12 68h153M12 119h125M12 127h88M12 135h147" stroke="#91b4c9" stroke-opacity=".39" stroke-width="2" stroke-linecap="round"/>
    <rect x="12" y="79" width="184" height="26" rx="3" fill="#102735" stroke="#d9b6a3" stroke-opacity=".68"/>
    <text x="20" y="95" class="pa-label" fill="#e3bfab" font-size="10">translate="no"</text>
    <path d="M177 86l10 10m0-10-10 10" stroke="#e3bfab" stroke-width="1.2"/>
  </g>
  <g transform="translate(185 86) rotate(4 95 75)">
    <rect x="5" y="7" width="206" height="143" rx="8" fill="#091d2e" opacity=".7"/>
    <rect width="206" height="143" rx="8" fill="url(#pa-t-sheet)" stroke="#a3d1eb"/>
    <path d="M0 27H206" stroke="#a7c7de" stroke-opacity=".64"/>
    <text class="pa-label" x="13" y="17" font-size="8" fill="#d0e7fa">ATTRIBUTES / UNLOCK</text>
    <rect x="13" y="39" width="180" height="54" rx="4" fill="#172c42" stroke="#78a4c5"/>
    <text x="33" y="76" fill="#bdddf4" font-size="30" font-family="system-ui,sans-serif">あ</text>
    <g class="pa-translate-arrow"><path d="M83 65h34m-8-8 8 8-8 8" stroke="#d4eeff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></g>
    <text x="146" y="76" fill="#e4f3ff" font-size="35" font-weight="600" font-family="system-ui,sans-serif">A</text>
    <rect x="13" y="106" width="180" height="24" rx="4" fill="#abcfe7" fill-opacity=".13" stroke="#aed8ef" stroke-opacity=".6"/>
    <path d="M22 117l4 4 7-8" stroke="#bde9f8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    <text class="pa-label" x="41" y="121" font-size="9" fill="#d7ecf8">TRANSLATION ENABLED</text>
  </g>
  <text class="pa-label" x="402" y="250" text-anchor="end" fill="#a8cada" font-size="9">DOCUMENT / ATTRIBUTE LAYERS</text>
`);

const musicBot = () => wrap('music-bot', '0 0 440 270', `
  <defs>
    <linearGradient id="pa-m-console" x2="1" y2="1"><stop stop-color="#51456c"/><stop offset=".5" stop-color="#28253e"/><stop offset="1" stop-color="#19182d"/></linearGradient>
    <linearGradient id="pa-m-accent" x2="1" y2="1"><stop stop-color="#ebdfff"/><stop offset="1" stop-color="#ac94e8"/></linearGradient>
  </defs>
  <g stroke="#b39cdb" stroke-opacity=".16"><circle cx="108" cy="143" r="96"/><circle cx="108" cy="143" r="108" stroke-dasharray="2 5"/><path d="M28 73H409M28 214H409M108 35V237" stroke-dasharray="3 6"/></g>
  <g transform="translate(28 63) rotate(-8 188 85)">
    <rect x="7" y="8" width="376" height="160" rx="10" fill="#101024" opacity=".7"/>
    <rect width="376" height="160" rx="10" fill="url(#pa-m-console)" stroke="#a894d5" stroke-opacity=".83"/>
    <rect x="6" y="6" width="364" height="148" rx="5" stroke="#d4c2f2" stroke-opacity=".17"/>
    <path d="M15 28H361M198 39V143" stroke="#af9dcc" stroke-opacity=".31"/>
    <g class="pa-label" font-size="9" fill="#d9c9f5"><text x="15" y="19">PLAYBACK / CONTROL</text><text x="361" y="19" text-anchor="end">QUEUE</text></g>
    <rect x="15" y="40" width="169" height="49" rx="5" fill="#16172b" stroke="#75669a"/>
    <path d="M23 64H176" stroke="#8774b4" stroke-opacity=".3"/>
    ${bars([10,21,13,22,35,30,19,36,27,15,24,35,18,11,26,14,18],24,64,9,3,'#d1b9fa')}
    <path d="M17 101H184" stroke="#8c79af" stroke-width="3" stroke-linecap="round"/>
    <path d="M17 101H100" stroke="#d6c3fa" stroke-width="3" stroke-linecap="round"/><circle cx="100" cy="101" r="4" fill="#e9dcff"/>
    <circle cx="99" cy="127" r="14" fill="url(#pa-m-accent)"/><path d="M96 121l9 6-9 6z" fill="#28253f"/>
    <g stroke="#c3b6e1" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><path d="M65 122l-7 5 7 5zm-10 0v10M135 122l7 5-7 5zm10 0v10"/><path d="M169 124h8l3 3-3 3h-8M175 120v14"/></g>
    ${[0,1,2].map((i)=>`<g transform="translate(212 ${40+i*36})"><rect width="148" height="31" rx="4" fill="${i===0?'#a78bdc':'#15162b'}" fill-opacity="${i===0?'.24':'.78'}" stroke="#ad96d8" stroke-opacity="${i===0?'.8':'.25'}"/><rect x="6" y="6" width="19" height="19" rx="3" fill="#ae96df" fill-opacity=".29"/><text x="15.5" y="19" font-size="8" text-anchor="middle" fill="#e6d8fb" class="pa-label">0${i+1}</text><path d="M33 12h76M33 20h${i===1?43:60}" stroke="#bcaadd" stroke-width="2" stroke-opacity=".5" stroke-linecap="round"/><circle cx="136" cy="15.5" r="2.5" fill="#c9b6ee" opacity="${i===0?1:.35}"/></g>`).join('')}
  </g>
  <g transform="translate(287 201)">
    <rect width="116" height="30" rx="5" fill="#17182e" stroke="#a792ce"/>
    <path d="M14 15h13m-3-3 3 3-3 3M39 12h8l4 6h8m-3-3 3 3-3 3M73 10h14v10H73m3-3-3 3 3 3" stroke="#d5c5ed" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="102" cy="15" r="3" class="pa-node" fill="#dbc8fa"/>
  </g>
  <text class="pa-label" x="403" y="250" fill="#bfaedb" font-size="9" text-anchor="end">QUEUE / PLAYBACK / CONTROL</text>
`);

export function projectArtwork(p) {
  switch (p?.id) {
    case 'music-app': return audio();
    case 'native-c-bot': return network();
    case 'translate-unlocker': return translation();
    case 'music-bot': return musicBot();
    default: return '';
  }
}
