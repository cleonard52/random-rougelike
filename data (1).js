// --- Persistent Save Data & Sanctuary Hub System ---
const DEFAULT_SAVE = {
  shards: 0,
  equippedWeapon: 'rifle',
  equippedSkin: 'cobalt',
  unlockedWeapons: ['rifle'],
  unlockedSkins: ['cobalt'],
  skills: {
    off_1: 0, off_2: 0, off_3: 0,
    def_1: 0, def_2: 0, def_3: 0,
    utl_1: 0, utl_2: 0, utl_3: 0
  }
};

let SaveData = Object.assign({}, DEFAULT_SAVE);
try {
  const raw = localStorage.getItem('abyssalSanctuarySave');
  if (raw) {
    const parsed = JSON.parse(raw);
    SaveData = Object.assign({}, DEFAULT_SAVE, parsed);
    SaveData.skills = Object.assign({}, DEFAULT_SAVE.skills, parsed.skills || {});
  }
} catch (e) {
  console.warn('Save load fallback:', e);
}

function saveProgress() {
  try {
    localStorage.setItem('abyssalSanctuarySave', JSON.stringify(SaveData));
  } catch (e) {
    console.warn('Save write error:', e);
  }
}

// --- Primary Weapons Catalog ---
const WEAPONS = [
  {
    id: 'rifle',
    name: 'Pulse Rifle',
    cost: 0,
    desc: 'Balanced automatic energy rifle with reliable accuracy and solid range.',
    stats: { damage: 18, fireRate: 210, multishot: 1, spread: 0.08, pierce: 0, bulletSpeed: 24, bulletColor: 0xffeaa7, bulletSize: 0.18 }
  },
  {
    id: 'shotgun',
    name: 'Hellfire Scattergun',
    cost: 120,
    desc: 'Fires a wide blast of 5 superheated pellets. Devastating at close range.',
    stats: { damage: 11, fireRate: 520, multishot: 5, spread: 0.16, pierce: 0, bulletSpeed: 21, bulletColor: 0xff6b22, bulletSize: 0.16 }
  },
  {
    id: 'railgun',
    name: 'Hyperion Rail Lance',
    cost: 250,
    desc: 'High-velocity piercing beam slug that punches through 3 enemies at once.',
    stats: { damage: 46, fireRate: 640, multishot: 1, spread: 0.02, pierce: 3, bulletSpeed: 36, bulletColor: 0x00f2fe, bulletSize: 0.24 }
  },
  {
    id: 'smg',
    name: 'Aether Twin-SMGs',
    cost: 400,
    desc: 'Blistering dual-barrel fire rate that shreds hordes when paired with crit upgrades.',
    stats: { damage: 10, fireRate: 105, multishot: 2, spread: 0.14, pierce: 0, bulletSpeed: 25, bulletColor: 0xa55eea, bulletSize: 0.15 }
  }
];

// --- Exosuit Skins Catalog ---
const SKINS = [
  { id: 'cobalt',   name: 'Cobalt Vanguard', cost: 0,   primary: '#1e5799', trim: '#00f2fe', visor: 0x00ffff, light: 0x3898ff },
  { id: 'crimson',  name: 'Crimson Reaper',  cost: 80,  primary: '#8e1c24', trim: '#ff4757', visor: 0xff4757, light: 0xff4757 },
  { id: 'emerald',  name: 'Venom Stalker',   cost: 150, primary: '#145a32', trim: '#2ed573', visor: 0x2ed573, light: 0x2ed573 },
  { id: 'obsidian', name: 'Obsidian Gold',   cost: 280, primary: '#1e1e26', trim: '#ffa502', visor: 0xffa502, light: 0xffa502 },
  { id: 'void',     name: 'Void Ascendant',  cost: 450, primary: '#3b1c54', trim: '#e056fd', visor: 0xe056fd, light: 0xbe2edd }
];

// --- 3-Branch Permanent Skill Tree ---
const SKILL_TREE = {
  offense: {
    title: 'Offense Branch',
    nodes: [
      { id: 'off_1', tier: 1, name: 'Kinetic Rounds', maxRank: 5, baseCost: 40, costStep: 30, req: null, desc: '+8% Base Weapon Damage per rank.' },
      { id: 'off_2', tier: 2, name: 'Lethal Precision', maxRank: 4, baseCost: 90, costStep: 50, req: 'off_1', desc: '+4% Base Critical Hit Chance per rank.' },
      { id: 'off_3', tier: 3, name: 'Overdrive Core', maxRank: 3, baseCost: 180, costStep: 90, req: 'off_2', desc: '+10% Base Fire Rate per rank.' }
    ]
  },
  defense: {
    title: 'Defense Branch',
    nodes: [
      { id: 'def_1', tier: 1, name: 'Titanium Plating', maxRank: 5, baseCost: 40, costStep: 30, req: null, desc: '+20 Starting Max HP per rank.' },
      { id: 'def_2', tier: 2, name: 'Aegis Capacitor', maxRank: 3, baseCost: 95, costStep: 55, req: 'def_1', desc: '+15% Longer Dash Invulnerability per rank.' },
      { id: 'def_3', tier: 3, name: 'Soul Siphon', maxRank: 3, baseCost: 190, costStep: 95, req: 'def_2', desc: 'Heal +2 HP every 10 kills per rank.' }
    ]
  },
  utility: {
    title: 'Utility Branch',
    nodes: [
      { id: 'utl_1', tier: 1, name: 'Thruster Boosters', maxRank: 5, baseCost: 40, costStep: 30, req: null, desc: '+5% Movement Speed per rank.' },
      { id: 'utl_2', tier: 2, name: 'Phase Recharge', maxRank: 4, baseCost: 85, costStep: 45, req: 'utl_1', desc: '-8% Dash Cooldown per rank.' },
      { id: 'utl_3', tier: 3, name: 'Soul Harvester', maxRank: 4, baseCost: 160, costStep: 80, req: 'utl_2', desc: '+15% Soul Shards & XP gained per rank.' }
    ]
  }
};

// --- Sanctuary Hub UI Renderer ---
function renderSanctuaryUI() {
  const shardEl = document.getElementById('shardCount');
  if (shardEl) shardEl.innerText = SaveData.shards;

  // Render Weapons
  const weaponGrid = document.getElementById('weaponGrid');
  if (weaponGrid) {
    weaponGrid.innerHTML = '';
    WEAPONS.forEach(w => {
      const unlocked = SaveData.unlockedWeapons.includes(w.id);
      const equipped = SaveData.equippedWeapon === w.id;
      const card = document.createElement('div');
      card.className = 'select-card' + (equipped ? ' equipped' : '') + (!unlocked ? ' locked' : '');
      card.innerHTML = `
        <div class="card-top">
          <strong>${w.name}</strong>
          <span class="badge">${equipped ? 'EQUIPPED' : unlocked ? 'OWNED' : w.cost + ' SHARDS'}</span>
        </div>
        <p>${w.desc}</p>
      `;
      card.onclick = () => {
        if (unlocked) {
          SaveData.equippedWeapon = w.id;
          saveProgress();
          renderSanctuaryUI();
        } else if (SaveData.shards >= w.cost) {
          SaveData.shards -= w.cost;
          SaveData.unlockedWeapons.push(w.id);
          SaveData.equippedWeapon = w.id;
          saveProgress();
          renderSanctuaryUI();
        }
      };
      weaponGrid.appendChild(card);
    });
  }

  // Render Skins
  const skinGrid = document.getElementById('skinGrid');
  if (skinGrid) {
    skinGrid.innerHTML = '';
    SKINS.forEach(s => {
      const unlocked = SaveData.unlockedSkins.includes(s.id);
      const equipped = SaveData.equippedSkin === s.id;
      const card = document.createElement('div');
      card.className = 'select-card' + (equipped ? ' equipped' : '') + (!unlocked ? ' locked' : '');
      card.innerHTML = `
        <div class="card-top">
          <span class="swatch" style="background:${s.primary}; border: 2px solid ${s.trim}; display:inline-block; width:14px; height:14px; border-radius:50%; margin-right:6px;"></span>
          <strong>${s.name}</strong>
          <span class="badge">${equipped ? 'EQUIPPED' : unlocked ? 'OWNED' : s.cost + ' SHARDS'}</span>
        </div>
      `;
      card.onclick = () => {
        if (unlocked) {
          SaveData.equippedSkin = s.id;
          saveProgress();
          renderSanctuaryUI();
        } else if (SaveData.shards >= s.cost) {
          SaveData.shards -= s.cost;
          SaveData.unlockedSkins.push(s.id);
          SaveData.equippedSkin = s.id;
          saveProgress();
          renderSanctuaryUI();
        }
      };
      skinGrid.appendChild(card);
    });
  }

  // Render Skill Tree
  const treeContainer = document.getElementById('skillTreeContainer');
  if (treeContainer) {
    treeContainer.innerHTML = '';
    Object.values(SKILL_TREE).forEach(branch => {
      const col = document.createElement('div');
      col.className = 'branch-col';
      col.innerHTML = `<h4>${branch.title}</h4>`;

      branch.nodes.forEach(node => {
        const rank = SaveData.skills[node.id] || 0;
        const reqMet = !node.req || (SaveData.skills[node.req] || 0) >= 1;
        const maxed = rank >= node.maxRank;
        const cost = node.baseCost + rank * node.costStep;

        const el = document.createElement('div');
        el.className = 'skill-node' + (!reqMet ? ' node-locked' : '') + (maxed ? ' node-maxed' : '');
        el.innerHTML = `
          <div class="node-header">
            <span>T${node.tier}: ${node.name}</span>
            <span>${rank}/${node.maxRank}</span>
          </div>
          <p>${node.desc}</p>
          <div class="node-footer">${!reqMet ? 'Requires Previous Tier' : maxed ? 'MAXED' : 'Upgrade: ' + cost + ' Shards'}</div>
        `;
        el.onclick = () => {
          if (reqMet && !maxed && SaveData.shards >= cost) {
            SaveData.shards -= cost;
            SaveData.skills[node.id] = rank + 1;
            saveProgress();
            renderSanctuaryUI();
          }
        };
        col.appendChild(el);
      });

      treeContainer.appendChild(col);
    });
  }
}

// Tab Switching Logic
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.remove('hidden');
    };
  });
  renderSanctuaryUI();
});
