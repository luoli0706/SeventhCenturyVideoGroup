const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreValue = document.getElementById("scoreValue");
const bestValue = document.getElementById("bestValue");
const nextFruitIcon = document.getElementById("nextFruitIcon");
const nextFruitName = document.getElementById("nextFruitName");
const restartBtn = document.getElementById("restartBtn");
const dropBtn = document.getElementById("dropBtn");
const overlay = document.getElementById("overlay");
const overlayBadge = document.getElementById("overlayBadge");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const overlayBtn = document.getElementById("overlayBtn");

const STORAGE_KEY = "suika-best-score";
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const WALL = 16;
const FLOOR = HEIGHT - 18;
const SPAWN_Y = 78;
const DANGER_LINE = 146;
const AIM_BOB = 8;
const FIXED_TIME = 1 / 60;

const FRUITS = [
  { name: "倚窗观梦", emoji: "倚", radius: 20, body: "#ffb45a", shadow: "#d77a20", stem: "#6e4723", leaf: "#52a548", imageSrc: "assets/yichuangguanmeng.jpg" },
  { name: "抹茶酥", emoji: "抹", radius: 28, body: "#a8d870", shadow: "#6d9e3a", stem: "#7c4b22", leaf: "#5fb942", imageSrc: "assets/mochasu.jpg" },
  { name: "咕咕机", emoji: "咕", radius: 35, body: "#7b98ff", shadow: "#3f5dc9", stem: "#654022", leaf: "#6ac25e", imageSrc: "assets/guguji.jpg" },
  { name: "苦难陈述者", emoji: "苦", radius: 43, body: "#9b8ecf", shadow: "#5c4e8a", stem: "#815326", leaf: "#4aaa4a", imageSrc: "assets/kunanchenshuzhe.jpg" },
  { name: "剑阁阁主", emoji: "剑", radius: 52, body: "#ffcc5c", shadow: "#c79a30", stem: "#70431f", leaf: "#55a83a", imageSrc: "assets/jiangegezhu.jpg" },
  { name: "柳苏", emoji: "柳", radius: 61, body: "#f3df95", shadow: "#c0ab62", stem: "#6c4e22", leaf: "#5aac46", imageSrc: "assets/liusu.jpg" },
  { name: "猫德", emoji: "猫", radius: 70, body: "#f3efff", shadow: "#9c8ecf", stem: "#744520", leaf: "#69bd5d", imageSrc: "assets/maode.jpg" },
  { name: "小绿", emoji: "小", radius: 80, body: "#8fdc8a", shadow: "#428a52", stem: "#6f4a22", leaf: "#4e9b52", imageSrc: "assets/xiaolv.jpg" },
  { name: "生煎包", emoji: "生", radius: 91, body: "#e7d1b8", shadow: "#9f806a", stem: "#6f5324", leaf: "#58ad50", imageSrc: "assets/shengjianbao.jpg" },
  { name: "字母哥", emoji: "字", radius: 104, body: "#f7d9e5", shadow: "#c489a4", stem: "#4a6a24", leaf: "#74cf63", imageSrc: "assets/zimuge.jpg" }
];

function readBestScore() {
  try {
    return Number(localStorage.getItem(STORAGE_KEY) || 0);
  } catch (error) {
    return 0;
  }
}

function writeBestScore(value) {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch (error) {
    // Some private browsing contexts block persistence. The game still works.
  }
}

function fillRoundRect(x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
}

const state = {
  fruits: [],
  particles: [],
  score: 0,
  best: readBestScore(),
  currentLevel: 0,
  nextLevel: 0,
  pointerX: WIDTH / 2,
  pointerTargetX: WIDTH / 2,
  canDrop: true,
  dropCooldown: 0,
  gameOver: false,
  dangerTimer: 0,
  flashTimer: 0,
  shake: 0,
  time: 0,
  spawnId: 1
};

let audioContext = null;
let lastFrame = 0;
let accumulator = 0;
const imageCache = new Map();
const FRUIT_SPAWN_WEIGHTS = [100, 45, 20, 9, 4, 2, 1, 0.5, 0.2, 0.1];
const TOTAL_FRUIT_WEIGHT = FRUIT_SPAWN_WEIGHTS.reduce((sum, weight) => sum + weight, 0);

function randomStartLevel() {
  let roll = Math.random() * TOTAL_FRUIT_WEIGHT;

  for (let index = 0; index < FRUIT_SPAWN_WEIGHTS.length; index += 1) {
    roll -= FRUIT_SPAWN_WEIGHTS[index];
    if (roll < 0) {
      return index;
    }
  }

  return FRUIT_SPAWN_WEIGHTS.length - 1;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function updateHud() {
  scoreValue.textContent = state.score;
  bestValue.textContent = state.best;

  const nextFruit = FRUITS[state.nextLevel];
  nextFruitIcon.textContent = nextFruit.imageSrc ? "" : nextFruit.emoji;
  nextFruitIcon.style.backgroundImage = nextFruit.imageSrc ? `url("${nextFruit.imageSrc}")` : "";
  nextFruitIcon.style.backgroundSize = nextFruit.imageSrc ? "cover" : "";
  nextFruitIcon.style.backgroundPosition = nextFruit.imageSrc ? "center" : "";
  nextFruitName.textContent = nextFruit.name;
}

function getFruitImage(fruit) {
  if (!fruit.imageSrc) return null;

  let image = imageCache.get(fruit.imageSrc);
  if (!image) {
    image = new Image();
    image.decoding = "async";
    image.src = fruit.imageSrc;
    imageCache.set(fruit.imageSrc, image);
  }

  if (!image.complete || image.naturalWidth === 0) {
    return null;
  }

  return image;
}

function drawFruitPortrait(image, x, y, radius) {
  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  const cropSize = Math.min(imageWidth, imageHeight);
  const cropX = (imageWidth - cropSize) / 2;
  const cropY = (imageHeight - cropSize) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(image, cropX, cropY, cropSize, cropSize, x - radius, y - radius, radius * 2, radius * 2);
  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = Math.max(2, radius * 0.09);
  ctx.beginPath();
  ctx.arc(x, y, radius - ctx.lineWidth * 0.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.arc(x - radius * 0.28, y - radius * 0.3, radius * 0.22, 0, Math.PI * 2);
  ctx.fill();
}

function saveBest() {
  if (state.score > state.best) {
    state.best = state.score;
    writeBestScore(state.best);
  }
}

function resetGame() {
  state.fruits = [];
  state.particles = [];
  state.score = 0;
  state.currentLevel = randomStartLevel();
  state.nextLevel = randomStartLevel();
  state.pointerX = WIDTH / 2;
  state.pointerTargetX = WIDTH / 2;
  state.canDrop = true;
  state.dropCooldown = 0;
  state.gameOver = false;
  state.dangerTimer = 0;
  state.flashTimer = 0;
  state.shake = 0;
  state.time = 0;
  state.spawnId = 1;
  overlay.classList.add("hidden");
  updateHud();
}

function createFruit(level, x, y, options = {}) {
  const fruitDef = FRUITS[level];
  return {
    id: state.spawnId++,
    level,
    x,
    y,
    vx: options.vx || 0,
    vy: options.vy || 0,
    radius: fruitDef.radius,
    age: 0,
    mergeLock: false
  };
}

function createBurst(x, y, baseColor, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 90 + Math.random() * 180;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 40,
      radius: 3 + Math.random() * 6,
      life: 0.45 + Math.random() * 0.4,
      maxLife: 0.8,
      color: baseColor
    });
  }
}

function unlockAudio() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (audioContext || !AudioCtor) return;
  audioContext = new AudioCtor();
}

function playTone(frequency, duration, type = "sine", volume = 0.02) {
  if (!audioContext) return;

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = type;
  osc.frequency.value = frequency;

  gain.gain.value = volume;
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);

  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start();
  osc.stop(audioContext.currentTime + duration);
}

function dropCurrentFruit() {
  if (!state.canDrop || state.gameOver) return;

  const level = state.currentLevel;
  const radius = FRUITS[level].radius;
  const x = clamp(state.pointerTargetX, WALL + radius, WIDTH - WALL - radius);
  state.pointerX = x;

  const fruit = createFruit(level, x, SPAWN_Y);
  state.fruits.push(fruit);

  state.currentLevel = state.nextLevel;
  state.nextLevel = randomStartLevel();
  state.canDrop = false;
  state.dropCooldown = 0.52;
  state.flashTimer = 0.2;
  updateHud();
  unlockAudio();
  playTone(210 + level * 30, 0.08, "triangle", 0.018);
}

function endGame() {
  const isNewBest = state.score > state.best;
  state.gameOver = true;
  state.canDrop = false;
  saveBest();
  updateHud();
  overlayBadge.textContent = "游戏结束";
  overlayTitle.textContent = isNewBest ? "新纪录诞生" : "西瓜没保住";
  overlayText.textContent = `这局拿到了 ${state.score} 分，水果堆过红线太久了。`;
  overlay.classList.remove("hidden");
  playTone(150, 0.24, "sawtooth", 0.03);
  setTimeout(() => playTone(110, 0.3, "sawtooth", 0.024), 90);
}

function addScore(level) {
  state.score += (level + 1) * 12;
  saveBest();
  updateHud();
}

function handleMerge(a, b) {
  if (a.level !== b.level || a.level >= FRUITS.length - 1) return null;
  if (a.mergeLock || b.mergeLock) return null;
  if (a.age < 0.08 || b.age < 0.08) return null;

  a.mergeLock = true;
  b.mergeLock = true;

  const level = a.level + 1;
  const x = (a.x + b.x) / 2;
  const y = (a.y + b.y) / 2;
  const merged = createFruit(level, x, y, {
    vx: (a.vx + b.vx) * 0.15,
    vy: Math.min(a.vy, b.vy) * 0.1 - 60
  });

  addScore(level);
  createBurst(x, y, FRUITS[level].body, 14);
  state.flashTimer = 0.24;
  state.shake = 10;
  playTone(330 + level * 36, 0.14, "triangle", 0.024);
  return merged;
}

function updateParticles(dt) {
  state.particles = state.particles.filter((particle) => {
    particle.life -= dt;
    if (particle.life <= 0) return false;
    particle.vy += 360 * dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.radius *= 0.99;
    return true;
  });
}

function resolveWorldCollisions(fruit) {
  if (fruit.x - fruit.radius < WALL) {
    fruit.x = WALL + fruit.radius;
    fruit.vx *= -0.22;
  }

  if (fruit.x + fruit.radius > WIDTH - WALL) {
    fruit.x = WIDTH - WALL - fruit.radius;
    fruit.vx *= -0.22;
  }

  if (fruit.y + fruit.radius > FLOOR) {
    fruit.y = FLOOR - fruit.radius;
    fruit.vy *= -0.16;
    fruit.vx *= 0.985;
  }
}

function stepPhysics(dt) {
  state.time += dt;
  state.pointerX += (state.pointerTargetX - state.pointerX) * Math.min(1, dt * 18);

  if (!state.canDrop) {
    state.dropCooldown -= dt;
    if (state.dropCooldown <= 0 && !state.gameOver) {
      state.canDrop = true;
      state.dropCooldown = 0;
    }
  }

  if (state.flashTimer > 0) {
    state.flashTimer = Math.max(0, state.flashTimer - dt);
  }

  if (state.shake > 0) {
    state.shake = Math.max(0, state.shake - dt * 30);
  }

  for (const fruit of state.fruits) {
    fruit.age += dt;
    fruit.vy += 930 * dt;
    fruit.x += fruit.vx * dt;
    fruit.y += fruit.vy * dt;
    fruit.vx *= 0.998;
    fruit.vy *= 0.999;
    resolveWorldCollisions(fruit);
  }

  const mergedIds = new Set();
  const spawned = [];

  for (let i = 0; i < state.fruits.length; i += 1) {
    const a = state.fruits[i];
    if (mergedIds.has(a.id)) continue;

    for (let j = i + 1; j < state.fruits.length; j += 1) {
      const b = state.fruits[j];
      if (mergedIds.has(b.id)) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.hypot(dx, dy) || 0.0001;
      const minDistance = a.radius + b.radius;

      if (distance >= minDistance) continue;

      const nx = dx / distance;
      const ny = dy / distance;
      const overlap = minDistance - distance;
      const separation = overlap * 0.5;

      a.x -= nx * separation;
      a.y -= ny * separation;
      b.x += nx * separation;
      b.y += ny * separation;

      resolveWorldCollisions(a);
      resolveWorldCollisions(b);

      const relativeVelocityX = b.vx - a.vx;
      const relativeVelocityY = b.vy - a.vy;
      const impactSpeed = relativeVelocityX * nx + relativeVelocityY * ny;

      if (impactSpeed < 0) {
        const impulse = -impactSpeed * 0.18;
        a.vx -= impulse * nx;
        a.vy -= impulse * ny;
        b.vx += impulse * nx;
        b.vy += impulse * ny;
      }

      if (a.level === b.level && overlap > minDistance * 0.08) {
        const mergedFruit = handleMerge(a, b);
        if (mergedFruit) {
          mergedIds.add(a.id);
          mergedIds.add(b.id);
          spawned.push(mergedFruit);
          break;
        }
      }
    }
  }

  if (mergedIds.size > 0) {
    state.fruits = state.fruits.filter((fruit) => !mergedIds.has(fruit.id));
    state.fruits.push(...spawned);
  }

  updateParticles(dt);

  const overDanger = state.fruits.some((fruit) => fruit.age > 0.85 && fruit.y - fruit.radius < DANGER_LINE);
  if (overDanger) {
    state.dangerTimer += dt;
  } else {
    state.dangerTimer = Math.max(0, state.dangerTimer - dt * 2.5);
  }

  if (state.dangerTimer >= 2.8 && !state.gameOver) {
    endGame();
  }
}

function drawBackground() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, "#fff7e5");
  gradient.addColorStop(0.2, "#ffe1af");
  gradient.addColorStop(1, "#ffb268");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath();
  ctx.arc(82, 96, 86, 0, Math.PI * 2);
  ctx.arc(348, 132, 64, 0, Math.PI * 2);
  ctx.fill();

  const progress = clamp(state.dangerTimer / 2.8, 0, 1);

  ctx.save();
  ctx.strokeStyle = `rgba(220, 60, 46, ${0.35 + progress * 0.45})`;
  ctx.lineWidth = 4;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(WALL + 8, DANGER_LINE);
  ctx.lineTo(WIDTH - WALL - 8, DANGER_LINE);
  ctx.stroke();
  ctx.restore();

  if (progress > 0) {
    ctx.fillStyle = `rgba(220, 60, 46, ${0.09 + progress * 0.16})`;
    ctx.fillRect(WALL, 0, WIDTH - WALL * 2, DANGER_LINE);
  }

  const guideRadius = FRUITS[state.currentLevel].radius;
  const guideX = clamp(state.pointerX, WALL + guideRadius, WIDTH - WALL - guideRadius);
  const bob = Math.sin(state.time * 6) * AIM_BOB;

  ctx.save();
  ctx.strokeStyle = state.canDrop ? "rgba(88, 48, 36, 0.24)" : "rgba(88, 48, 36, 0.12)";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 9]);
  ctx.beginPath();
  ctx.moveTo(guideX, SPAWN_Y + 8);
  ctx.lineTo(guideX, HEIGHT - 56);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = state.canDrop ? 0.95 : 0.5;
  drawFruit(guideX, SPAWN_Y - 6 + bob, state.currentLevel, guideRadius, 0.72);
  ctx.restore();

  ctx.fillStyle = "rgba(90,42,31,0.08)";
  ctx.fillRect(0, FLOOR, WIDTH, HEIGHT - FLOOR);
}

function drawFruit(x, y, level, radius, scale = 1) {
  const fruit = FRUITS[level];
  const drawRadius = radius * scale;
  const fruitImage = getFruitImage(fruit);

  if (fruitImage) {
    const radial = ctx.createRadialGradient(
      x - drawRadius * 0.35,
      y - drawRadius * 0.4,
      drawRadius * 0.15,
      x,
      y,
      drawRadius
    );
    radial.addColorStop(0, "#fff9f2");
    radial.addColorStop(0.18, fruit.body);
    radial.addColorStop(1, fruit.shadow);

    ctx.fillStyle = radial;
    ctx.beginPath();
    ctx.arc(x, y, drawRadius, 0, Math.PI * 2);
    ctx.fill();

    drawFruitPortrait(fruitImage, x, y, drawRadius * 0.92);
    return;
  }

  const radial = ctx.createRadialGradient(
    x - drawRadius * 0.35,
    y - drawRadius * 0.4,
    drawRadius * 0.15,
    x,
    y,
    drawRadius
  );
  radial.addColorStop(0, "#fff9f2");
  radial.addColorStop(0.18, fruit.body);
  radial.addColorStop(1, fruit.shadow);

  ctx.fillStyle = radial;
  ctx.beginPath();
  ctx.arc(x, y, drawRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.beginPath();
  ctx.arc(x - drawRadius * 0.28, y - drawRadius * 0.3, drawRadius * 0.22, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.34)";
  ctx.lineWidth = Math.max(2, drawRadius * 0.06);
  ctx.beginPath();
  ctx.arc(x, y, drawRadius * 0.84, Math.PI * 1.12, Math.PI * 1.68);
  ctx.stroke();

  ctx.strokeStyle = fruit.stem;
  ctx.lineWidth = Math.max(3, drawRadius * 0.12);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y - drawRadius * 0.78);
  ctx.quadraticCurveTo(x + drawRadius * 0.08, y - drawRadius * 1.02, x + drawRadius * 0.02, y - drawRadius * 1.18);
  ctx.stroke();

  ctx.fillStyle = fruit.leaf;
  ctx.beginPath();
  ctx.ellipse(
    x + drawRadius * 0.2,
    y - drawRadius * 0.92,
    drawRadius * 0.2,
    drawRadius * 0.1,
    -0.48,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.font = `${Math.max(16, drawRadius * 0.72)}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(fruit.emoji, x, y + drawRadius * 0.04);
}

function drawParticles() {
  for (const particle of state.particles) {
    const alpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFruits() {
  for (const fruit of state.fruits) {
    drawFruit(fruit.x, fruit.y, fruit.level, fruit.radius);
  }
}

function drawTopUi() {
  ctx.save();
  ctx.fillStyle = "rgba(255, 250, 242, 0.9)";
  fillRoundRect(18, 18, WIDTH - 36, 80, 22);
  ctx.fill();

  ctx.fillStyle = "#7f4d3a";
  ctx.font = '700 14px "Trebuchet MS", sans-serif';
  ctx.textAlign = "left";
  ctx.fillText("操作", 34, 46);
  ctx.font = '13px "Trebuchet MS", sans-serif';
  ctx.fillText("点击画布投放水果，目标是合成字母哥。", 34, 68);

  ctx.textAlign = "right";
  ctx.font = '700 14px "Trebuchet MS", sans-serif';
  ctx.fillText(state.canDrop ? "可投放" : "冷却中", WIDTH - 34, 46);
  ctx.font = '13px "Trebuchet MS", sans-serif';
  ctx.fillText(`${FRUITS[state.currentLevel].name} 就位`, WIDTH - 34, 68);
  ctx.restore();
}

function draw() {
  const shakeX = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
  const shakeY = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;

  ctx.save();
  ctx.translate(shakeX, shakeY);

  drawBackground();
  drawFruits();
  drawParticles();
  drawTopUi();

  if (state.flashTimer > 0) {
    ctx.fillStyle = `rgba(255,255,255,${state.flashTimer * 0.18})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  ctx.restore();
}

function loop(timestamp) {
  if (!lastFrame) lastFrame = timestamp;
  const frameTime = Math.min(0.05, (timestamp - lastFrame) / 1000);
  lastFrame = timestamp;
  accumulator += frameTime;

  while (accumulator >= FIXED_TIME) {
    if (!state.gameOver) {
      stepPhysics(FIXED_TIME);
    } else {
      updateParticles(FIXED_TIME);
    }
    accumulator -= FIXED_TIME;
  }

  draw();
  requestAnimationFrame(loop);
}

function updatePointerFromClient(clientX) {
  const rect = canvas.getBoundingClientRect();
  const scale = WIDTH / rect.width;
  const x = (clientX - rect.left) * scale;
  const radius = FRUITS[state.currentLevel].radius;
  state.pointerTargetX = clamp(x, WALL + radius, WIDTH - WALL - radius);
}

canvas.addEventListener("mousemove", (event) => {
  updatePointerFromClient(event.clientX);
});

canvas.addEventListener("click", (event) => {
  updatePointerFromClient(event.clientX);
  dropCurrentFruit();
});

canvas.addEventListener("touchstart", (event) => {
  const touch = event.changedTouches[0];
  if (!touch) return;
  updatePointerFromClient(touch.clientX);
  dropCurrentFruit();
}, { passive: true });

window.addEventListener("keydown", (event) => {
  if (event.code === "ArrowLeft" || event.code === "KeyA") {
    event.preventDefault();
    const radius = FRUITS[state.currentLevel].radius;
    state.pointerTargetX = clamp(state.pointerTargetX - 22, WALL + radius, WIDTH - WALL - radius);
  }

  if (event.code === "ArrowRight" || event.code === "KeyD") {
    event.preventDefault();
    const radius = FRUITS[state.currentLevel].radius;
    state.pointerTargetX = clamp(state.pointerTargetX + 22, WALL + radius, WIDTH - WALL - radius);
  }

  if (event.code === "Space") {
    event.preventDefault();
    dropCurrentFruit();
  }

  if (event.code === "KeyR") {
    event.preventDefault();
    resetGame();
  }
});

restartBtn.addEventListener("click", resetGame);
overlayBtn.addEventListener("click", resetGame);
dropBtn.addEventListener("click", dropCurrentFruit);

bestValue.textContent = state.best;
resetGame();
requestAnimationFrame(loop);















