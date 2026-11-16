// --- 1. SAFE STORAGE & SAVE SYSTEM ---
const DEFAULT_SAVE = {
  shards: 0,
  equippedWeapon: 'pulse',
  unlockedWeapons: ['pulse'],
  equippedSkin: 'cobalt',
  unlockedSkins: ['cobalt'],
  skills: {}
};

let SaveData = JSON.parse(JSON.stringify(DEFAULT_SAVE));
try {
  const raw = localStorage.getItem('abyssal3d_save');
  if (raw) {
    const parsed = JSON.parse(raw);
    SaveData = { ...DEFAULT_SAVE, ...parsed, skills: parsed.skills || {} };
  }
} catch (e) {}

function saveGame() {
  try {
    localStorage.setItem('abyssal3d_save', JSON.stringify(SaveData));
  } catch (e) {}
}

// --- 2. WEAPONS, SKINS & SKILL TREE CATALOGS ---
const WEAPONS = [
  { id: 'pulse', name: 'Pulse Rifle', cost: 0, desc: 'Balanced rapid-fire plasma carbine.', damage: 18, fireRate: 210, multishot: 1, spread: 0.08, pierce: 0, speed: 24, color: 0xffeaa7 },
  { id: 'scatter', name: 'Hellfire Scattergun', cost: 150, desc: 'Fires a wide 5-pellet blast at close range.', damage: 11, fireRate: 520, multishot: 5, spread: 0.14, pierce: 0, speed: 21, color: 0xff6b22 },
  { id: 'rail', name: 'Hyperion Rail Lance', cost: 350, desc: 'High-velocity piercing beam that penetrates foes.', damage: 46, fireRate: 640, multishot: 1, spread: 0.02, pierce: 3, speed: 36, color: 0x00f2fe },
  { id: 'smg', name: 'Aether Twin-SMGs', cost: 600, desc: 'Extreme fire rate dual-stream with slight spread.', damage: 10, fireRate: 105, multishot: 2, spread: 0.16, pierce: 0, speed: 25, color: 0xa55eea }
];

const SKINS = [
  { id: 'cobalt', name: 'Cobalt Vanguard', cost: 0, hex: '#1e5799', stripe: '#00f2fe', light: 0x3898ff },
  { id: 'crimson', name: 'Crimson Reaper', cost: 120, hex: '#8e1b26', stripe: '#ff4757', light: 0xff4757 },
  { id: 'emerald', name: 'Venom Stalker', cost: 250, hex: '#1b6e42', stripe: '#2ed573', light: 0x2ed573 },
  { id: 'solar', name: 'Solar Warden', cost: 450, hex: '#b36b00', stripe: '#ffa502', light: 0xffa502 },
  { id: 'void', name: 'Void Sovereign', cost: 800, hex: '#3c1e5c', stripe: '#d6a2e8', light: 0xa55eea }
];

const SKILL_TREE = {
  Offense: [
    { id: 'off1', name: 'Sharpened Rounds', max: 5, cost: 60, req: null, desc: '+8% Base Damage per rank' },
    { id: 'off2', name: 'Hair Trigger', max: 5, cost: 100, req: 'off1', desc: '+6% Fire Rate per rank' },
    { id: 'off3', name: 'Lethal Precision', max: 3, cost: 180, req: 'off2', desc: '+5% Crit Chance per rank' }
  ],
  Defense: [
    { id: 'def1', name: 'Reinforced Plating', max: 5, cost: 60, req: null, desc: '+15 Max HP per rank' },
    { id: 'def2', name: 'Soul Siphon', max: 3, cost: 120, req: 'def1', desc: '+1 HP healed every 8 kills' },
    { id: 'def3', name: 'Aegis Core', max: 3, cost: 200, req: 'def2', desc: '+12% Invulnerability duration' }
  ],
  Utility: [
    { id: 'utl1', name: 'Servo Thrusters', max: 5, cost: 60, req: null, desc: '+5% Move Speed per rank' },
    { id: 'utl2', name: 'Phase Capacitor', max: 4, cost: 110, req: 'utl1', desc: '-8% Dash Cooldown per rank' },
    { id: 'utl3', name: 'Soul Harvester', max: 3, cost: 180, req: 'utl2', desc: '+15% Soul Shards earned' }
  ]
};

function getSkillRank(id) {
  return SaveData.skills[id] || 0;
}

// --- 3. SANCTUARY HUB MENU UI ---
function renderHub() {
  const shardEl = document.getElementById('shardCount');
  if (shardEl) shardEl.innerText = SaveData.shards;

  // Render Weapons
  const wGrid = document.getElementById('weaponGrid');
  if (wGrid) {
    wGrid.innerHTML = '';
    WEAPONS.forEach(w => {
      const unlocked = SaveData.unlockedWeapons.includes(w.id);
      const equipped = SaveData.equippedWeapon === w.id;
      const card = document.createElement('div');
      card.className = 'select-card' + (equipped ? ' equipped' : (!unlocked ? ' locked' : ''));
      card.innerHTML = `
        <h4>${w.name}</h4>
        <p>${w.desc}</p>
        <div class="card-status">${equipped ? 'EQUIPPED' : unlocked ? 'CLICK TO EQUIP' : 'UNLOCK: ' + w.cost + ' SHARDS'}</div>
      `;
      card.onclick = () => {
        if (unlocked) {
          SaveData.equippedWeapon = w.id;
          saveGame();
          renderHub();
        } else if (SaveData.shards >= w.cost) {
          SaveData.shards -= w.cost;
          SaveData.unlockedWeapons.push(w.id);
          SaveData.equippedWeapon = w.id;
          saveGame();
          renderHub();
        }
      };
      wGrid.appendChild(card);
    });
  }

  // Render Skins
  const sGrid = document.getElementById('skinGrid');
  if (sGrid) {
    sGrid.innerHTML = '';
    SKINS.forEach(s => {
      const unlocked = SaveData.unlockedSkins.includes(s.id);
      const equipped = SaveData.equippedSkin === s.id;
      const card = document.createElement('div');
      card.className = 'select-card' + (equipped ? ' equipped' : (!unlocked ? ' locked' : ''));
      card.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span style="width:16px;height:16px;border-radius:50%;background:${s.hex};border:2px solid ${s.stripe};display:inline-block;"></span>
          <h4 style="margin:0;">${s.name}</h4>
        </div>
        <div class="card-status">${equipped ? 'EQUIPPED' : unlocked ? 'CLICK TO EQUIP' : 'UNLOCK: ' + s.cost + ' SHARDS'}</div>
      `;
      card.onclick = () => {
        if (unlocked) {
          SaveData.equippedSkin = s.id;
          saveGame();
          renderHub();
        } else if (SaveData.shards >= s.cost) {
          SaveData.shards -= s.cost;
          SaveData.unlockedSkins.push(s.id);
          SaveData.equippedSkin = s.id;
          saveGame();
          renderHub();
        }
      };
      sGrid.appendChild(card);
    });
  }

  // Render Skill Tree
  const treeContainer = document.getElementById('skillTreeContainer');
  if (treeContainer) {
    treeContainer.innerHTML = '';
    Object.keys(SKILL_TREE).forEach(branchName => {
      const col = document.createElement('div');
      col.className = 'branch-col';
      col.innerHTML = `<h4>${branchName}</h4>`;
      SKILL_TREE[branchName].forEach(node => {
        const rank = getSkillRank(node.id);
        const reqMet = !node.req || getSkillRank(node.req) > 0;
        const cost = Math.floor(node.cost * Math.pow(1.4, rank));
        const maxed = rank >= node.max;
        const div = document.createElement('div');
        div.className = 'skill-node' + (maxed ? ' maxed' : (!reqMet ? ' locked-node' : ''));
        div.innerHTML = `
          <div style="display:flex;justify-content:space-between;font-weight:bold;color:#70a1ff;">
            <span>${node.name}</span>
            <span>${rank}/${node.max}</span>
          </div>
          <p style="font-size:0.85rem;color:#ced6e0;margin:4px 0;">${node.desc}</p>
          <div style="font-size:0.8rem;color:#ffa502;font-weight:bold;">
            ${maxed ? 'MAXED OUT' : (!reqMet ? 'REQUIRES PREVIOUS NODE' : 'UPGRADE: ' + cost + ' SHARDS')}
          </div>
        `;
        div.onclick = () => {
          if (reqMet && !maxed && SaveData.shards >= cost) {
            SaveData.shards -= cost;
            SaveData.skills[node.id] = rank + 1;
            saveGame();
            renderHub();
          }
        };
        col.appendChild(div);
      });
      treeContainer.appendChild(col);
    });
  }
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => { c.classList.remove('active'); c.classList.add('hidden'); });
    btn.classList.add('active');
    const target = document.getElementById(btn.dataset.tab);
    if (target) { target.classList.remove('hidden'); target.classList.add('active'); }
  };
});

// --- 4. AUDIO SYNTHESIZER ---
const AudioSys = {
  ctx: null,
  init() {
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) {}
  },
  play(freq, type, duration, vol = 0.08, slide = 0) {
    if (!this.ctx) return;
    try {
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
    } catch (e) {}
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

// --- 5. PROCEDURAL TEXTURES ---
const TextureFactory = {
  createFloorTextures() {
    const size = 512;
    const diffCanvas = document.createElement('canvas');
    const bumpCanvas = document.createElement('canvas');
    diffCanvas.width = bumpCanvas.width = size;
    diffCanvas.height = bumpCanvas.height = size;
    const dCtx = diffCanvas.getContext('2d');
    const bCtx = bumpCanvas.getContext('2d');

    dCtx.fillStyle = '#0c0c14';
    dCtx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#151515';
    bCtx.fillRect(0, 0, size, size);

    const step = size / 4;
    for (let gx = 0; gx < 4; gx++) {
      for (let gy = 0; gy < 4; gy++) {
        const x = gx * step + 5, y = gy * step + 5, w = step - 10, h = step - 10;
        const shade = 24 + Math.floor(Math.random() * 12);
        dCtx.fillStyle = `rgb(${shade}, ${shade + 2}, ${shade + 14})`;
        dCtx.fillRect(x, y, w, h);
        bCtx.fillStyle = '#b5b5b5';
        bCtx.fillRect(x, y, w, h);
      }
    }
    const map = new THREE.CanvasTexture(diffCanvas);
    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    map.wrapS = map.wrapT = bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
    map.repeat.set(9, 9);
    bumpMap.repeat.set(9, 9);
    return { map, bumpMap };
  },
  createArmorTexture(baseHex, stripeHex) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = stripeHex;
    ctx.fillRect(0, size * 0.44, size, 12);
    return new THREE.CanvasTexture(canvas);
  },
  createEnemyTexture(hexColor) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = hexColor;
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.2)';
      ctx.fillRect(Math.random() * size, Math.random() * size, 4, 4);
    }
    return new THREE.CanvasTexture(canvas);
  }
};

// --- 6. THREE.JS 3D ISOMETRIC SCENE ---
const mount = document.getElementById('canvasMount');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x08080e);
scene.fog = new THREE.Fog(0x08080e, 34, 72);

const frustumSize = 26;
let aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
  -frustumSize * aspect / 2, frustumSize * aspect / 2,
  frustumSize / 2, -frustumSize / 2, 0.1, 100
);
const camOffset = new THREE.Vector3(18, 18, 18);
camera.position.copy(camOffset);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
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

scene.add(new THREE.AmbientLight(0x505070, 1.3));
const dirLight = new THREE.DirectionalLight(0xdce6ff, 1.1);
dirLight.position.set(15, 28, 12);
dirLight.castShadow = true;
scene.add(dirLight);

const playerLight = new THREE.PointLight(0x3898ff, 1.6, 15);
scene.add(playerLight);

const ARENA_HALF = 18;
const floorTex = TextureFactory.createFloorTextures();
const floorMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(ARENA_HALF * 2, ARENA_HALF * 2),
  new THREE.MeshStandardMaterial({ map: floorTex.map, bumpMap: floorTex.bumpMap, bumpScale: 0.12, roughness: 0.8 })
);
floorMesh.rotation.x = -Math.PI / 2;
floorMesh.receiveShadow = true;
scene.add(floorMesh);

const wallMat = new THREE.MeshStandardMaterial({ color: 0x2c2c40, roughness: 0.7 });
const pillars = [{ x: -7, z: -7, r: 1.3 }, { x: 7, z: -7, r: 1.3 }, { x: -7, z: 7, r: 1.3 }, { x: 7, z: 7, r: 1.3 }];
pillars.forEach(p => {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(p.r, p.r, 3.2, 10), wallMat);
  mesh.position.set(p.x, 1.6, p.z);
  mesh.castShadow = true;
  scene.add(mesh);
});

const enemyTextures = {
  grunt: TextureFactory.createEnemyTexture('#26a65b'),
  rusher: TextureFactory.createEnemyTexture('#e84393'),
  shooter: TextureFactory.createEnemyTexture('#e67e22'),
  tank: TextureFactory.createEnemyTexture('#8e44ad'),
  boss: TextureFactory.createEnemyTexture('#c0392b')
};

// --- 7. GAMEPLAY & CONTROLS ---
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

let state = 'MENU';
let wave = 1, kills = 0, spawnTimer = 0, enemiesToSpawn = 0, screenShake = 0, bannerTimer = 0;
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

let player, playerMesh, bullets = [], enemyBullets = [], enemies = [], gems = [], particles = [];

const RUN_UPGRADES = [
  { tag: 'Offense', name: 'Hollow Points', desc: '+25% Bullet Damage.', apply: p => p.damage *= 1.25 },
  { tag: 'Offense', name: 'Overclocked Trigger', desc: '+22% Fire Rate.', apply: p => p.fireRate *= 0.78 },
  { tag: 'Weapon', name: 'Split Chamber', desc: '+1 Projectile per shot.', apply: p => p.multishot += 1 },
  { tag: 'Weapon', name: 'Rail Slugs', desc: 'Bullets pierce +1 enemy.', apply: p => p.pierce += 1 },
  { tag: 'Mobility', name: 'Adrenaline Boots', desc: '+15% Movement Speed.', apply: p => p.speed *= 1.15 },
  { tag: 'Survival', name: 'Vitality Surge', desc: '+35 Max HP and heal 35 HP.', apply: p => { p.maxHp += 35; p.hp = Math.min(p.maxHp, p.hp + 35); } }
];

function clearArena() {
  [...bullets, ...enemyBullets, ...enemies, ...gems, ...particles].forEach(o => { if (o.mesh) scene.remove(o.mesh); });
  bullets = []; enemyBullets = []; enemies = []; gems = []; particles = [];
  if (playerMesh) scene.remove(playerMesh);
}

function startGame() {
  AudioSys.init();
  clearArena();

  document.getElementById('sanctuaryMenu').classList.add('hidden');
  document.getElementById('gameOverScreen').classList.add('hidden');
  document.getElementById('upgradeScreen').classList.add('hidden');
  document.getElementById('bossHud').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');

  const weapon = WEAPONS.find(w => w.id === SaveData.equippedWeapon) || WEAPONS[0];
  const skin = SKINS.find(s => s.id === SaveData.equippedSkin) || SKINS[0];

  const armorTex = TextureFactory.createArmorTexture(skin.hex, skin.stripe);
  playerMesh = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.55, 1.4, 16),
    new THREE.MeshStandardMaterial({ map: armorTex, roughness: 0.35 })
  );
  body.position.y = 0.7;
  body.castShadow = true;

  const gun = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.24, 0.95),
    new THREE.MeshStandardMaterial({ color: 0x555566 })
  );
  gun.position.set(0.48, 0.85, 0.45);
  playerMesh.add(body, gun);
  scene.add(playerMesh);

  playerLight.color.setHex(skin.light);

  const maxHp = 100 + getSkillRank('def1') * 15;
  player = {
    x: 0, z: 0, r: 0.6,
    hp: maxHp, maxHp: maxHp,
    speed: 8.5 * (1 + getSkillRank('utl1') * 0.05),
    damage: weapon.damage * (1 + getSkillRank('off1') * 0.08),
    bulletSpeed: weapon.speed,
    bulletColor: weapon.color,
    fireRate: weapon.fireRate * Math.pow(0.94, getSkillRank('off2')),
    lastShot: 0,
    multishot: weapon.multishot,
    spread: weapon.spread,
    pierce: weapon.pierce,
    critChance: 0.08 + getSkillRank('off3') * 0.05,
    critMult: 2.0,
    vamp: getSkillRank('def2'),
    invulnMult: 1 + getSkillRank('def3') * 0.12,
    xp: 0, xpNext: 50, lvl: 1,
    dashCd: 0,
    dashCdMax: 1350 * Math.pow(0.92, getSkillRank('utl2')),
    dashTime: 0, dashDir: { x: 0, z: 0 }, invuln: 0
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
    enemiesToSpawn = Math.floor(wave * 1.2);
  } else {
    enemiesToSpawn = 6 + Math.floor(wave * 3.0);
  }
}

function getMoveInput() {
  let forward = (keys['KeyW'] || keys['ArrowUp'] ? 1 : 0) - (keys['KeyS'] || keys['ArrowDown'] ? 1 : 0);
  let right = (keys['KeyD'] || keys['ArrowRight'] ? 1 : 0) - (keys['KeyA'] || keys['ArrowLeft'] ? 1 : 0);
  if (forward === 0 && right === 0) return { x: 0, z: 0 };
  let dx = (-forward + right), dz = (-forward - right);
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
    player.invuln = 260 * player.invulnMult;
    player.dashCd = player.dashCdMax;
  }
}

function resolvePillarCollision(entity) {
  for (const p of pillars) {
    const dx = entity.x - p.x, dz = entity.z - p.z;
    const dist = Math.hypot(dx, dz);
    if (dist < entity.r + p.r && dist > 0) {
      entity.x = p.x + (dx / dist) * (entity.r + p.r);
      entity.z = p.z + (dz / dist) * (entity.r + p.r);
    }
  }
  entity.x = Math.max(-ARENA_HALF + entity.r, Math.min(ARENA_HALF - entity.r, entity.x));
  entity.z = Math.max(-ARENA_HALF + entity.r, Math.min(ARENA_HALF - entity.r, entity.z));
}

function spawnEnemy() {
  let x, z;
  if (Math.random() < 0.5) {
    x = Math.random() < 0.5 ? -ARENA_HALF + 1 : ARENA_HALF - 1;
    z = (Math.random() * 2 - 1) * (ARENA_HALF - 1);
  } else {
    x = (Math.random() * 2 - 1) * (ARENA_HALF - 1);
    z = Math.random() < 0.5 ? -ARENA_HALF + 1 : ARENA_HALF - 1;
  }

  const scale = 1 + (wave - 1) * 0.2;
  const roll = Math.random();
  const type = wave >= 4 && roll < 0.25 ? 'tank' :
               wave >= 2 && roll < 0.55 ? 'shooter' :
               wave >= 2 && roll < 0.78 ? 'rusher' : 'grunt';

  const cfgs = {
    grunt:   { r: 0.55, h: 1.2, hp: 34 * scale,  speed: 4.5 + wave * 0.08, xp: 12 },
    rusher:  { r: 0.42, h: 0.9, hp: 20 * scale,  speed: 7.8 + wave * 0.1,  xp: 15 },
    shooter: { r: 0.6,  h: 1.4, hp: 38 * scale,  speed: 3.8,               xp: 24, shootCd: 1400 },
    tank:    { r: 0.95, h: 1.9, hp: 125 * scale, speed: 2.6,               xp: 38 }
  };
  const cfg = cfgs[type];
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.r * 1.7, cfg.h, cfg.r * 1.7),
    new THREE.MeshStandardMaterial({ map: enemyTextures[type] })
  );
  mesh.position.set(x, cfg.h / 2, z);
  mesh.castShadow = true;
  scene.add(mesh);
  enemies.push({ type, x, z, maxHp: cfg.hp, mesh, ...cfg });
}

function spawnBoss() {
  const scale = 1 + (wave / 5 - 1) * 0.75;
  document.getElementById('bossName').innerText = `WARDEN OF ASH (WAVE ${wave})`;
  document.getElementById('bossHud').classList.remove('hidden');

  const mesh = new THREE.Mesh(
    new THREE.DodecahedronGeometry(1.7),
    new THREE.MeshStandardMaterial({ map: enemyTextures.boss, emissive: 0x330000 })
  );
  mesh.position.set(0, 1.7, -ARENA_HALF + 2);
  mesh.castShadow = true;
  scene.add(mesh);

  enemies.push({
    type: 'boss', x: 0, z: -ARENA_HALF + 2, r: 1.6,
    hp: 1100 * scale, maxHp: 1100 * scale, speed: 3.0, xp: 300, shootCd: 1100, pattern: 0, mesh
  });
}

function showUpgradeMenu() {
  AudioSys.levelup();
  state = 'UPGRADE';
  const container = document.getElementById('upgradeCards');
  container.innerHTML = '';
  const picks = [...RUN_UPGRADES].sort(() => 0.5 - Math.random()).slice(0, 3);
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

  const shakeX = (Math.random() - 0.5) * screenShake;
  const shakeZ = (Math.random() - 0.5) * screenShake;
  camera.position.lerp(new THREE.Vector3(player.x + camOffset.x + shakeX, camOffset.y, player.z + camOffset.z + shakeZ), 0.12);
  camera.lookAt(player.x + shakeX, 0, player.z + shakeZ);

  raycaster.setFromCamera(mouseNDC, camera);
  if (raycaster.ray.intersectPlane(aimPlane, aimPoint)) {
    reticleMesh.position.set(aimPoint.x, 0.05, aimPoint.z);
    playerMesh.rotation.y = Math.atan2(aimPoint.x - player.x, aimPoint.z - player.z);
  }

  if (mouseDown && now - player.lastShot > player.fireRate) {
    player.lastShot = now;
    AudioSys.shoot();
    const baseAngle = Math.atan2(aimPoint.z - player.z, aimPoint.x - player.x);
    const bGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const bMat = new THREE.MeshBasicMaterial({ color: player.bulletColor });

    for (let i = 0; i < player.multishot; i++) {
      const a = baseAngle + (i - (player.multishot - 1) / 2) * player.spread;
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
      scene.remove(b.mesh);
      bullets.splice(i, 1);
      continue;
    }

    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (!b.hitList.includes(e) && Math.hypot(b.x - e.x, b.z - e.z) < b.r + e.r) {
        const isCrit = Math.random() < player.critChance;
        e.hp -= Math.round(player.damage * (isCrit ? player.critMult : 1));
        b.hitList.push(e);
        AudioSys.hit();

        if (e.hp <= 0) {
          kills++;
          AudioSys.kill();
          if (player.vamp > 0 && kills % 8 === 0) {
            player.hp = Math.min(player.maxHp, player.hp + player.vamp);
          }
          if (e.type === 'boss') document.getElementById('bossHud').classList.add('hidden');
          const gemMesh = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.28),
            new THREE.MeshBasicMaterial({ color: 0x00f2fe })
          );
          gemMesh.position.set(e.x, 0.45, e.z);
          scene.add(gemMesh);
          gems.push({ x: e.x, z: e.z, val: e.xp, mesh: gemMesh });
          scene.remove(e.mesh);
          enemies.splice(j, 1);
        }

        if (b.pierce > 0) b.pierce--;
        else {
          scene.remove(b.mesh);
          bullets.splice(i, 1);
          break;
        }
      }
    }
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const dist = Math.hypot(player.x - e.x, player.z - e.z);
    const angle = Math.atan2(player.z - e.z, player.x - e.x);

    if (e.type === 'shooter') {
      if (dist > 10) { e.x += Math.cos(angle) * e.speed * dt; e.z += Math.sin(angle) * e.speed * dt; }
      e.shootCd -= dtMs;
      if (e.shootCd <= 0) {
        e.shootCd = Math.max(850, 1950 - wave * 40);
        spawnEnemyBullet(e.x, e.z, Math.cos(angle) * 11, Math.sin(angle) * 11, 12 + wave);
      }
    } else if (e.type === 'boss') {
      e.x += Math.cos(angle) * e.speed * dt;
      e.z += Math.sin(angle) * e.speed * dt;
      e.mesh.rotation.y += dt * 2;
      document.getElementById('bossBar').style.width = Math.max(0, (e.hp / e.maxHp) * 100) + '%';
      e.shootCd -= dtMs;
      if (e.shootCd <= 0) {
        e.shootCd = 1350;
        const count = 14 + Math.floor(wave / 5) * 3;
        for (let k = 0; k < count; k++) {
          const a = (Math.PI * 2 / count) * k;
          spawnEnemyBullet(e.x, e.z, Math.cos(a) * 10, Math.sin(a) * 10, 15 + wave);
        }
      }
    } else {
      e.x += Math.cos(angle) * e.speed * dt;
      e.z += Math.sin(angle) * e.speed * dt;
    }

    resolvePillarCollision(e);
    e.mesh.position.x = e.x;
    e.mesh.position.z = e.z;

    if (dist < player.r + e.r && player.invuln <= 0) {
      player.hp -= (e.type === 'boss' ? 24 : 12 + Math.floor(wave * 0.8));
      player.invuln = 650 * player.invulnMult;
      screenShake = 0.6;
      AudioSys.hurt();
    }
  }

  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const eb = enemyBullets[i];
    eb.x += eb.vx * dt;
    eb.z += eb.vz * dt;
    eb.mesh.position.set(eb.x, 0.8, eb.z);

    if (Math.abs(eb.x) > ARENA_HALF || Math.abs(eb.z) > ARENA_HALF) {
      scene.remove(eb.mesh);
      enemyBullets.splice(i, 1);
      continue;
    }
    if (Math.hypot(eb.x - player.x, eb.z - player.z) < eb.r + player.r) {
      if (player.invuln <= 0) {
        player.hp -= eb.dmg;
        player.invuln = 550 * player.invulnMult;
        screenShake = 0.5;
        AudioSys.hurt();
      }
      scene.remove(eb.mesh);
      enemyBullets.splice(i, 1);
    }
  }

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

  document.getElementById('hpText').innerText = `${Math.max(0, Math.ceil(player.hp))}/${player.maxHp}`;
  document.getElementById('hpBar').style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;
  document.getElementById('lvlText').innerText = player.lvl;
  document.getElementById('xpBar').style.width = `${(player.xp / player.xpNext) * 100}%`;
  document.getElementById('killText').innerText = kills;
  document.getElementById('dashText').innerText = player.dashCd <= 0 ? 'READY' : (player.dashCd / 1000).toFixed(1) + 's';

  if (player.hp <= 0) {
    state = 'GAMEOVER';
    document.getElementById('hud').classList.add('hidden');
    const shardBonus = 1 + getSkillRank('utl3') * 0.15;
    const earned = Math.floor((kills * 2 + wave * 15) * shardBonus);
    SaveData.shards += earned;
    saveGame();
    document.getElementById('deathStats').innerText = `Reached Wave ${wave} | Level ${player.lvl} | Kills: ${kills}`;
    document.getElementById('earnedShardsText').innerText = earned;
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

// Button Bindings & Initial Hub Render
document.getElementById('startBtn').onclick = startGame;
document.getElementById('returnHubBtn').onclick = () => {
  document.getElementById('gameOverScreen').classList.add('hidden');
  document.getElementById('sanctuaryMenu').classList.remove('hidden');
  renderHub();
};

renderHub();
