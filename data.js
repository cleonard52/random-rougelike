// --- Persistent Save System (localStorage) ---
const DEFAULT_SAVE = {
  shards: 0,
  highestWave: 1,
  unlockedWeapons: ['pulse_rifle'],
  equippedWeapon: 'pulse_rifle',
  unlockedSkins: ['cobalt'],
  equippedSkin: 'cobalt',
  skills: {} // e.g., { off_1: 2, def_1: 1 }
};

let SaveData = JSON.parse(localStorage.getItem('abyssal3DSave')) || JSON.parse(JSON.stringify(DEFAULT_SAVE));

function saveProgress() {
  localStorage.setItem('abyssal3DSave', JSON.stringify(SaveData));
}

// --- Unlockable Primary Weapons ---
const WEAPONS = [
  {
    id: 'pulse_rifle',
    name: 'Vanguard Pulse Rifle',
    cost: 0,
    desc: 'Balanced automatic energy carbine with steady accuracy and reliable fire rate.',
    stats: { damage: 18, fireRate: 210, multishot: 1, spread: 0.08, bulletSpeed: 24, pierce: 0, color: 0xffeaa7 }
  },
  {
    id: 'hellfire_shotgun',
    name: 'Hellfire Scattergun',
    cost: 120,
    desc: 'Fires 5 blazing pellets in a wide cone. Devastating at close range.',
    stats: { damage: 11, fireRate: 520, multishot: 5, spread: 0.14, bulletSpeed: 21, pierce: 0, color: 0xff7675 }
  },
  {
    id: 'rail_lance',
    name: 'Hyperion Rail Lance',
    cost: 250,
    desc: 'High-velocity magnetic slug that pierces through up to 3 enemies.',
    stats: { damage: 46, fireRate: 580, multishot: 1, spread: 0.02, bulletSpeed: 36, pierce: 3, color: 0x74b9ff }
  },
  {
    id: 'void_swarm',
    name: 'Aether Twin-SMGs',
    cost: 400,
    desc: 'Extreme fire rate dual barrels that shred crowds in a rapid bullet storm.',
    stats: { damage: 10, fireRate: 95, multishot: 2, spread: 0.16, bulletSpeed: 23, pierce: 0, color: 0xa29bfe }
  }
];

// --- Unlockable 3D Exosuit Skins ---
const SKINS = [
  {
    id: 'cobalt',
    name: 'Cobalt Vanguard',
    cost: 0,
    bodyHex: '#1e5799',
    stripeHex: '#00f2fe',
    visorHex: 0x00ffff,
    lightHex: 0x3898ff
  },
  {
    id: 'crimson',
    name: 'Crimson Reaper',
    cost: 100,
    bodyHex: '#7f1d1d',
    stripeHex: '#ff4757',
    visorHex: 0xff4757,
    lightHex: 0xff4757
  },
  {
    id: 'emerald',
    name: 'Venom Stalker',
    cost: 180,
    bodyHex: '#14532d',
    stripeHex: '#2ed573',
    visorHex: 0x7bed9f,
    lightHex: 0x2ed573
  },
  {
    id: 'solar',
    name: 'Solar Archon',
    cost: 320,
    bodyHex: '#78350f',
    stripeHex: '#ffa502',
    visorHex: 0xffeaa7,
    lightHex: 0xffa502
  },
  {
    id: 'void',
    name: 'Abyssal Phantom',
    cost: 500,
    bodyHex: '#2e1065',
    stripeHex: '#e056fd',
    visorHex: 0xe056fd,
    lightHex: 0xbe2edd
  }
];

// --- Branching Permanent Skill Tree (3 Branches, 3 Tiers Each) ---
const SKILL_TREE = {
  Offense: [
    { id: 'off_1', tier: 1, name: 'Kinetic Calibration', maxRank: 5, baseCost: 40, costStep: 30, req: null, desc: '+8% Base Weapon Damage per rank.' },
    { id: 'off_2', tier: 2, name: 'Deadeye Optics', maxRank: 5, baseCost: 75, costStep: 45, req: 'off_1', desc: '+4% Critical Hit Chance per rank.' },
    { id: 'off_3', tier: 3, name: 'Overdrive Core', maxRank: 3, baseCost: 150, costStep: 100, req: 'off_2', desc: '+10% Attack Speed & +15% Crit Damage per rank.' }
  ],
  Defense: [
    { id: 'def_1', tier: 1, name: 'Reinforced Plating', maxRank: 5, baseCost: 40, costStep: 30, req: null, desc: '+20 Starting Max HP per rank.' },
    { id: 'def_2', tier: 2, name: 'Nanite Weave', maxRank: 4, baseCost: 80, costStep: 50, req: 'def_1', desc: 'Regenerate +1 HP every 5 seconds per rank.' },
    { id: 'def_3', tier: 3, name: 'Aegis Capacitor', maxRank: 3, baseCost: 160, costStep: 110, req: 'def_2', desc: '+15% Invulnerability duration after taking hits or dashing.' }
  ],
  Utility: [
    { id: 'uti_1', tier: 1, name: 'Thruster Boosters', maxRank: 5, baseCost: 40, costStep: 30, req: null, desc: '+5% Movement Speed per rank.' },
    { id: 'uti_2', tier: 2, name: 'Phase Conduit', maxRank: 4, baseCost: 75, costStep: 45, req: 'uti_1', desc: '-8% Dash Cooldown per rank.' },
    { id: 'uti_3', tier: 3, name: 'Soul Harvester', maxRank: 5, baseCost: 120, costStep: 80, req: 'uti_2', desc: '+15% Soul Shards & +10% XP gained per rank.' }
  ]
};

function getSkillRank(id) {
  return SaveData.skills[id] || 0;
}

function getSkillCost(node) {
  const rank = getSkillRank(node.id);
  return node.baseCost + rank * node.costStep;
}

function isSkillUnlocked(node) {
  if (!node.req) return true;
  return getSkillRank(node.req) >= 1;
}

// --- Sanctuary Hub UI Renderer & Event Wiring ---
function renderSanctuaryUI() {
  document.getElementById('shardCount').innerText = SaveData.shards;

  // Render Weapons
  const weaponGrid = document.getElementById('weaponGrid');
  weaponGrid.innerHTML = '';
  WEAPONS.forEach(w => {
    const unlocked = SaveData.unlockedWeapons.includes(w.id);
    const equipped = SaveData.equippedWeapon === w.id;
    const card = document.createElement('div');
    card.className = `select-card ${equipped ? 'equipped' : ''} ${!unlocked ? 'locked' : ''}`;
    card.innerHTML = `
      <div class="card-top">
        <h4>${w.name}</h4>
        <span class="badge ${equipped ? 'badge-eq' : unlocked ? 'badge-own' : 'badge-cost'}">
          ${equipped ? 'EQUIPPED' : unlocked ? 'OWNED' : `${w.cost} SHARDS`}
        </span>
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

  // Render Skins
  const skinGrid = document.getElementById('skinGrid');
  skinGrid.innerHTML = '';
  SKINS.forEach(s => {
    const unlocked = SaveData.unlockedSkins.includes(s.id);
    const equipped = SaveData.equippedSkin === s.id;
    const card = document.createElement('div');
    card.className = `select-card skin-card ${equipped ? 'equipped' : ''} ${!unlocked ? 'locked' : ''}`;
    card.innerHTML = `
      <div class="skin-swatch" style="background: linear-gradient(135deg, ${s.bodyHex} 60%, ${s.stripeHex} 100%);"></div>
      <div class="skin-info">
        <h4>${s.name}</h4>
        <span class="badge ${equipped ? 'badge-eq' : unlocked ? 'badge-own' : 'badge-cost'}">
          ${equipped ? 'EQUIPPED' : unlocked ? 'OWNED' : `${s.cost} SHARDS`}
        </span>
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

  // Render Branching Skill Tree
  const treeContainer = document.getElementById('skillTreeContainer');
  treeContainer.innerHTML = '';
  Object.entries(SKILL_TREE).forEach(([branchName, nodes]) => {
    const col = document.createElement('div');
    col.className = 'branch-col';
    col.innerHTML = `<h4 class="branch-title">${branchName} Branch</h4>`;

    nodes.forEach((node, idx) => {
      const rank = getSkillRank(node.id);
      const maxed = rank >= node.maxRank;
      const available = isSkillUnlocked(node);
      const cost = getSkillCost(node);

      if (idx > 0) {
        const connector = document.createElement('div');
        connector.className = `tree-connector ${available ? 'active' : ''}`;
        col.appendChild(connector);
      }

      const nodeEl = document.createElement('div');
      nodeEl.className = `skill-node ${!available ? 'node-locked' : maxed ? 'node-maxed' : 'node-avail'}`;
      nodeEl.innerHTML = `
        <div class="node-header">
          <span class="node-name">${node.name}</span>
          <span class="node-rank">${rank}/${node.maxRank}</span>
        </div>
        <p class="node-desc">${node.desc}</p>
        <div class="node-footer">
          ${!available ? 'Requires Previous Tier' : maxed ? 'MAX RANK' : `Upgrade: ${cost} Shards`}
        </div>
      `;

      nodeEl.onclick = () => {
        if (available && !maxed && SaveData.shards >= cost) {
          SaveData.shards -= cost;
          SaveData.skills[node.id] = rank + 1;
          saveProgress();
          renderSanctuaryUI();
        }
      };
      col.appendChild(nodeEl);
    });

    treeContainer.appendChild(col);
  });
}

// Tab Switching Logic
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.remove('hidden');
  };
});

// Initialize Menu on Load
window.addEventListener('DOMContentLoaded', renderSanctuaryUI);
