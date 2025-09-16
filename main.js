// main.js
window.onload = () => {
  const startScreen = document.getElementById('startScreen');
  const canvas = document.getElementById('canvas');
  const scoreDisplay = document.getElementById('score');
  const heartsDisplay = document.getElementById('hearts');

  // 처음엔 게임 화면 안 보이게
  canvas.style.display = 'none';
  scoreDisplay.style.display = 'none';
  heartsDisplay.style.display = 'none';

  // 시작 버튼 누르면 화면만 전환
  document.getElementById('startBtn').addEventListener('click', () => {
    startScreen.style.display = 'none'; // 시작화면 숨김
    canvas.style.display = 'block';     // 게임화면 보임
    scoreDisplay.style.display = 'block';
    heartsDisplay.style.display = 'block';
  // startGame();  // ❌ 이건 삭제
  });

// Enter 키로 게임 시작
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Enter' && !gameStarted) {
      startGame(); // 게임 시작
    }
  // 점프 (게임 시작한 경우에만)
    if (e.code === 'Enter' && gameStarted) {
      if (jumpCount < 3) {
        dino.jump();
        jumpCount++;
      }
    }
  });
}; // ← 이 줄 추가해서 window.onload 블록 닫기


const backgroundImage = new Image();
let bgX = 0; // 배경 이미지의 현재 x 좌표
const backgroundSpeed = 2; // 배경이 움직이는 속도 (원하는 값으로 조절 가능)
const bgScale = 1.91;
backgroundImage.src = 'summer.png';
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const GROUND_Y = canvas.height - 150;
const jumpSound = document.getElementById('jumpSound');
const scoreDisplay = document.getElementById('score');
const restartButton = document.getElementById('restartBtn');
const heartsDisplay = document.getElementById('hearts');

let frame = 0;
let nextCactusTime = Math.floor(Math.random() * 100) + 100;
let obstacles = [];
let particles = [];
let animation;
let jumpCount = 0;
let gravity = 0.9;
let rotation = 0;
let lives = 3;

function startGame() {
  if (gameStarted) return;   // 중복 시작 방지
  gameStarted = true;
  drawHearts();
  gameLoop();
}


let score = 0;
let displayedScore = 0;
let scoreTimer = 0;
let speed = 8;
let gameStarted = false;
let gameOver = false;
let blinkTimer = 0;
let blinking = false;
const bgColors = ['#7a847b'];

let flipTrigger = false;
let flipBlinkCounter = 0;
let shouldFlipNow = false;

// 🌸 Dino 이미지 객체 생성
const dinoImage = new Image();
dinoImage.src = 'lilt2.png'; // 'dino_image.png'를 원하는 이미지 파일 경로로 변경하세요.
let dinoImageLoaded = false;
dinoImage.onload = () => {
    dinoImageLoaded = true;
};

class Dino {
  constructor() {
    this.x = 100;
    // 🌸 이미지 크기에 맞춰 너비와 높이 설정
    this.width = 200;
    this.height = 200;
    this.y = GROUND_Y - this.height;
    this.defaultY = GROUND_Y - this.height;
    this.velocityY = 0;
    this.rotation = 0;
    this.hitbox = {
      xOffset: 40,   // 왼쪽에서 40px 만큼 안쪽
      yOffset: 50,   // 위에서 50px 만큼 안쪽
      width: 135,    // hitbox 가로 크기
      height: 150    // hitbox 세로 크기
    };
  }

  // 🌸 draw() 메서드 삭제
  update() {
    this.velocityY += gravity;
    this.y += this.velocityY;
    this.rotation = this.velocityY * 0.03;

    if (this.y > this.defaultY) {
      this.y = this.defaultY;
      this.velocityY = 0;
      jumpCount = 0;
      this.rotation = 0;
    }
  }

  jump() {
    this.velocityY = -16;
    jumpSound.currentTime = 0;
    jumpSound.play();

    let count = 10;
    let color = 'rgba(120,120,120,';
    if (jumpCount === 2) {
      count = 30;
      color = 'rgba(255,80,0,';
    }
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(
        this.x + this.width / 2,
        this.y + this.height,
        color,
        jumpCount === 2 ? 4 : 2
      ));
    }
  }
}

class Cactus {
  constructor() {
    this.x = canvas.width;

    // 픽셀 사이즈(블록 단위). 숫자 키우면 더 큼직한 픽셀감
    this.px = 4;

    // 책 크기(픽셀 그리드 배수로 고정)
    const W_CHOICES = [64, 80, 96];   // 표지 폭
    const H_CHOICES = [64, 96, 112];  // 표지 높이
    this.width  = W_CHOICES[Math.floor(Math.random() * W_CHOICES.length)];
    this.height = H_CHOICES[Math.floor(Math.random() * H_CHOICES.length)];

    this.y = GROUND_Y - this.height;

    // 엔틱 팔레트 (가죽/금장/페이지)
    const leathers = ['#6B3E2E', '#7A4A33', '#5C382B', '#8B5A3C']; // 가죽
    this.coverColor = leathers[Math.floor(Math.random() * leathers.length)];
    this.coverDark  = '#41261C';
    this.coverLight = '#9C6B51';
    this.gold       = '#C9A65E';
    this.goldDark   = '#9E844C';
    this.page       = '#E9E1C9';
    this.pageLine   = '#CFC6A7';

    // 디테일 두께(픽셀 단위)
    this.spineW   = 3 * this.px; // 등(spine)
    this.pageW    = 3 * this.px; // 페이지 단면
    this.borderW  = 1 * this.px; // 외곽선 두께
  }

  // 픽셀 스냅 도우미
  _snap(v) { return Math.round(v / this.px) * this.px; }

  // 픽셀 사각형
  _pfill(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(this._snap(x), this._snap(y), this._snap(w), this._snap(h));
  }

  // 픽셀 테두리
  _pstroke(x, y, w, h, color) {
    const bw = this.borderW;
    this._pfill(x, y, w, bw, color);                 // top
    this._pfill(x, y + h - bw, w, bw, color);        // bottom
    this._pfill(x, y, bw, h, color);                 // left
    this._pfill(x + w - bw, y, bw, h, color);        // right
  }

  draw() {
    const x = this.x | 0;
    const y = this.y | 0;
    const w = this.width;
    const h = this.height;
    const px = this.px;

    // 0) 바닥 그림자(픽셀 블록)
    this._pfill(x + 2 * px, y + h, w - 4 * px, 1 * px, 'rgba(0,0,0,0.18)');

    // 1) 표지(가죽)
    this._pfill(x, y, w, h, this.coverColor);

    // 2) 왼쪽 등(spine)
    this._pfill(x, y, this.spineW, h, this.coverDark);

    // 2-1) 등 금장 밴드
    const bandH = 1 * px;
    const bandYs = [y + 8 * px, y + Math.floor(h * 0.35), y + Math.floor(h * 0.65), y + h - 8 * px];
    bandYs.forEach(yy => {
      this._pfill(x, yy, this.spineW, bandH, this.gold);
      this._pfill(x, yy + bandH, this.spineW, bandH, this.goldDark);
    });

    // 3) 오른쪽 페이지 단면
    // 3) 오른쪽 페이지 단면
    this._pfill(x + w - this.pageW, y, this.pageW, h, this.page);

// 페이지 세로줄 (진짜 얇게, 1px 폭)
    ctx.fillStyle = this.pageLine;
    for (let xx = x + w - this.pageW + 1; xx < x + w - 1; xx += 2) {
      ctx.fillRect(xx, y, 1, h);
    }



    // 4) 표지 장식(금장 테두리 안쪽 오프셋)
    const inset = 2 * px;
    this._pstroke(x + this.spineW + inset, y + inset,
                  w - this.spineW - this.pageW - inset * 2,
                  h - inset * 2, this.gold);

    // 5) 제목 플라크(사각 금판)
    const plaqueW = Math.max(10 * px, Math.floor((w - this.spineW - this.pageW) * 0.55 / px) * px);
    const plaqueH = 4 * px;
    const plaqueX = x + this.spineW + Math.floor((w - this.spineW - this.pageW - plaqueW) / (2 * px)) * px;
    const plaqueY = y + Math.floor(h * 0.35 / px) * px;
    this._pfill(plaqueX, plaqueY, plaqueW, plaqueH, this.gold);
    this._pstroke(plaqueX, plaqueY, plaqueW, plaqueH, this.goldDark);

    // 6) 모서리 마모(하이라이트/그림자 픽셀)
    this._pfill(x + this.spineW, y, 1 * px, 1 * px, this.coverLight);                 // 좌상단 살짝 밝게
    this._pfill(x + w - this.pageW - 2 * px, y + h - 2 * px, 2 * px, 2 * px, '#2A1B13'); // 우하단 어둡게

    // 7) 외곽선
    this._pstroke(x, y, w, h, 'rgba(0,0,0,0.35)');
  }

  update() {
    this.x -= speed;
    this.draw();
  }
}




class Particle {
  constructor(x, y, color = 'rgba(240,120,120,', size = 2) {
    this.x = x;
    this.y = y;
    this.radius = Math.random() * size + 1;
    this.alpha = 1;
    this.dy = Math.random() * -2 - 1;
    this.dx = Math.random() * 4 - 2;
    this.color = color;
  }

  update() {
    this.x += this.dx;
    this.y += this.dy;
    this.alpha -= 0.03;
  }

  draw() {
    ctx.fillStyle = `${this.color}${this.alpha})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  isAlive() {
    return this.alpha > 0;
  }
}

function detectCollision(dino, cactus) {
  const dinoBox = {
    x: dino.x + dino.hitbox.xOffset,
    y: dino.y + dino.hitbox.yOffset,
    width: dino.hitbox.width,
    height: dino.hitbox.height
  };

  return (
    cactus.x < dinoBox.x + dinoBox.width &&
    cactus.x + cactus.width > dinoBox.x &&
    cactus.y < dinoBox.y + dinoBox.height &&
    cactus.y + cactus.height > dinoBox.y
  );
}

function drawGround() {
  ctx.strokeStyle = '#ebd8ad';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + 1);
  ctx.lineTo(canvas.width, GROUND_Y + 1);
  ctx.stroke();
}

function drawHearts() {
  heartsDisplay.innerHTML = '❤'.repeat(lives);
}

const dino = new Dino();

document.addEventListener("DOMContentLoaded", () => {
  drawGround();
  drawHearts();
});

function gameLoop() {
  if (gameOver) return;

  animation = requestAnimationFrame(gameLoop);
  frame++;

 // 화면 반전 처리
if ((displayedScore % 2000) < 1000 && displayedScore >= 2000) {
  if (!flipTrigger) {
    flipTrigger = true;
    flipBlinkCounter = 20;
  } else if (flipBlinkCounter > 0) {
    flipBlinkCounter--;
    if (flipBlinkCounter % 2 === 0) {
      canvas.style.visibility = 'hidden';
    } else {
      canvas.style.visibility = 'visible';
    }
    return;
  } else {
    canvas.style.visibility = 'visible';
    shouldFlipNow = true;
  }
} else {
  shouldFlipNow = false;
  flipTrigger = false;
}

  const flipMode = shouldFlipNow;
  ctx.save();
  if (flipMode) {
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(Math.PI);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const imgWidth = backgroundImage.width;
  const imgHeight = backgroundImage.height;
  const scaledWidth = imgWidth * bgScale;
  const scaledHeight = imgHeight * bgScale;

  // 배경 이미지가 검은색 선(GROUND_Y) 위에 정확히 놓이도록 세로 위치를 계산합니다.
  const bgY = GROUND_Y - scaledHeight + 17;

  // 첫 번째 배경 이미지를 그립니다.
  ctx.drawImage(backgroundImage, bgX, bgY, scaledWidth, scaledHeight);

  // 첫 번째 이미지 바로 옆에 두 번째 이미지를 이어서 그립니다.
  ctx.drawImage(backgroundImage, bgX + scaledWidth, bgY, scaledWidth, scaledHeight);

  // 배경 x 좌표를 왼쪽으로 이동시킵니다.
  bgX -= backgroundSpeed;

  // 배경이 한 바퀴 돌면 다시 0으로 초기화합니다.
  if (bgX <= -scaledWidth) {
    bgX = 0;
  }
  // --- 🌸 배경 이미지 로직 수정 끝 🌸 ---


  drawGround();

  if (frame % nextCactusTime === 0) {
    obstacles.push(new Cactus());
    nextCactusTime = Math.floor(Math.random() * (120 - speed * 2)) + 120;
    speed += 0.1;
  }

  obstacles.forEach((cactus, index) => {
    cactus.update();
    if (cactus.x + cactus.width < 0) {
      obstacles.splice(index, 1);
    }
    if (detectCollision(dino, cactus)) {
      lives--;
      drawHearts();
      obstacles.splice(index, 1);
      blinking = true;
      blinkTimer = 30;
      for (let i = 0; i < 5; i++) {
        particles.push(new Particle(dino.x + dino.width / 2, dino.y + dino.height / 2, 'rgba(100,200,50,'));
      }
      if (lives <= 0) {
        gameOver = true;
        cancelAnimationFrame(animation);
        scoreDisplay.innerText = `Game Over! Final Score: ${score}`;
        restartButton.style.display = 'block';
      }
    }
  });

  if (blinking) {
    blinkTimer--;
    if (blinkTimer <= 0) blinking = false;
  }

  scoreTimer++;
  if (scoreTimer >= 30) {
    score += 100;
    scoreTimer = 0;
    speed += 0.02;
  }
  if (displayedScore < score) displayedScore += 1;

  const bgIndex = Math.floor(displayedScore / 1000) % bgColors.length;
  canvas.style.background = bgColors[bgIndex];

  particles.forEach((p, i) => {
    p.update();
    p.draw();
    if (!p.isAlive()) {
      particles.splice(i, 1);
    }
  });

  dino.update();

  // 🌸 Dino 이미지 그리기
  // 🌸 Dino 이미지 그리기
if (dinoImageLoaded) {
  if (!(blinking && frame % 10 < 5)) {
    ctx.save();
    ctx.translate(dino.x + dino.width / 2, dino.y + dino.height / 2);
    if (shouldFlipNow) ctx.scale(-1, 1); // 좌우 반전
    ctx.rotate(dino.rotation);
    ctx.drawImage(dinoImage, -dino.width / 2, -dino.height / 2, dino.width, dino.height);
    ctx.restore();
  }
}


  scoreDisplay.innerText = `Score: ${displayedScore}`;
  ctx.restore();
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    if (!gameStarted) {
      gameStarted = true;
      drawHearts();
      gameLoop();
    }
    if (jumpCount < 3) {
      dino.jump();
      jumpCount++;
    }
  }
});

canvas.addEventListener('touchstart', () => {
  if (!gameStarted) {
    gameStarted = true;
    drawHearts();
    gameLoop();
  }
  if (jumpCount < 3) {
    dino.jump();
    jumpCount++;
  }
});


restartButton.addEventListener('click', () => {
  location.reload();
});
