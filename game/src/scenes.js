// scenes.js — the game's original art. Every scene is drawn in code on a 600x520
// canvas; the right panel re-draws the same scene with the active differences
// applied, so the two pictures are near-identical by construction.
// Each difference has a click target (x, y, r) in scene coordinates.
export const SCENE_W = 600;
export const SCENE_H = 520;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

function gull(ctx, x, y, s, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(x - 9 * s, y);
  ctx.quadraticCurveTo(x - 4 * s, y - 6 * s, x, y);
  ctx.quadraticCurveTo(x + 4 * s, y - 6 * s, x + 9 * s, y);
  ctx.stroke();
}

function star(ctx, x, y, r, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const rad = i % 2 === 0 ? r : r * 0.45;
    ctx[i === 0 ? 'moveTo' : 'lineTo'](x + Math.cos(angle) * rad, y + Math.sin(angle) * rad);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function paperLantern(ctx, x, y, r, color, lit) {
  ctx.save();
  ctx.fillStyle = color;
  ellipse(ctx, x, y, r, r * 1.15);
  ctx.fill();
  ctx.strokeStyle = 'rgba(60,20,20,0.55)';
  ctx.lineWidth = 1.5;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(x - r * 0.9, y + i * r * 0.42);
    ctx.quadraticCurveTo(x, y + i * r * 0.42 + r * 0.18, x + r * 0.9, y + i * r * 0.42);
    ctx.stroke();
  }
  ctx.fillStyle = '#7a4a12';
  ctx.fillRect(x - 5, y - r * 1.15 - 5, 10, 6);
  ctx.fillRect(x - 5, y + r * 1.15 - 1, 10, 6);
  if (lit) {
    ctx.fillStyle = 'rgba(255,230,150,0.85)';
    ellipse(ctx, x, y, r * 0.45, r * 0.55);
    ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- harbour
function drawHarbour(ctx, right, has, t) {
  const sky = ctx.createLinearGradient(0, 0, 0, 310);
  sky.addColorStop(0, '#2b1d4e');
  sky.addColorStop(0.55, '#7a3b6e');
  sky.addColorStop(1, '#e8865a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 600, 312);

  // Stars fading in at dusk. One bright star is a difference.
  const stars = [[60, 40], [200, 55], [330, 30], [520, 45], [150, 100], [420, 130], [90, 150]];
  stars.forEach(([x, y], i) => {
    star(ctx, x, y, 4, '#ffe9a8', 0.55 + 0.35 * Math.sin(t * 0.001 + i));
  });
  if (!(right && has('star'))) star(ctx, 120, 60, 7, '#fff3c4', 1);

  // Low sun with a soft halo.
  ctx.save();
  const halo = ctx.createRadialGradient(470, 110, 8, 470, 110, 90);
  halo.addColorStop(0, 'rgba(255,214,120,0.85)');
  halo.addColorStop(1, 'rgba(255,214,120,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(370, 10, 200, 200);
  ctx.fillStyle = '#ffd76e';
  ellipse(ctx, 470, 110, 34, 34);
  ctx.fill();
  ctx.restore();

  // Drifting clouds.
  ctx.fillStyle = 'rgba(255,190,160,0.5)';
  const drift = Math.sin(t * 0.0002) * 8;
  ellipse(ctx, 150 + drift, 90, 52, 14); ctx.fill();
  ellipse(ctx, 185 + drift, 100, 40, 12); ctx.fill();
  ellipse(ctx, 380 - drift, 60, 46, 12); ctx.fill();

  // Gulls. One of them only flies on the left.
  gull(ctx, 300, 70, 1, '#2c2140');
  gull(ctx, 350, 105, 0.8, '#2c2140');
  if (!(right && has('gull'))) gull(ctx, 430, 80, 1.1, '#2c2140');

  // Sea.
  const sea = ctx.createLinearGradient(0, 300, 0, 520);
  sea.addColorStop(0, '#3d4a8a');
  sea.addColorStop(1, '#1c2450');
  ctx.fillStyle = sea;
  ctx.fillRect(0, 300, 600, 220);
  ctx.fillStyle = 'rgba(255,190,110,0.35)';
  for (let i = 0; i < 5; i++) {
    const wob = Math.sin(t * 0.001 + i * 1.7) * 6;
    ctx.fillRect(452 + wob - 14 - i * 2, 318 + i * 26, 36 + i * 5, 5);
  }
  ctx.strokeStyle = 'rgba(200,220,255,0.35)';
  ctx.lineWidth = 2;
  for (let y = 330; y < 510; y += 34) {
    ctx.beginPath();
    for (let x = 0; x <= 600; x += 30) {
      const yy = y + Math.sin(x * 0.05 + y + t * 0.001) * 3;
      x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }

  // Distant headland with two cottages. One window glows only on the left.
  ctx.fillStyle = '#241a3e';
  ctx.beginPath();
  ctx.moveTo(430, 310); ctx.lineTo(600, 310); ctx.lineTo(600, 268); ctx.lineTo(520, 252); ctx.lineTo(430, 288);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3a2a55';
  ctx.fillRect(470, 262, 44, 34);
  ctx.fillRect(530, 258, 40, 38);
  ctx.fillStyle = '#5a3f7d';
  ctx.beginPath();
  ctx.moveTo(466, 262); ctx.lineTo(492, 246); ctx.lineTo(518, 262); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(526, 258); ctx.lineTo(550, 243); ctx.lineTo(574, 258); ctx.closePath(); ctx.fill();
  ctx.fillStyle = (right && has('window')) ? '#241a3e' : '#ffd76e';
  ctx.fillRect(505, 282, 9, 12);
  ctx.fillStyle = '#ffd76e';
  ctx.fillRect(540, 276, 9, 12);

  // Lighthouse on its rock, left of frame.
  ctx.fillStyle = '#2c2140';
  ellipse(ctx, 85, 318, 78, 22); ctx.fill();
  ctx.fillStyle = '#f3ead8';
  ctx.fillRect(66, 190, 38, 122);
  ctx.fillStyle = '#d94f4f';
  ctx.fillRect(66, 214, 38, 16);
  ctx.fillRect(66, 262, 38, 16);
  ctx.fillStyle = '#2c2140';
  ctx.fillRect(60, 176, 50, 16);
  ctx.fillStyle = (right && has('beam')) ? '#3a2a55' : '#ffe9a0';
  ellipse(ctx, 85, 184, 12, 8); ctx.fill();
  if (!(right && has('beam'))) {
    ctx.save();
    ctx.globalAlpha = 0.28 + 0.06 * Math.sin(t * 0.002);
    ctx.fillStyle = '#ffe9a0';
    ctx.beginPath();
    ctx.moveTo(100, 184); ctx.lineTo(330, 150); ctx.lineTo(330, 232); ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Pier with a coil of rope that only appears on the right.
  ctx.fillStyle = '#6b4a2f';
  ctx.fillRect(20, 430, 190, 14);
  ctx.fillStyle = '#54371f';
  for (let x = 30; x < 210; x += 22) ctx.fillRect(x, 444, 8, 34);
  ctx.fillStyle = '#7d5a38';
  for (let x = 20; x < 210; x += 22) ctx.fillRect(x, 430, 3, 14);
  if (right && has('rope')) {
    ctx.strokeStyle = '#c9a86a';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(120, 448, 13, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(120, 448, 6, 0, Math.PI * 2); ctx.stroke();
  }

  // Sailboat. Its sail stripe, its flag and the jumping fish are differences.
  ctx.fillStyle = '#4a2c1e';
  ctx.beginPath();
  ctx.moveTo(268, 392); ctx.lineTo(356, 392); ctx.lineTo(338, 408); ctx.lineTo(286, 408);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5a3624';
  ctx.fillRect(308, 292, 5, 100);
  ctx.fillStyle = '#f6efdd';
  ctx.beginPath();
  ctx.moveTo(313, 296); ctx.lineTo(313, 386); ctx.lineTo(352, 386);
  ctx.closePath(); ctx.fill();
  if (!(right && has('sail-stripe'))) {
    ctx.fillStyle = '#d94f4f';
    ctx.beginPath();
    ctx.moveTo(313, 330); ctx.lineTo(313, 348); ctx.lineTo(336, 348); ctx.lineTo(330, 330);
    ctx.closePath(); ctx.fill();
  }
  if (!(right && has('flag'))) {
    ctx.fillStyle = '#e8b93c';
    ctx.beginPath();
    ctx.moveTo(313, 292); ctx.lineTo(336, 298); ctx.lineTo(313, 305);
    ctx.closePath(); ctx.fill();
  }
  if (!(right && has('fish'))) {
    ctx.strokeStyle = '#9fc4e8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(392, 348, 14, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#9fc4e8';
    ctx.beginPath();
    ctx.moveTo(406, 334); ctx.lineTo(414, 338); ctx.lineTo(406, 342);
    ctx.closePath(); ctx.fill();
  }

  // A second, smaller boat with a lantern.
  ctx.fillStyle = '#3a2c22';
  ctx.beginPath();
  ctx.moveTo(470, 428); ctx.lineTo(536, 428); ctx.lineTo(522, 442); ctx.lineTo(484, 442);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2c2140';
  ctx.fillRect(498, 396, 4, 32);
  paperLantern(ctx, 500, 392, 9, '#e8b93c', true);

  // A buoy that only bobs on the right.
  if (right && has('buoy')) {
    const bob = Math.sin(t * 0.002) * 3;
    ctx.fillStyle = '#d94f4f';
    ellipse(ctx, 250, 430 + bob, 14, 10); ctx.fill();
    ctx.fillStyle = '#f6efdd';
    ctx.fillRect(238, 426 + bob, 24, 6);
    ctx.fillStyle = '#d94f4f';
    ctx.fillRect(247, 414 + bob, 6, 12);
  }
}

// ---------------------------------------------------------------- market
function drawMarket(ctx, right, has, t) {
  const sky = ctx.createLinearGradient(0, 0, 0, 240);
  sky.addColorStop(0, '#1d1533');
  sky.addColorStop(1, '#4a2a52');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 600, 240);
  star(ctx, 80, 40, 4, '#ffe9a8', 0.8);
  star(ctx, 300, 30, 3, '#ffe9a8', 0.6);
  star(ctx, 520, 55, 4, '#ffe9a8', 0.9);
  ctx.fillStyle = '#f3ead8';
  ellipse(ctx, 540, 42, 20, 20); ctx.fill();
  ctx.fillStyle = '#d9c9a8';
  ellipse(ctx, 533, 38, 5, 5); ctx.fill();
  ellipse(ctx, 546, 48, 3, 3); ctx.fill();

  // Rooftops behind the stalls.
  ctx.fillStyle = '#241a3e';
  ctx.fillRect(0, 150, 180, 90);
  ctx.fillRect(420, 140, 180, 100);
  ctx.fillStyle = '#33254f';
  ctx.beginPath();
  ctx.moveTo(0, 150); ctx.lineTo(90, 118); ctx.lineTo(180, 150); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(420, 140); ctx.lineTo(510, 108); ctx.lineTo(600, 140); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffd76e';
  ctx.fillRect(40, 180, 14, 18);
  ctx.fillRect(470, 170, 14, 18);

  // String lights across the street. One bulb is dark on the right.
  ctx.strokeStyle = '#1a1226';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 48);
  ctx.quadraticCurveTo(300, 96, 600, 48);
  ctx.stroke();
  for (let i = 0; i < 9; i++) {
    const x = 40 + i * 65;
    const y = 48 + Math.sin((x / 600) * Math.PI) * 34;
    const dark = right && has('bulb') && i === 7;
    ctx.fillStyle = dark ? '#3a2a55' : ['#ffd76e', '#ff9d5c', '#9be7c4'][i % 3];
    ellipse(ctx, x, y + 8, 6, 8); ctx.fill();
  }

  // Hanging paper lanterns. The middle one changes colour.
  const sway = Math.sin(t * 0.0012) * 3;
  paperLantern(ctx, 200, 92, 17, '#d94f4f', true);
  paperLantern(ctx, 300 + sway, 100, 20, (right && has('lantern-color')) ? '#e8b93c' : '#d94f4f', true);
  paperLantern(ctx, 400, 92, 17, '#d94f4f', true);

  // Left stall: striped awning, sign, baskets.
  ctx.fillStyle = '#8a2f2f';
  ctx.beginPath();
  ctx.moveTo(30, 210); ctx.lineTo(210, 210); ctx.lineTo(196, 168); ctx.lineTo(44, 168);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f3ead8';
  for (let x = 52; x < 200; x += 36) {
    ctx.beginPath();
    ctx.moveTo(x, 168); ctx.lineTo(x + 18, 168); ctx.lineTo(x + 14, 210); ctx.lineTo(x - 4, 210);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#5a3624';
  ctx.fillRect(36, 210, 168, 10);
  ctx.fillStyle = '#7d5a38';
  ctx.fillRect(40, 220, 160, 130);
  // Sign: a star on the left, a crescent moon on the right.
  ctx.fillStyle = '#f3ead8';
  rr(ctx, 96, 226, 56, 40, 6); ctx.fill();
  ctx.fillStyle = '#2c2140';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TEA', 124, 244);
  if (right && has('sign')) {
    ctx.fillStyle = '#e8b93c';
    ctx.beginPath(); ctx.arc(140, 234, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f3ead8';
    ctx.beginPath(); ctx.arc(143, 232, 5, 0, Math.PI * 2); ctx.fill();
  } else {
    star(ctx, 140, 234, 6, '#e8b93c', 1);
  }
  // Baskets of fruit under the left stall.
  ctx.fillStyle = '#6b4a2f';
  ellipse(ctx, 90, 372, 34, 14); ctx.fill();
  ctx.fillStyle = '#d94f4f';
  [[76, 360], [92, 356], [106, 362], [84, 366], [100, 366]].forEach(([x, y]) => {
    ellipse(ctx, x, y, 7, 7); ctx.fill();
  });
  ctx.fillStyle = '#6b4a2f';
  ellipse(ctx, 165, 372, 30, 13); ctx.fill();
  ctx.fillStyle = '#e8b93c';
  [[152, 362], [166, 358], [178, 363], [160, 366]].forEach(([x, y]) => {
    ellipse(ctx, x, y, 6, 6); ctx.fill();
  });

  // The vendor, centre. Their hat changes colour on the right.
  ctx.fillStyle = '#3a6b4f';
  ctx.beginPath();
  ctx.moveTo(262, 350); ctx.lineTo(338, 350); ctx.lineTo(330, 268); ctx.lineTo(270, 268);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e8c39a';
  ellipse(ctx, 300, 246, 17, 19); ctx.fill();
  ctx.fillStyle = '#2c2140';
  ellipse(ctx, 294, 244, 2.5, 3); ctx.fill();
  ellipse(ctx, 306, 244, 2.5, 3); ctx.fill();
  ctx.strokeStyle = '#2c2140';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(300, 254, 6, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  ctx.fillStyle = (right && has('hat')) ? '#3a5a8a' : '#c94f4f';
  ctx.beginPath();
  ctx.moveTo(276, 234); ctx.lineTo(324, 234); ctx.lineTo(312, 214); ctx.lineTo(288, 214);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = (right && has('hat')) ? '#3a5a8a' : '#c94f4f';
  ellipse(ctx, 300, 234, 30, 5); ctx.fill();

  // Counter with a coin that only appears on the right.
  ctx.fillStyle = '#8a6a42';
  ctx.fillRect(230, 350, 150, 16);
  ctx.fillStyle = '#6b4a2f';
  ctx.fillRect(240, 366, 130, 60);
  if (right && has('coin')) {
    ctx.fillStyle = '#ffd76e';
    ellipse(ctx, 330, 356, 8, 8); ctx.fill();
    ctx.strokeStyle = '#b98a1e';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(330, 356, 5, 0, Math.PI * 2); ctx.stroke();
  }

  // Right stall: teal awning, umbrella, fruit basket with an extra apple.
  ctx.fillStyle = '#2f6b6b';
  ctx.beginPath();
  ctx.moveTo(410, 210); ctx.lineTo(580, 210); ctx.lineTo(566, 170); ctx.lineTo(424, 170);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f3ead8';
  for (let x = 432; x < 570; x += 36) {
    ctx.beginPath();
    ctx.moveTo(x, 170); ctx.lineTo(x + 18, 170); ctx.lineTo(x + 14, 210); ctx.lineTo(x - 4, 210);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#5a3624';
  ctx.fillRect(416, 210, 158, 10);
  ctx.fillStyle = '#7d5a38';
  ctx.fillRect(420, 220, 150, 130);
  // Umbrella over the fruit: one stripe vanishes on the right.
  ctx.save();
  ctx.translate(495, 300);
  ctx.fillStyle = '#d94f4f';
  ctx.beginPath(); ctx.moveTo(-58, 0); ctx.arc(0, 0, 58, Math.PI, 0); ctx.closePath(); ctx.fill();
  if (!(right && has('umbrella'))) {
    ctx.fillStyle = '#f3ead8';
    ctx.beginPath(); ctx.moveTo(-20, 0); ctx.arc(0, 0, 58, Math.PI * 1.28, Math.PI * 1.72); ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = '#5a3624';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, -56); ctx.lineTo(0, 66); ctx.stroke();
  ctx.restore();
  // Fruit basket under the umbrella.
  ctx.fillStyle = '#6b4a2f';
  ellipse(ctx, 495, 386, 40, 15); ctx.fill();
  ctx.fillStyle = '#e8b93c';
  [[472, 376], [488, 370], [504, 376], [480, 380], [510, 380]].forEach(([x, y]) => {
    ellipse(ctx, x, y, 7, 7); ctx.fill();
  });
  if (right && has('apple')) {
    ctx.fillStyle = '#d94f4f';
    ellipse(ctx, 522, 374, 8, 8); ctx.fill();
  }

  // A bird perched on the right awning, only on the left.
  if (!(right && has('bird'))) {
    ctx.fillStyle = '#2c2140';
    ellipse(ctx, 480, 158, 10, 8); ctx.fill();
    ellipse(ctx, 488, 152, 5, 5); ctx.fill();
    ctx.fillStyle = '#e8b93c';
    ctx.beginPath(); ctx.moveTo(492, 152); ctx.lineTo(498, 154); ctx.lineTo(492, 156); ctx.closePath(); ctx.fill();
  }

  // Cobblestones.
  ctx.fillStyle = '#33254f';
  ctx.fillRect(0, 426, 600, 94);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  for (let y = 440; y < 520; y += 26) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(600, y); ctx.stroke();
  }
  for (let x = 20; x < 600; x += 52) {
    ctx.beginPath(); ctx.moveTo(x, 426); ctx.lineTo(x - 14, 520); ctx.stroke();
  }

  // The market cat, asleep on a crate — only on the left.
  ctx.fillStyle = '#8a6a42';
  ctx.fillRect(48, 420, 74, 40);
  ctx.strokeStyle = '#5a3624';
  ctx.lineWidth = 2;
  ctx.strokeRect(48, 420, 74, 40);
  if (!(right && has('cat'))) {
    ctx.fillStyle = '#d98a4a';
    ellipse(ctx, 85, 414, 26, 11); ctx.fill();
    ellipse(ctx, 62, 406, 11, 9); ctx.fill();
    ctx.beginPath(); ctx.moveTo(56, 398); ctx.lineTo(58, 388); ctx.lineTo(64, 397); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(66, 397); ctx.lineTo(69, 388); ctx.lineTo(73, 397); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#a8642e';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(76, 408); ctx.lineTo(76, 418); ctx.moveTo(86, 407); ctx.lineTo(86, 419); ctx.moveTo(96, 408); ctx.lineTo(96, 418); ctx.stroke();
    ctx.strokeStyle = '#d98a4a';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(108, 412); ctx.quadraticCurveTo(124, 404, 118, 392); ctx.stroke();
  }
}

// ---------------------------------------------------------------- garden
function drawGarden(ctx, right, has, t) {
  const sky = ctx.createLinearGradient(0, 0, 0, 330);
  sky.addColorStop(0, '#141033');
  sky.addColorStop(1, '#3a2a5e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 600, 340);
  star(ctx, 60, 50, 4, '#ffe9a8', 0.8);
  star(ctx, 180, 36, 3, '#ffe9a8', 0.6);
  star(ctx, 300, 60, 4, '#ffe9a8', 0.9);
  star(ctx, 400, 34, 3, '#ffe9a8', 0.7);

  // The moon, partly veiled by a cloud on the right.
  ctx.fillStyle = '#f6efdd';
  ellipse(ctx, 480, 90, 38, 38); ctx.fill();
  ctx.fillStyle = '#d9c9a8';
  ellipse(ctx, 468, 80, 8, 8); ctx.fill();
  ellipse(ctx, 492, 102, 6, 6); ctx.fill();
  ellipse(ctx, 486, 74, 4, 4); ctx.fill();
  if (right && has('moon-cloud')) {
    ctx.fillStyle = 'rgba(200,190,220,0.9)';
    ellipse(ctx, 468, 96, 40, 13); ctx.fill();
    ellipse(ctx, 496, 104, 30, 11); ctx.fill();
  }

  // Pagoda on the left, windows glowing — one goes dark on the right.
  ctx.fillStyle = '#3a2a55';
  ctx.fillRect(96, 200, 108, 130);
  ctx.fillStyle = '#4a3870';
  ctx.beginPath(); ctx.moveTo(80, 204); ctx.lineTo(220, 204); ctx.lineTo(204, 176); ctx.lineTo(96, 176); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(88, 180); ctx.lineTo(212, 180); ctx.lineTo(198, 156); ctx.lineTo(102, 156); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(96, 160); ctx.lineTo(204, 160); ctx.lineTo(192, 138); ctx.lineTo(108, 138); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffd76e';
  ctx.fillRect(140, 214, 16, 22);
  ctx.fillStyle = (right && has('pagoda-window')) ? '#1d1533' : '#ffd76e';
  ctx.fillRect(140, 178, 16, 18);
  ctx.fillStyle = '#ffd76e';
  ctx.fillRect(146, 142, 12, 12);
  ctx.fillStyle = '#c94f4f';
  ctx.fillRect(148, 122, 4, 16);
  ctx.fillStyle = '#ffd76e';
  ellipse(ctx, 150, 120, 5, 5); ctx.fill();

  // Bamboo grove on the right. One extra stalk grows on the right.
  const bambooAt = (x, h, lean) => {
    ctx.strokeStyle = '#3f7a4a';
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(x, 340); ctx.lineTo(x + lean, 340 - h); ctx.stroke();
    ctx.strokeStyle = '#2c5a34';
    ctx.lineWidth = 2;
    for (let y = 340 - 30; y > 340 - h; y -= 34) {
      ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4 + lean * 0.3, y - 2); ctx.stroke();
    }
    ctx.fillStyle = '#4a8a55';
    ellipse(ctx, x + lean - 8, 340 - h + 12, 16, 6); ctx.fill();
    ellipse(ctx, x + lean + 10, 340 - h + 22, 14, 5); ctx.fill();
  };
  bambooAt(520, 210, 12);
  bambooAt(556, 180, -8);
  bambooAt(486, 160, 6);
  if (right && has('bamboo')) bambooAt(576, 130, -4);

  // Fireflies drifting over the garden. One is missing on the right.
  const flies = [[250, 150], [330, 120], [380, 200], [430, 160], [290, 220], [360, 260], [220, 260]];
  flies.forEach(([x, y], i) => {
    if (right && has('firefly') && i === 2) return;
    const glow = 0.45 + 0.4 * Math.sin(t * 0.003 + i * 2.1);
    ctx.save();
    ctx.globalAlpha = glow;
    ctx.fillStyle = '#d8f79a';
    ellipse(ctx, x + Math.sin(t * 0.0006 + i) * 6, y + Math.cos(t * 0.0008 + i) * 5, 4, 4);
    ctx.fill();
    ctx.restore();
  });

  // A butterfly that only visits the right panel.
  if (right && has('butterfly')) {
    const flap = Math.sin(t * 0.012) * 0.5 + 0.5;
    ctx.save();
    ctx.translate(500, 250);
    ctx.fillStyle = '#e8a0c8';
    ctx.beginPath(); ctx.ellipse(-7, -4 * flap, 8, 10 * (0.4 + flap * 0.6), -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(7, -4 * flap, 8, 10 * (0.4 + flap * 0.6), 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7a3b6e';
    ctx.fillRect(-1.5, -8, 3, 16);
    ctx.restore();
  }

  // The pond.
  const pond = ctx.createLinearGradient(0, 330, 0, 520);
  pond.addColorStop(0, '#2a4a6b');
  pond.addColorStop(1, '#16283f');
  ctx.fillStyle = pond;
  ctx.fillRect(0, 330, 600, 190);
  ctx.fillStyle = 'rgba(246,239,221,0.25)';
  ellipse(ctx, 480, 360, 30, 5); ctx.fill();
  ellipse(ctx, 480, 396, 38, 6); ctx.fill();
  ctx.strokeStyle = 'rgba(180,220,255,0.3)';
  ctx.lineWidth = 2;
  for (let y = 360; y < 510; y += 36) {
    ctx.beginPath();
    for (let x = 0; x <= 600; x += 30) {
      const yy = y + Math.sin(x * 0.04 + y + t * 0.0012) * 3;
      x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }

  // Lily pads, a lotus flower and the frog.
  const lily = (x, y, r) => {
    ctx.fillStyle = '#3f7a4a';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, r, -0.4, Math.PI * 2 - 0.4);
    ctx.closePath(); ctx.fill();
  };
  lily(150, 420, 42);
  lily(430, 440, 46);
  lily(90, 480, 30);
  lily(520, 480, 28);
  // Lotus flower: pink on the left, white on the right.
  const petal = (right && has('flower')) ? '#f3ead8' : '#e87aa0';
  ctx.fillStyle = petal;
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.5;
    ctx.save();
    ctx.translate(430, 428);
    ctx.rotate(a);
    ctx.beginPath(); ctx.ellipse(0, -14, 7, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#ffd76e';
  ellipse(ctx, 430, 428, 6, 6); ctx.fill();
  // The frog sits on its pad only on the left.
  if (!(right && has('frog'))) {
    ctx.fillStyle = '#5aa864';
    ellipse(ctx, 150, 404, 20, 14); ctx.fill();
    ellipse(ctx, 138, 392, 8, 8); ctx.fill();
    ellipse(ctx, 162, 392, 8, 8); ctx.fill();
    ctx.fillStyle = '#1d1533';
    ellipse(ctx, 138, 390, 3, 4); ctx.fill();
    ellipse(ctx, 162, 390, 3, 4); ctx.fill();
    ctx.strokeStyle = '#2c5a34';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(150, 404, 9, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
  }

  // A koi gliding through the pond: orange on the left, pale on the right.
  const koiColor = (right && has('koi')) ? '#f3ead8' : '#e8863a';
  const kx = 330 + Math.sin(t * 0.0004) * 10;
  ctx.save();
  ctx.translate(kx, 470);
  ctx.fillStyle = koiColor;
  ellipse(ctx, 0, 0, 26, 10); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-36, -10); ctx.lineTo(-36, 10); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ellipse(ctx, 8, -3, 8, 4); ctx.fill();
  ctx.fillStyle = '#1d1533';
  ellipse(ctx, 18, -3, 2.5, 2.5); ctx.fill();
  ctx.restore();

  // Stone lantern by the pond. Its flame burns only on the left.
  ctx.fillStyle = '#6b6b7d';
  ctx.fillRect(292, 396, 16, 34);
  ctx.fillStyle = '#8a8a9d';
  ctx.fillRect(280, 386, 40, 12);
  ctx.fillStyle = '#6b6b7d';
  ctx.beginPath(); ctx.moveTo(276, 386); ctx.lineTo(324, 386); ctx.lineTo(312, 368); ctx.lineTo(288, 368); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8a8a9d';
  ellipse(ctx, 300, 366, 10, 5); ctx.fill();
  if (!(right && has('lantern-flame'))) {
    ctx.fillStyle = '#ffb347';
    ctx.beginPath();
    ctx.moveTo(300, 352);
    ctx.quadraticCurveTo(308, 362, 300, 372);
    ctx.quadraticCurveTo(292, 362, 300, 352);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,180,70,0.25)';
    ellipse(ctx, 300, 364, 16, 12); ctx.fill();
  }
}

// ---------------------------------------------------------------- registry
export const SCENES = [
  {
    id: 'harbour',
    name: 'Harbour at Dusk',
    blurb: 'A sleepy fishing harbour as the sun goes down. Find what changed in the second picture.',
    draw: drawHarbour,
    differences: [
      { id: 'gull', name: 'a gull', x: 430, y: 80, r: 20 },
      { id: 'beam', name: 'the lighthouse beam', x: 230, y: 200, r: 46 },
      { id: 'sail-stripe', name: 'the sail stripe', x: 322, y: 340, r: 26 },
      { id: 'buoy', name: 'the buoy', x: 250, y: 430, r: 22 },
      { id: 'flag', name: 'the boat flag', x: 322, y: 298, r: 18 },
      { id: 'fish', name: 'the jumping fish', x: 396, y: 338, r: 20 },
      { id: 'window', name: 'the cottage window', x: 510, y: 288, r: 16 },
      { id: 'star', name: 'the bright star', x: 120, y: 60, r: 14 },
      { id: 'rope', name: 'the rope coil', x: 120, y: 448, r: 20 },
    ],
  },
  {
    id: 'market',
    name: 'The Lantern Market',
    blurb: 'Paper lanterns, tea stalls and a sleeping cat. Something is different on the right — find it all.',
    draw: drawMarket,
    differences: [
      { id: 'lantern-color', name: 'the lantern colour', x: 300, y: 100, r: 24 },
      { id: 'cat', name: 'the sleeping cat', x: 85, y: 414, r: 26 },
      { id: 'sign', name: 'the tea sign', x: 132, y: 236, r: 18 },
      { id: 'apple', name: 'the extra apple', x: 522, y: 374, r: 14 },
      { id: 'hat', name: 'the vendor hat', x: 300, y: 224, r: 22 },
      { id: 'bulb', name: 'the dark bulb', x: 495, y: 84, r: 14 },
      { id: 'bird', name: 'the bird', x: 482, y: 156, r: 16 },
      { id: 'coin', name: 'the coin', x: 330, y: 356, r: 12 },
      { id: 'umbrella', name: 'the umbrella stripe', x: 495, y: 286, r: 34 },
    ],
  },
  {
    id: 'garden',
    name: 'Moonlit Garden',
    blurb: 'A quiet pond garden under a full moon. Nine small things changed — can you spot them all?',
    draw: drawGarden,
    differences: [
      { id: 'frog', name: 'the frog', x: 150, y: 400, r: 20 },
      { id: 'firefly', name: 'the firefly', x: 380, y: 200, r: 14 },
      { id: 'flower', name: 'the lotus colour', x: 430, y: 428, r: 18 },
      { id: 'pagoda-window', name: 'the pagoda window', x: 148, y: 186, r: 16 },
      { id: 'koi', name: 'the koi colour', x: 330, y: 470, r: 26 },
      { id: 'lantern-flame', name: 'the lantern flame', x: 300, y: 362, r: 16 },
      { id: 'butterfly', name: 'the butterfly', x: 500, y: 250, r: 18 },
      { id: 'moon-cloud', name: 'the cloud on the moon', x: 480, y: 92, r: 36 },
      { id: 'bamboo', name: 'the extra bamboo', x: 576, y: 280, r: 18 },
    ],
  },
];
