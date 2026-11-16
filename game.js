// --- Web Audio Synthesizer ---
const AudioSys = {
  ctx: null,
  init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  },
  play(freq, type, duration, vol = 0.08, slide = 0) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (slide) osc.frequency.exponentialRampToValueAtTime(slide, this.ctx.currentTime + duration);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },
  shoot() { this.play(420, 'triangle', 0.08, 0.06, 120); },
  hit() { this.play(160, 'sawtooth', 0.07, 0.05, 60); },
  kill() { this.play(220, 'square', 0.14, 0.07, 45); },
  dash() { this.play(300, 'sine', 0.18, 0.09, 650); },
  hurt() { this.play(110, 'sawtooth', 0.25, 0.14, 40); },
  levelup() {
    this.play(440, 'sine', 0.12, 0.1);
    setTimeout(() => this.play(554, 'sine', 0.12, 0.1), 90);
    setTimeout(() => this.play(659, 'sine', 0.2, 0.1), 180);
  }
};

// --- Procedural Texture Generator (Creates Albedo + Bump Maps) ---
const TextureFactory = {
  createFloorTextures() {
    const size = 512;
    const diffCanvas = document.createElement('canvas');
    const bumpCanvas = document.createElement('canvas');
    diffCanvas.width = bumpCanvas.width = size;
    diffCanvas.height = bumpCanvas.height = size;

    const dCtx = diffCanvas.getContext('2d');
    const bCtx = bumpCanvas.getContext('2d');

    // Deep mortar base
    dCtx.fillStyle = '#0c0c14';
    dCtx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#151515';
    bCtx.fillRect(0, 0, size, size);

    // 4x4 Carved Dungeon Flagstones
    const tiles = 4;
    const step = size / tiles;
    for (let gx = 0; gx < tiles; gx++) {
      for (let gy = 0; gy < tiles; gy++) {
        const pad = 5;
        const x = gx * step + pad;
        const y = gy * step + pad;
        const w = step - pad * 2;
        const h = step - pad * 2;

        // Subtle per-tile color variation
        const shade = 24 + Math.floor(Math.random() * 12);
        dCtx.fillStyle = `rgb(${shade}, ${shade + 2}, ${shade + 14})`;
        dCtx.fillRect(x, y, w, h);

        // Beveled stone highlight for 3D bump depth
        bCtx.fillStyle = '#b5b5b5';
        bCtx.fillRect(x, y, w, h);
        bCtx.strokeStyle = '#ffffff';
        bCtx.lineWidth = 3;
        bCtx.strokeRect(x + 2, y + 2, w - 4, h - 4);

        // Inner carved rune border
        dCtx.strokeStyle = 'rgba(112, 161, 255, 0.08)';
        dCtx.lineWidth = 2;
        dCtx.strokeRect(x + 10, y + 10, w - 20, h - 20);
      }
    }

    // Weathering speckles & stone grain
    for (let i = 0; i < 4500; i++) {
      const rx = Math.random() * size;
      const ry = Math.random() * size;
      const dark = Math.random() > 0.5;
      dCtx.fillStyle = dark ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.05)';
      dCtx.fillRect(rx, ry, 2, 2);
      bCtx.fillStyle = dark ? 'rgba(40,40,40,0.35)' : 'rgba(235,235,235,0.25)';
      bCtx.fillRect(rx, ry, 2, 2);
    }

    // Hairline cracks across tiles
    dCtx.strokeStyle = 'rgba(5, 5, 10, 0.55)';
    bCtx.strokeStyle = '#101010';
    dCtx.lineWidth = bCtx.lineWidth = 1.5;
    for (let c = 0; c < 14; c++) {
      let cx = Math.random() * size;
      let cy = Math.random() * size;
      dCtx.beginPath(); bCtx.beginPath();
      dCtx.moveTo(cx, cy); bCtx.moveTo(cx, cy);
      for (let s = 0; s < 5; s++) {
        cx += (Math.random() - 0.5) * 35;
        cy += (Math.random() - 0.5) * 35;
        dCtx.lineTo(cx, cy); bCtx.lineTo(cx, cy);
      }
      dCtx.stroke(); bCtx.stroke();
    }

    const map = new THREE.CanvasTexture(diffCanvas);
    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    map.wrapS = map.wrapT = bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
    map.repeat.set(9, 9);
    bumpMap.repeat.set(9, 9);
    return { map, bumpMap };
  },

  createStoneBlockTextures() {
    const size = 256;
    const diffCanvas = document.createElement('canvas');
    const bumpCanvas = document.createElement('canvas');
    diffCanvas.width = bumpCanvas.width = size;
    diffCanvas.height = bumpCanvas.height = size;

    const dCtx = diffCanvas.getContext('2d');
    const bCtx = bumpCanvas.getContext('2d');

    dCtx.fillStyle = '#262638';
    dCtx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);

    // Chiseled Stone Masonry Courses
    const rows = 4;
    const rowH = size / rows;
    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * 32;
      for (let c = -1; c < 4; c++) {
        const bx = c * 64 + offset + 2;
        const by = r * rowH + 2;
        const bw = 60;
        const bh = rowH - 4;

        const tone = 38 + Math.floor(Math.random() * 14);
        dCtx.fillStyle = `rgb(${tone}, ${tone + 2}, ${tone + 18})`;
        dCtx.fillRect(bx, by, bw, bh);

        bCtx.fillStyle = '#c8c8c8';
        bCtx.fillRect(bx, by, bw, bh);
        bCtx.strokeStyle = '#202020';
        bCtx.lineWidth = 3;
        bCtx.strokeRect(bx, by, bw, bh);
      }
    }

    // Subtle Moss Patches at Base
    for (let m = 0; m < 45; m++) {
      const mx = Math.random() * size;
      const my = size * 0.55 + Math.random() * (size * 0.45);
      const rad = Math.random() * 14 + 4;
      dCtx.fillStyle = 'rgba(46, 134, 95, 0.25)';
      dCtx.beginPath();
      dCtx.arc(mx, my, rad, 0, Math.PI * 2);
      dCtx.fill();
    }

    // Glowing Arcane Rune Band near top
    dCtx.fillStyle = 'rgba(255, 165, 2, 0.35)';
    dCtx.fillRect(0, 28, size, 6);
    bCtx.fillStyle = '#ffffff';
    bCtx.fillRect(0, 28, size, 6);

    const map = new THREE.CanvasTexture(diffCanvas);
    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    map.wrapS = map.wrapT = bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
    return { map, bumpMap };
  },

  createArmorTexture(baseHex, stripeHex) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, size, size);

    // Brushed metallic horizontal sheen
    for (let y = 0; y < size; y += 2) {
      ctx.fillStyle = y % 4 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)';
      ctx.fillRect(0, y, size, 1);
    }

    // Glowing energy trim & rivets
    ctx.fillStyle = stripeHex;
    ctx.fillRect(0, size * 0.44, size, 10);

    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    for (let x = 8; x < size; x += 24) {
      ctx.fillRect(x, 12, 4, 4);
      ctx.fillRect(x, size - 16, 4, 4);
    }

    return new THREE.CanvasTexture(canvas);
  },

  createEnemyTexture(hexColor, patternType) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = hexColor;
    ctx.fillRect(0, 0, size, size);

    if (patternType === 'scales') {
      ctx.strokeStyle = 'rgba(0,0,0,0.32)';
      ctx.lineWidth = 3;
      for (let y = 0; y < size + 16; y += 16) {
        for (let x = 0; x < size + 16; x += 16) {
          ctx.beginPath();
          ctx.arc(x + (y % 32 === 0 ? 8 : 0), y, 10, 0, Math.PI);
          ctx.stroke();
        }
      }
    } else if (patternType === 'hazard') {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      for (let i = -size; i < size * 2; i += 24) {
        ctx.beginPath();
        ctx.moveTo(i, 0); ctx.lineTo(i + 12, 0);
        ctx.lineTo(i - 20, size); ctx.lineTo(i - 32, size);
        ctx.fill();
      }
    } else if (patternType === 'boss') {
      ctx.strokeStyle = '#ffa502';
      ctx.lineWidth = 4;
      for (let i = 0; i < 8; i++) {
        ctx.strokeRect(i * 8, i * 8, size - i * 16, size - i * 16);
      }
    }

    // Organic noise grain
    for (let i = 0; i < 600; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.18)';
      ctx.fillRect(Math.random() * size, Math.random() * size, 3, 3);
    }

    return new THREE.CanvasTexture(canvas);
  }
};

// --- Three.js Scene & Isometric Orthographic Camera ---
const mount = document.getElementById('canvasMount');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x08080e);
scene.fog = new THREE.Fog(0x08080e, 34, 72);

const frustumSize = 26;
let aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
  -frustumSize * aspect / 2, frustumSize * aspect / 2,
  frustumSize / 2, -frustumSize / 2,
  0.1, 100
);

const camOffset = new THREE.Vector3(18, 18, 18);
camera.position.copy(camOffset);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
mount.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  aspect = window.innerWidth / window.innerHeight;
  camera.left = -frustumSize * aspect / 2;
  camera.right = frustumSize * aspect / 2;
  camera.top = frustumSize / 2;
  camera.bottom = -frustumSize / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Lighting (Warm Torch Corner Lights + Cool Overhead Key Light)
const ambientLight = new THREE.AmbientLight(0x454566, 1.15);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xdce6ff, 1.15);
dirLight.position.set(15, 28, 12);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 5;
dirLight.shadow.camera.far = 65;
const d = 24;
dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;
scene.add(dirLight);

const playerLight = new THREE.PointLight(0x3898ff, 1.6, 15);
scene.add(playerLight);

// --- Textured 3D Arena Floor, Braziers, & Stone Pillars ---
const ARENA_HALF = 18;
const floorTex = TextureFactory.createFloorTextures();
const floorGeo = new THREE.PlaneGeometry(ARENA_HALF * 2, ARENA_HALF * 2);
const floorMat = new THREE.MeshStandardMaterial({
  map: floorTex.map,
  bumpMap: floorTex.bumpMap,
  bumpScale: 0.14,
  roughness: 0.78,
  metalness: 0.12
});
const floorMesh = new THREE.Mesh(floorGeo, floorMat);
floorMesh.rotation.x = -Math.PI / 2;
floorMesh.receiveShadow = true;
scene.add(floorMesh);

// Corner Torch Braziers for Warm Atmospheric Reflections
[[-16.5, -16.5], [16.5, -16.5], [-16.5, 16.5], [16.5, 16.5]].forEach(([bx, bz]) => {
  const brazier = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.4, 1.1, 8),
    new THREE.MeshStandardMaterial({ color: 0x1e1e28, metalness: 0.8, roughness: 0.3 })
  );
  brazier.position.set(bx, 0.55, bz);
  brazier.castShadow = true;
  scene.add(brazier);

  const ember = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff6b22 })
  );
  ember.position.set(bx, 1.15, bz);
  scene.add(ember);

  const torchLight = new THREE.PointLight(0xff7722, 1.2, 16);
  torchLight.position.set(bx, 2.2, bz);
  scene.add(torchLight);
});

// Chiseled Stone Pillars with Bump Maps & Capstones
const stoneTex = TextureFactory.createStoneBlockTextures();
const wallMat = new THREE.MeshStandardMaterial({
  map: stoneTex.map,
  bumpMap: stoneTex.bumpMap,
  bumpScale: 0.16,
  roughness: 0.75,
  metalness: 0.08
});

const pillars = [
  { x: -7, z: -7, r: 1.3 },
  { x: 7, z: -7, r: 1.3 },
  { x: -7, z: 7, r: 1.3 },
  { x: 7, z: 7, r: 1.3 }
];

pillars.forEach(p => {
  const group = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(p.r, p.r * 1.05, 3.2, 10), wallMat);
  shaft.position.y = 1.6;
  shaft.castShadow = true;
  shaft.receiveShadow = true;

  const baseTrim = new THREE.Mesh(new THREE.CylinderGeometry(p.r * 1.18, p.r * 1.22, 0.35, 10), wallMat);
  baseTrim.position.y = 0.175;
  baseTrim.castShadow = true;

  const topTrim = new THREE.Mesh(new THREE.CylinderGeometry(p.r * 1.2, p.r * 1.1, 0.35, 10), wallMat);
  topTrim.position.y = 3.25;
  topTrim.castShadow = true;

  group.add(shaft, baseTrim, topTrim);
  group.position.set(p.x, 0, p.z);
  scene.add(group);
});

// Perimeter Stone Walls
const borderConfigs = [
  { x: 0, z: -ARENA_HALF - 0.5, w: ARENA_HALF * 2 + 2, d: 1 },
  { x: 0, z: ARENA_HALF + 0.5, w: ARENA_HALF * 2 + 2, d: 1 },
  { x: -ARENA_HALF - 0.5, z: 0, w: 1, d: ARENA_HALF * 2 },
  { x: ARENA_HALF + 0.5, z: 0, w: 1, d: ARENA_HALF * 2 }
];
borderConfigs.forEach(b => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, 1.5, b.d), wallMat);
  mesh.position.set(b.x, 0.75, b.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
});

// Pre-built Enemy & Player Textures
const playerArmorTex = TextureFactory.createArmorTexture('#1e5799', '#00f2fe');
const gunMetalTex = TextureFactory.createArmorTexture('#4b5563', '#ffa502');
const enemyTextures = {
  grunt:    TextureFactory.createEnemyTexture('#26a65b', 'scales'),
  rusher:   TextureFactory.createEnemyTexture('#e84393', 'hazard'),
  shooter:  TextureFactory.createEnemyTexture('#e67e22', 'scales'),
  tank:     TextureFactory.createEnemyTexture('#8e44ad', 'hazard'),
  charger:  TextureFactory.createEnemyTexture('#d35400', 'hazard'),
  splitter: TextureFactory.createEnemyTexture('#0097a7', 'scales'),
  mini:     TextureFactory.createEnemyTexture('#00cec9', 'scales'),
  boss:     TextureFactory.createEnemyTexture('#c0392b', 'boss')
};

// --- Raycaster for 3D Isometric Mouse Aiming ---
const raycaster = new THREE.Raycaster();
const mouseNDC = new THREE.Vector2();
const aimPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.8);
const aimPoint = new THREE.Vector3();

const reticleMesh = new THREE.Mesh(
  new THREE.RingGeometry(0.35, 0.52, 24),
  new THREE.MeshBasicMaterial({ color: 0xffa502, side: THREE.DoubleSide })
);
reticleMesh.rotation.x = -Math.PI / 2;
reticleMesh.position.y = 0.05;
scene.add(reticleMesh);

// --- Game State & Inputs ---
let state = 'START';
let wave = 1;
let kills = 0;
let spawnTimer = 0;
let enemiesToSpawn = 0;
let screenShake = 0;
let bannerTimer = 0;

const keys = {};
let mouseDown = false;

window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Space' && state === 'PLAYING') triggerDash();
});
window.addEventListener('keyup', e => keys[e.code] = false);
window.addEventListener('mousemove', e => {
  mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
});
window.addEventListener('mousedown', () => mouseDown = true);
window.addEventListener('mouseup', () => mouseDown = false);

document.getElementById('startBtn').onclick = startGame;
document.getElementById('restartBtn').onclick = startGame;

// --- Entities & In-Run Upgrades ---
let player, playerMesh, bullets = [], enemyBullets = [], enemies = [], gems = [], particles = [];

const UPGRADES = [
  { tag: "Offense", name: "Hollow Points", desc: "+25% Bullet Damage.", apply: p => p.damage *= 1.25 },
  { tag: "Offense", name: "Overclocked Trigger", desc: "+22% Fire Rate.", apply: p => p.fireRate *= 0.78 },
  { tag: "Weapon", name: "Split Chamber", desc: "+1 Projectile per shot.", apply: p => p.multishot += 1 },
  { tag: "Weapon", name: "Rail Slugs", desc: "Bullets pierce +1 enemy and fly faster.", apply: p => { p.pierce += 1; p.bulletSpeed *= 1.15; } },
  { tag: "Offense", name: "Deadeye Lens", desc: "+15% Crit Chance & +50% Crit Damage.", apply: p => { p.critChance += 0.15; p.critMult += 0.5; } },
  { tag: "Mobility", name: "Adrenaline Boots", desc: "+15% Movement Speed.", apply: p => p.speed *= 1.15 },
  { tag: "Mobility", name: "Phase Capacitor", desc: "-25% Dash Cooldown.", apply: p => p.dashCdMax *= 0.75 },
  { tag: "Survival", name: "Vitality Surge", desc: "+35 Max HP and heal 35 HP.", apply: p => { p.maxHp += 35; p.hp = Math.min(p.maxHp, p.hp + 35); } },
  { tag: "Survival", name: "Siphon Core", desc: "Heal 3 HP every 8th enemy killed.", apply: p => p.vamp += 3 }
];

function clearEntities() {
  [...bullets, ...enemyBullets, ...enemies, ...gems, ...particles].forEach(obj => {
    if (obj.mesh) scene.remove(obj.mesh);
  });
  bullets = [];
  enemyBullets = [];
  enemies = [];
  gems = [];
  particles = [];
  if (playerMesh) scene.remove(playerMesh);
}

function startGame() {
  AudioSys.init();
  clearEntities();

  document.getElementById('startScreen').classList.add('hidden');
  document.getElementById('gameOverScreen').classList.add('hidden');
  document.getElementById('upgradeScreen').classList.add('hidden');
  document.getElementById('bossHud').classList.add('hidden');

  // Textured Metallic Hero Rig
  playerMesh = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.55, 1.4, 16),
    new THREE.MeshStandardMaterial({
      map: playerArmorTex,
      bumpMap: playerArmorTex,
      bumpScale: 0.04,
      metalness: 0.55,
      roughness: 0.3
    })
  );
  body.position.y = 0.7;
  body.castShadow = true;

  const shoulderPad = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.28, 0.6),
    new THREE.MeshStandardMaterial({ map: playerArmorTex, metalness: 0.65, roughness: 0.25 })
  );
  shoulderPad.position.y = 1.15;
  shoulderPad.castShadow = true;

  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.22, 0.45),
    new THREE.MeshBasicMaterial({ color: 0x00ffff })
  );
  visor.position.set(0, 1.18, 0.35);

  const gun = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.24, 0.95),
    new THREE.MeshStandardMaterial({ map: gunMetalTex, metalness: 0.8, roughness: 0.2 })
  );
  gun.position.set(0.48, 0.85, 0.45);
  gun.castShadow = true;

  playerMesh.add(body, shoulderPad, visor, gun);
  scene.add(playerMesh);

  player = {
    x: 0, z: 0, r: 0.6,
    hp: 100, maxHp: 100,
    speed: 8.5,
    damage: 18,
    bulletSpeed: 24,
    fireRate: 210, lastShot: 0,
    multishot: 1,
    pierce: 0,
    critChance: 0.08,
    critMult: 2.0,
    vamp: 0,
    xp: 0, xpNext: 50, lvl: 1,
    dashCd: 0, dashCdMax: 1350, dashTime: 0, dashDir: { x: 0, z: 0 },
    invuln: 0
  };

  wave = 1;
  kills = 0;
  startWave(1);
  state = 'PLAYING';
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function startWave(w) {
  wave = w;
  document.getElementById('waveText').innerText = wave;
  const banner = document.getElementById('waveBanner');
  banner.innerText = wave % 5 === 0 ? `BOSS WAVE ${wave}` : `WAVE ${wave}`;
  banner.classList.remove('hidden');
  bannerTimer = 1800;

  if (wave % 5 === 0) {
    spawnBoss();
    enemiesToSpawn = Math.floor(wave * 1.3);
  } else {
    enemiesToSpawn = 6 + Math.floor(wave * 3.2);
  }
}

function getMoveInput() {
  let forward = (keys['KeyW'] || keys['ArrowUp'] ? 1 : 0) - (keys['KeyS'] || keys['ArrowDown'] ? 1 : 0);
  let right = (keys['KeyD'] || keys['ArrowRight'] ? 1 : 0) - (keys['KeyA'] || keys['ArrowLeft'] ? 1 : 0);
  if (forward === 0 && right === 0) return { x: 0, z: 0 };

  let dx = (-forward + right);
  let dz = (-forward - right);
  const len = Math.hypot(dx, dz);
  return { x: dx / len, z: dz / len };
}

function triggerDash() {
  if (player.dashCd <= 0 && player.dashTime <= 0) {
    AudioSys.dash();
    let dir = getMoveInput();
    if (dir.x === 0 && dir.z === 0) {
      const a = Math.atan2(aimPoint.z - player.z, aimPoint.x - player.x);
      dir = { x: Math.cos(a), z: Math.sin(a) };
    }
    player.dashDir = dir;
    player.dashTime = 160;
    player.invuln = 260;
    player.dashCd = player.dashCdMax;
    spawnParticles(player.x, 0.8, player.z, 0x70a1ff, 12);
  }
}

function resolvePillarCollision(entity) {
  for (const p of pillars) {
    const dx = entity.x - p.x;
    const dz = entity.z - p.z;
    const dist = Math.hypot(dx, dz);
    const minDist = entity.r + p.r;
    if (dist < minDist && dist > 0) {
      entity.x = p.x + (dx / dist) * minDist;
      entity.z = p.z + (dz / dist) * minDist;
    }
  }
  entity.x = Math.max(-ARENA_HALF + entity.r, Math.min(ARENA_HALF - entity.r, entity.x));
  entity.z = Math.max(-ARENA_HALF + entity.r, Math.min(ARENA_HALF - entity.r, entity.z));
}

function spawnEnemy(forcedType = null, fx = null, fz = null) {
  let x = fx, z = fz;
  if (x === null || z === null) {
    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? -ARENA_HALF + 1 : ARENA_HALF - 1;
      z = (Math.random() * 2 - 1) * (ARENA_HALF - 1);
    } else {
      x = (Math.random() * 2 - 1) * (ARENA_HALF - 1);
      z = Math.random() < 0.5 ? -ARENA_HALF + 1 : ARENA_HALF - 1;
    }
  }

  const scale = 1 + (wave - 1) * 0.2;
  const roll = Math.random();
  const type = forcedType || (
    wave >= 6 && roll < 0.14 ? 'splitter' :
    wave >= 4 && roll < 0.28 ? 'charger' :
    wave >= 4 && roll < 0.44 ? 'tank' :
    wave >= 2 && roll < 0.64 ? 'shooter' :
    wave >= 2 && roll < 0.80 ? 'rusher' : 'grunt'
  );

  const configs = {
    grunt:    { r: 0.55, h: 1.2, hp: 34 * scale,  speed: 4.5 + wave * 0.08, color: 0x2ed573, xp: 12, geo: 'box' },
    rusher:   { r: 0.42, h: 0.9, hp: 20 * scale,  speed: 7.8 + wave * 0.1,  color: 0xff6b81, xp: 15, geo: 'cone' },
    shooter:  { r: 0.6,  h: 1.4, hp: 38 * scale,  speed: 3.8,               color: 0xffa502, xp: 24, geo: 'octa', shootCd: 1400 },
    tank:     { r: 0.95, h: 1.9, hp: 125 * scale, speed: 2.6,               color: 0xa55eea, xp: 38, geo: 'box' },
    charger:  { r: 0.65, h: 1.1, hp: 55 * scale,  speed: 3.6,               color: 0xff9f43, xp: 30, geo: 'cone', chargeCd: 2200, charging: 0, vx: 0, vz: 0 },
    splitter: { r: 0.8,  h: 1.2, hp: 65 * scale,  speed: 3.7,               color: 0x00d2d3, xp: 25, geo: 'sphere' },
    mini:     { r: 0.38, h: 0.7, hp: 18 * scale,  speed: 6.8,               color: 0x48dbfb, xp: 8,  geo: 'sphere' }
  };

  const cfg = configs[type];
  let geometry;
  if (cfg.geo === 'cone') geometry = new THREE.ConeGeometry(cfg.r, cfg.h, 8);
  else if (cfg.geo === 'octa') geometry = new THREE.OctahedronGeometry(cfg.r);
  else if (cfg.geo === 'sphere') geometry = new THREE.SphereGeometry(cfg.r, 14, 14);
  else geometry = new THREE.BoxGeometry(cfg.r * 1.7, cfg.h, cfg.r * 1.7);

  const tex = enemyTextures[type];
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      map: tex,
      bumpMap: tex,
      bumpScale: 0.06,
      roughness: 0.45,
      metalness: 0.15
    })
  );
  mesh.position.set(x, cfg.h / 2, z);
  mesh.castShadow = true;
  scene.add(mesh);

  enemies.push({ type, x, z, maxHp: cfg.hp, mesh, ...cfg });
}

function spawnBoss() {
  const scale = 1 + (wave / 5 - 1) * 0.75;
  const bossNames = ["WARDEN OF ASH", "THE IRON ARCHITECT", "VOID LEVIATHAN", "OVERLORD XERATH"];
  document.getElementById('bossName').innerText = `${bossNames[(wave / 5 - 1) % bossNames.length]} (WAVE ${wave})`;
  document.getElementById('bossHud').classList.remove('hidden');

  const bossTex = enemyTextures.boss;
  const mesh = new THREE.Mesh(
    new THREE.DodecahedronGeometry(1.7),
    new THREE.MeshStandardMaterial({
      map: bossTex,
      bumpMap: bossTex,
      bumpScale: 0.12,
      emissive: 0x330000,
      roughness: 0.35,
      metalness: 0.4
    })
  );
  mesh.position.set(0, 1.7, -ARENA_HALF + 2);
  mesh.castShadow = true;
  scene.add(mesh);

  enemies.push({
    type: 'boss',
    x: 0, z: -ARENA_HALF + 2, r: 1.6,
    hp: 1100 * scale, maxHp: 1100 * scale,
    speed: 3.0,
    color: 0xff4757,
    xp: 300,
    shootCd: 1100,
    pattern: 0,
    mesh
  });
}

function spawnParticles(x, y, z, color, count) {
  const geo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
  const mat = new THREE.MeshBasicMaterial({ color });
  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * 6 + 2;
    particles.push({
      mesh,
      vx: Math.cos(a) * s,
      vy: Math.random() * 5 + 2,
      vz: Math.sin(a) * s,
      life: 350
    });
  }
}

function showUpgradeMenu() {
  AudioSys.levelup();
  state = 'UPGRADE';
  const container = document.getElementById('upgradeCards');
  container.innerHTML = '';
  const picks = [...UPGRADES].sort(() => 0.5 - Math.random()).slice(0, 3);

  picks.forEach(upg => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<span class="tag">${upg.tag}</span><h3>${upg.name}</h3><p>${upg.desc}</p>`;
    card.onclick = () => {
      upg.apply(player);
      document.getElementById('upgradeScreen').classList.add('hidden');
      state = 'PLAYING';
      lastTime = performance.now();
      requestAnimationFrame(loop);
    };
    container.appendChild(card);
  });
  document.getElementById('upgradeScreen').classList.remove('hidden');
}

// --- Main Loop ---
let lastTime = 0;
function loop(now) {
  if (state !== 'PLAYING') return;
  const dtMs = Math.min(now - lastTime, 50);
  const dt = dtMs / 1000;
  lastTime = now;

  update(dt, dtMs, now);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function update(dt, dtMs, now) {
  if (screenShake > 0) screenShake = Math.max(0, screenShake - dt * 2.5);
  if (bannerTimer > 0) {
    bannerTimer -= dtMs;
    if (bannerTimer <= 0) document.getElementById('waveBanner').classList.add('hidden');
  }
  if (player.dashCd > 0) player.dashCd -= dtMs;
  if (player.invuln > 0) player.invuln -= dtMs;

  // Player Movement
  if (player.dashTime > 0) {
    player.dashTime -= dtMs;
    player.x += player.dashDir.x * 26 * dt;
    player.z += player.dashDir.z * 26 * dt;
  } else {
    const move = getMoveInput();
    player.x += move.x * player.speed * dt;
    player.z += move.z * player.speed * dt;
  }
  resolvePillarCollision(player);
  playerMesh.position.set(player.x, 0, player.z);
  playerMesh.visible = !(player.invuln > 0 && Math.floor(now / 55) % 2 === 0);
  playerLight.position.set(player.x, 2.5, player.z);

  // Smooth Isometric Camera Follow + Screen Shake
  const shakeX = (Math.random() - 0.5) * screenShake;
  const shakeZ = (Math.random() - 0.5) * screenShake;
  camera.position.lerp(
    new THREE.Vector3(player.x + camOffset.x + shakeX, camOffset.y, player.z + camOffset.z + shakeZ),
    0.12
  );
  camera.lookAt(player.x + shakeX, 0, player.z + shakeZ);

  // 3D Raycast Mouse Aiming
  raycaster.setFromCamera(mouseNDC, camera);
  if (raycaster.ray.intersectPlane(aimPlane, aimPoint)) {
    reticleMesh.position.set(aimPoint.x, 0.05, aimPoint.z);
    const angle = Math.atan2(aimPoint.x - player.x, aimPoint.z - player.z);
    playerMesh.rotation.y = angle;
  }

  // Shooting
  if (mouseDown && now - player.lastShot > player.fireRate) {
    player.lastShot = now;
    AudioSys.shoot();
    const baseAngle = Math.atan2(aimPoint.z - player.z, aimPoint.x - player.x);
    const spread = 0.11;
    const bGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const bMat = new THREE.MeshBasicMaterial({ color: 0xffeaa7 });

    for (let i = 0; i < player.multishot; i++) {
      const a = baseAngle + (i - (player.multishot - 1) / 2) * spread;
      const mesh = new THREE.Mesh(bGeo, bMat);
      mesh.position.set(player.x, 0.85, player.z);
      scene.add(mesh);

      bullets.push({
        x: player.x, z: player.z,
        vx: Math.cos(a) * player.bulletSpeed,
        vz: Math.sin(a) * player.bulletSpeed,
        r: 0.22, pierce: player.pierce, hitList: [], mesh
      });
    }
  }

  // Wave Spawner
  if (enemiesToSpawn > 0) {
    spawnTimer -= dtMs;
    if (spawnTimer <= 0) {
      spawnEnemy();
      enemiesToSpawn--;
      spawnTimer = Math.max(250, 1050 - wave * 55);
    }
  } else if (enemies.length === 0) {
    startWave(wave + 1);
  }

  // Update Player Bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx * dt;
    b.z += b.vz * dt;
    b.mesh.position.set(b.x, 0.85, b.z);

    let hitWall = Math.abs(b.x) > ARENA_HALF || Math.abs(b.z) > ARENA_HALF;
    for (const p of pillars) {
      if (Math.hypot(b.x - p.x, b.z - p.z) < b.r + p.r) hitWall = true;
    }
    if (hitWall) {
      spawnParticles(b.x, 0.85, b.z, 0xffeaa7, 3);
      scene.remove(b.mesh);
      bullets.splice(i, 1);
      continue;
    }

    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (!b.hitList.includes(e) && Math.hypot(b.x - e.x, b.z - e.z) < b.r + e.r) {
        const isCrit = Math.random() < player.critChance;
        const dmg = Math.round(player.damage * (isCrit ? player.critMult : 1));
        e.hp -= dmg;
        b.hitList.push(e);

        AudioSys.hit();
        spawnParticles(b.x, 0.85, b.z, e.color, 4);

        if (e.hp <= 0) {
          kills++;
          AudioSys.kill();
          screenShake = Math.max(screenShake, e.type === 'boss' ? 0.9 : 0.25);
          if (player.vamp > 0 && kills % 8 === 0) {
            player.hp = Math.min(player.maxHp, player.hp + player.vamp);
          }
          if (e.type === 'splitter') {
            spawnEnemy('mini', e.x - 0.6, e.z);
            spawnEnemy('mini', e.x + 0.6, e.z);
          }
          if (e.type === 'boss') {
            document.getElementById('bossHud').classList.add('hidden');
          }

          const gemMesh = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.28),
            new THREE.MeshStandardMaterial({ color: 0x00f2fe, emissive: 0x006688, roughness: 0.1, metalness: 0.8 })
          );
          gemMesh.position.set(e.x, 0.45, e.z);
          scene.add(gemMesh);
          gems.push({ x: e.x, z: e.z, val: e.xp, mesh: gemMesh });

          spawnParticles(e.x, 0.8, e.z, e.color, 12);
          scene.remove(e.mesh);
          enemies.splice(j, 1);
        }

        if (b.pierce > 0) {
          b.pierce--;
        } else {
          scene.remove(b.mesh);
          bullets.splice(i, 1);
          break;
        }
      }
    }
  }

  // Update Enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const dist = Math.hypot(player.x - e.x, player.z - e.z);
    const angle = Math.atan2(player.z - e.z, player.x - e.x);

    if (e.type === 'shooter') {
      if (dist > 10) { e.x += Math.cos(angle) * e.speed * dt; e.z += Math.sin(angle) * e.speed * dt; }
      else if (dist < 7) { e.x -= Math.cos(angle) * e.speed * dt; e.z -= Math.sin(angle) * e.speed * dt; }
      e.shootCd -= dtMs;
      if (e.shootCd <= 0) {
        e.shootCd = Math.max(850, 1950 - wave * 40);
        spawnEnemyBullet(e.x, e.z, Math.cos(angle) * 11, Math.sin(angle) * 11, 12 + wave);
      }
    } else if (e.type === 'charger') {
      if (e.charging > 0) {
        e.charging -= dtMs;
        e.x += e.vx * dt;
        e.z += e.vz * dt;
      } else {
        e.x += Math.cos(angle) * e.speed * dt;
        e.z += Math.sin(angle) * e.speed * dt;
        e.chargeCd -= dtMs;
        if (e.chargeCd <= 0 && dist < 13) {
          e.charging = 380;
          e.chargeCd = 2400;
          e.vx = Math.cos(angle) * 19;
          e.vz = Math.sin(angle) * 19;
        }
      }
    } else if (e.type === 'boss') {
      const enraged = e.hp < e.maxHp * 0.5;
      const spd = enraged ? e.speed * 1.35 : e.speed;
      e.x += Math.cos(angle) * spd * dt;
      e.z += Math.sin(angle) * spd * dt;
      e.mesh.rotation.y += dt * 2;
      document.getElementById('bossBar').style.width = Math.max(0, (e.hp / e.maxHp) * 100) + '%';

      e.shootCd -= dtMs;
      if (e.shootCd <= 0) {
        e.pattern = (e.pattern + 1) % 3;
        if (e.pattern === 0) {
          e.shootCd = enraged ? 1100 : 1500;
          const count = (enraged ? 18 : 12) + Math.floor(wave / 5) * 3;
          for (let k = 0; k < count; k++) {
            const a = (Math.PI * 2 / count) * k;
            spawnEnemyBullet(e.x, e.z, Math.cos(a) * 10, Math.sin(a) * 10, 15 + wave);
          }
        } else if (e.pattern === 1) {
          e.shootCd = enraged ? 850 : 1150;
          for (let k = -2; k <= 2; k++) {
            const a = angle + k * 0.15;
            spawnEnemyBullet(e.x, e.z, Math.cos(a) * 14, Math.sin(a) * 14, 15 + wave);
          }
        } else {
          e.shootCd = 1300;
          spawnEnemy('rusher', e.x, e.z);
        }
      }
    } else {
      e.x += Math.cos(angle) * e.speed * dt;
      e.z += Math.sin(angle) * e.speed * dt;
    }

    resolvePillarCollision(e);
    e.mesh.position.x = e.x;
    e.mesh.position.z = e.z;
    if (e.type !== 'boss') e.mesh.rotation.y = -angle;

    if (dist < player.r + e.r && player.invuln <= 0) {
      const dmg = e.type === 'boss' ? 24 : 12 + Math.floor(wave * 0.8);
      player.hp -= dmg;
      player.invuln = 650;
      screenShake = 0.6;
      AudioSys.hurt();
      spawnParticles(player.x, 0.8, player.z, 0xff4757, 12);
    }
  }

  // Update Enemy Bullets
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const eb = enemyBullets[i];
    eb.x += eb.vx * dt;
    eb.z += eb.vz * dt;
    eb.mesh.position.set(eb.x, 0.8, eb.z);

    let hitWall = Math.abs(eb.x) > ARENA_HALF || Math.abs(eb.z) > ARENA_HALF;
    for (const p of pillars) {
      if (Math.hypot(eb.x - p.x, eb.z - p.z) < eb.r + p.r) hitWall = true;
    }
    if (hitWall) {
      scene.remove(eb.mesh);
      enemyBullets.splice(i, 1);
      continue;
    }

    if (Math.hypot(eb.x - player.x, eb.z - player.z) < eb.r + player.r) {
      if (player.invuln <= 0) {
        player.hp -= eb.dmg;
        player.invuln = 550;
        screenShake = 0.5;
        AudioSys.hurt();
        spawnParticles(player.x, 0.8, player.z, 0xff4757, 10);
      }
      scene.remove(eb.mesh);
      enemyBullets.splice(i, 1);
    }
  }

  // XP Gems
  for (let i = gems.length - 1; i >= 0; i--) {
    const g = gems[i];
    g.mesh.rotation.y += dt * 3;
    const dist = Math.hypot(player.x - g.x, player.z - g.z);
    if (dist < 4.5) {
      const a = Math.atan2(player.z - g.z, player.x - g.x);
      g.x += Math.cos(a) * 14 * dt;
      g.z += Math.sin(a) * 14 * dt;
      g.mesh.position.set(g.x, 0.45, g.z);
    }
    if (dist < player.r + 0.4) {
      player.xp += g.val;
      scene.remove(g.mesh);
      gems.splice(i, 1);
      if (player.xp >= player.xpNext) {
        player.xp -= player.xpNext;
        player.lvl++;
        player.xpNext = Math.floor(player.xpNext * 1.35);
        showUpgradeMenu();
      }
    }
  }

  // 3D Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.mesh.position.x += p.vx * dt;
    p.mesh.position.y = Math.max(0.1, p.mesh.position.y + p.vy * dt);
    p.mesh.position.z += p.vz * dt;
    p.vy -= 18 * dt;
    p.life -= dtMs;
    if (p.life <= 0) {
      scene.remove(p.mesh);
      particles.splice(i, 1);
    }
  }

  // Update HUD
  document.getElementById('hpText').innerText = `${Math.max(0, Math.ceil(player.hp))}/${player.maxHp}`;
  document.getElementById('hpBar').style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;
  document.getElementById('lvlText').innerText = player.lvl;
  document.getElementById('xpBar').style.width = `${(player.xp / player.xpNext) * 100}%`;
  document.getElementById('killText').innerText = kills;
  document.getElementById('dashText').innerText = player.dashCd <= 0 ? 'READY' : (player.dashCd / 1000).toFixed(1) + 's';

  // Death Check
  if (player.hp <= 0) {
    state = 'GAMEOVER';
    document.getElementById('deathStats').innerText = `Reached Wave ${wave} | Level ${player.lvl} | Kills: ${kills}`;
    document.getElementById('gameOverScreen').classList.remove('hidden');
  }
}

function spawnEnemyBullet(x, z, vx, vz, dmg) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff4757 })
  );
  mesh.position.set(x, 0.8, z);
  scene.add(mesh);
  enemyBullets.push({ x, z, vx, vz, r: 0.25, dmg, mesh });
}
