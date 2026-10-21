const sharp = require('sharp');
const path = require('path');

const PUBLIC_ANIMALS_DIR = path.join(__dirname, '..', 'public', 'animals');

const elephantSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.15" />
    </filter>
  </defs>
  <g filter="url(#shadow)">
    <!-- Back legs in running pose -->
    <path d="M220 340 Q210 440 190 480 Q190 510 230 510 Q260 510 260 480 Q270 430 280 370 Z" fill="#6B7280" stroke="#1F2937" stroke-width="14" stroke-linejoin="round" />
    <path d="M370 340 Q410 430 460 470 Q490 490 500 460 Q505 430 470 400 Q430 360 400 330 Z" fill="#6B7280" stroke="#1F2937" stroke-width="14" stroke-linejoin="round" />

    <!-- Elephant Body -->
    <ellipse cx="320" cy="330" rx="140" ry="110" fill="#9CA3AF" stroke="#1F2937" stroke-width="14" />
    <!-- Light Belly -->
    <path d="M240 370 Q320 420 400 370 Q370 330 270 330 Z" fill="#D1D5DB" />

    <!-- Little Tail -->
    <path d="M180 310 Q140 300 130 330 Q125 350 140 350 Q160 350 185 335" fill="none" stroke="#1F2937" stroke-width="12" stroke-linecap="round" />
    <path d="M125 335 Q115 350 120 365 Q135 365 140 345 Z" fill="#374151" />

    <!-- Front Running Legs -->
    <path d="M260 370 Q240 450 210 490 Q205 520 245 525 Q275 525 285 490 Q305 440 315 370 Z" fill="#9CA3AF" stroke="#1F2937" stroke-width="14" stroke-linejoin="round" />
    <!-- Toenails -->
    <circle cx="225" cy="515" r="7" fill="#F3F4F6" stroke="#1F2937" stroke-width="4" />
    <circle cx="245" cy="518" r="7" fill="#F3F4F6" stroke="#1F2937" stroke-width="4" />
    <circle cx="265" cy="515" r="7" fill="#F3F4F6" stroke="#1F2937" stroke-width="4" />

    <path d="M360 370 Q390 440 420 480 Q440 505 470 485 Q485 460 460 430 Q430 390 395 350 Z" fill="#9CA3AF" stroke="#1F2937" stroke-width="14" stroke-linejoin="round" />
    <circle cx="435" cy="485" r="7" fill="#F3F4F6" stroke="#1F2937" stroke-width="4" />
    <circle cx="455" cy="480" r="7" fill="#F3F4F6" stroke="#1F2937" stroke-width="4" />

    <!-- Big Head -->
    <circle cx="410" cy="240" r="85" fill="#9CA3AF" stroke="#1F2937" stroke-width="14" />

    <!-- Cheerful Raised Trunk -->
    <path d="M460 260 Q520 280 540 230 Q555 190 520 170 Q495 160 490 190 Q485 210 465 220" fill="none" stroke="#9CA3AF" stroke-width="42" stroke-linecap="round" />
    <path d="M460 260 Q520 280 540 230 Q555 190 520 170 Q495 160 490 190 Q485 210 465 220" fill="none" stroke="#1F2937" stroke-width="14" stroke-linecap="round" />

    <!-- Ivory Tusk -->
    <path d="M450 285 Q510 300 525 260 Q495 265 450 270 Z" fill="#FFFBEB" stroke="#1F2937" stroke-width="8" />

    <!-- Happy Eye -->
    <ellipse cx="440" cy="215" rx="14" ry="18" fill="#1F2937" />
    <circle cx="444" cy="209" r="6" fill="#FFFFFF" />
    <circle cx="436" cy="222" r="3" fill="#FFFFFF" />
    <!-- Eyebrow -->
    <path d="M425 190 Q445 180 460 192" fill="none" stroke="#1F2937" stroke-width="8" stroke-linecap="round" />

    <!-- Cheerful Mouth -->
    <path d="M430 280 Q450 310 470 290" fill="#EF4444" stroke="#1F2937" stroke-width="7" />

    <!-- Big Floppy Ear -->
    <path d="M380 170 Q300 160 290 260 Q285 340 370 330 Q400 320 405 270 Q410 210 380 170 Z" fill="#9CA3AF" stroke="#1F2937" stroke-width="14" />
    <!-- Inner Ear Pink -->
    <path d="M370 195 Q320 190 315 260 Q310 310 365 305 Q385 300 390 265 Z" fill="#FBCFE8" />

    <!-- Speed Dust Lines -->
    <path d="M140 480 Q170 470 190 485" fill="none" stroke="#9CA3AF" stroke-width="8" stroke-linecap="round" />
    <path d="M110 500 Q150 495 170 510" fill="none" stroke="#9CA3AF" stroke-width="8" stroke-linecap="round" />
  </g>
</svg>
`;

const ostrichSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.15" />
    </filter>
  </defs>
  <g filter="url(#shadow)">
    <!-- Back Running Leg -->
    <path d="M260 360 L230 450 L170 490 L130 520" fill="none" stroke="#1F2937" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M260 360 L230 450 L170 490 L130 520" fill="none" stroke="#FDBA74" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
    <!-- Foot claw -->
    <path d="M130 520 L95 530 M130 520 L115 540" stroke="#1F2937" stroke-width="12" stroke-linecap="round" />

    <!-- Fluffy Feathered Body -->
    <ellipse cx="280" cy="340" rx="95" ry="75" fill="#1F2937" stroke="#111827" stroke-width="14" />
    <!-- White wing plume -->
    <path d="M220 330 Q280 300 340 330 Q360 370 300 380 Q240 385 220 330 Z" fill="#F9FAFB" stroke="#1F2937" stroke-width="10" />

    <!-- Tail plumes -->
    <path d="M190 320 Q140 300 130 330 Q170 360 195 345" fill="#F9FAFB" stroke="#1F2937" stroke-width="8" />
    <path d="M195 335 Q145 330 140 360 Q180 375 205 355" fill="#F9FAFB" stroke="#1F2937" stroke-width="8" />

    <!-- Front Running Leg -->
    <path d="M310 370 L340 450 L420 480 L460 520" fill="none" stroke="#1F2937" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M310 370 L340 450 L420 480 L460 520" fill="none" stroke="#FB923C" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M460 520 L495 525 M460 520 L480 540" stroke="#1F2937" stroke-width="12" stroke-linecap="round" />

    <!-- Long S-Curved Neck -->
    <path d="M340 320 Q390 270 395 190 Q400 130 435 110" fill="none" stroke="#1F2937" stroke-width="32" stroke-linecap="round" />
    <path d="M340 320 Q390 270 395 190 Q400 130 435 110" fill="none" stroke="#FED7AA" stroke-width="22" stroke-linecap="round" />

    <!-- Head -->
    <ellipse cx="450" cy="115" rx="36" ry="26" fill="#FED7AA" stroke="#1F2937" stroke-width="10" />

    <!-- Feathery head tuft -->
    <path d="M425 95 Q420 70 435 75 Q440 90 435 98" fill="#F472B6" stroke="#1F2937" stroke-width="6" />
    <path d="M435 93 Q440 65 455 70 Q450 88 445 96" fill="#F472B6" stroke="#1F2937" stroke-width="6" />

    <!-- Beak -->
    <polygon points="480,105 545,120 480,135" fill="#FBBF24" stroke="#1F2937" stroke-width="9" stroke-linejoin="round" />

    <!-- Big cute eye with fluttery lashes -->
    <circle cx="445" cy="110" r="12" fill="#1F2937" />
    <circle cx="448" cy="106" r="4.5" fill="#FFFFFF" />
    <path d="M435 96 L428 88 M445 94 L443 85 M455 96 L458 87" stroke="#1F2937" stroke-width="4.5" stroke-linecap="round" />

    <!-- Speed Dust -->
    <path d="M160 480 Q190 470 210 490" fill="none" stroke="#CBD5E1" stroke-width="8" stroke-linecap="round" />
  </g>
</svg>
`;

async function main() {
  await sharp(Buffer.from(elephantSvg))
    .png()
    .toFile(path.join(PUBLIC_ANIMALS_DIR, 'elephant.png'));
  console.log('Saved elephant.png');

  await sharp(Buffer.from(ostrichSvg))
    .png()
    .toFile(path.join(PUBLIC_ANIMALS_DIR, 'ostrich.png'));
  console.log('Saved ostrich.png');
}

main().catch(console.error);
