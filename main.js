const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = window.innerWidth, H = window.innerHeight;
function resize() {
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = W; canvas.height = H;
}
resize();
window.addEventListener('resize', resize);

const menu = document.getElementById('menu');
const gameui = document.getElementById('game-ui');
const scoreDiv = document.getElementById('score');
const restartBtn = document.getElementById('restart-btn');
const overDiv = document.getElementById('gameover');
const finalDiv = document.getElementById('final-score');
const backBtn = document.getElementById('back-btn');
const backInGameBtn = document.getElementById('back-in-game');

let gameMode = null;

// --- MENU ---
[...document.querySelectorAll('.mode-btn')].forEach(btn => {
  btn.onclick = ()=>{
    menu.style.display = 'none';
    gameui.style.display = '';
    canvas.style.display = '';
    backInGameBtn.style.display = '';
    startGame(btn.dataset.mode);
  };
});

// --- Main Game Logic ---
function startGame(mode) {
  gameMode = mode;
  score = 0;
  gameOver = false;
  overDiv.style.display = 'none';
  scoreDiv.textContent = "Score: 0";
  backInGameBtn.style.display = '';
  backInGameBtn.onclick = endToMenu;
  if (mode === 'catch') startCatch();
  else if (mode === 'stack') startStack();
  else if (mode === 'match3') startMatch3();
  else if (mode === 'memory') startMemory();
  restartBtn.onclick = ()=>{
    startGame(mode);
    restartBtn.style.display = 'none';
  };
  backBtn.onclick = endToMenu;
}

// -- Back to menu logic --
function endToMenu() {
  menu.style.display = '';
  gameui.style.display = 'none';
  canvas.style.display = 'none';
  overDiv.style.display = 'none';
  backInGameBtn.style.display = 'none';
  gameOver = true;
}

// ------- AVOID THE KNIFE WITH LIVES --------
let player, items, catchSpeed, dropTimer, movingL, movingR, gameOver = false, score = 0, lives = 3;
function startCatch() {
  player = { x: W/2, y: H*0.86, size: Math.round(H/10), speed: Math.max(5, W/130) };
  items = [];
  catchSpeed = Math.max(2.6, H/310);
  dropTimer = 0;
  movingL = movingR = false;
  gameOver = false;
  score = 0;
  lives = 3;
  requestAnimationFrame(catchLoop);
  restartBtn.style.display = 'none';
  scoreDiv.textContent = `Score: ${score}   ❤️❤️❤️`;
}
const CATCH_ITEMS = [
  { emoji: "🧋", points: 2 },
  { emoji: "🧁", points: 3 },
  { emoji: "👜", points: 5 },
  { emoji: "🎀", points: 7 },
  { emoji: "🗡️", points: -999 }
];
function catchLoop(ts) {
  if (gameMode !== 'catch' || gameOver) return;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle="#fff6fc"; ctx.fillRect(0,0,W,H);
  ctx.fillStyle="#fce6f7"; ctx.fillRect(0,H*0.91,W,H*0.09);
  ctx.font = `${player.size*1.04}px serif`;
  ctx.textAlign = "center";
  ctx.fillText("👩🏻‍🦱", player.x, player.y);
  if (!dropTimer || ts - dropTimer > 930) {
    let which = Math.random()<0.81
      ? Math.floor(Math.random()*4)
      : 4; // knife less frequent
    let it = CATCH_ITEMS[which];
    let ix = player.size + Math.random()*(W-2*player.size);
    items.push({ ...it, x: ix, y: -40, size: Math.round(H/14) });
    dropTimer = ts;
  }
  for(let i=items.length-1; i>=0; i--) {
    let it = items[i];
    it.y += catchSpeed + (score/52);
    ctx.font = `${it.size}px serif`;
    ctx.fillText(it.emoji, it.x, it.y);
    let dx = Math.abs(player.x - it.x);
    let dy = Math.abs(player.y - it.y);
    if (dx < player.size*0.56 && dy < player.size*0.42) {
      if (it.emoji === "🗡️") return endCatch();
      else {
        score += it.points;
        items.splice(i,1);
        continue;
      }
    }
    if (it.y > H+40) {
      if (["🧋", "🧁", "👜", "🎀"].includes(it.emoji)) {
        lives--;
        if (lives <= 0) return endCatch();
        items.splice(i,1);
        continue;
      } else {
        items.splice(i,1);
        continue;
      }
    }
  }
  if (movingL) player.x -= player.speed;
  if (movingR) player.x += player.speed;
  if (player.x < player.size) player.x = player.size;
  if (player.x > W-player.size) player.x = W-player.size;
  let heartStr = "❤️".repeat(lives) + "🖤".repeat(3-lives);
  scoreDiv.textContent = `Score: ${score}   ${heartStr}`;
  requestAnimationFrame(catchLoop);
}
window.addEventListener('keydown', e=>{
  if (gameMode !== 'catch') return;
  if (e.key==="ArrowLeft") movingL=true;
  if (e.key==="ArrowRight") movingR=true;
});
window.addEventListener('keyup', e=>{
  if (gameMode !== 'catch') return;
  if (e.key==="ArrowLeft") movingL=false;
  if (e.key==="ArrowRight") movingR=false;
});
canvas.addEventListener('touchmove', e=>{
  if (gameMode !== 'catch') return;
  let touch = e.touches[0];
  player.x = Math.max(player.size, Math.min(W-player.size, touch.clientX));
});
function endCatch() {
  gameOver = true;
  backInGameBtn.style.display = 'none';
  showGameOver(score, 'catch');
}

// ------- CUPCAKE STACKER --------
let stack, stackSpeed, stackTimer, waitingTap;
function startStack() {
  stack = [];
  let base = { x: W/2, y: H*0.90, size: Math.round(H/13), emoji: "🧁", vx: 0, vy: 0, dropped:true };
  stack.push(base);
  stackSpeed = Math.max(2.7, W/210);
  stackTimer = 0;
  waitingTap = true;
  restartBtn.style.display = '';
  score = 0;
  scoreDiv.textContent = "Score: 0";
  canvas.onclick = stackTap;
  requestAnimationFrame(stackLoop);
}
function stackTap() {
  if (gameMode !== 'stack' || gameOver) return;
  if (!waitingTap) return;
  waitingTap = false;
  let last = stack[stack.length-1];
  last.dropped = true;
}
function stackLoop(ts) {
  if (gameMode !== 'stack' || gameOver) return;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle="#fff6fc"; ctx.fillRect(0,0,W,H);
  ctx.fillStyle="#fce6f7"; ctx.fillRect(0,H*0.91,W,H*0.09);
  let baseY = H*0.90, cupS = Math.round(H/13);
  if (stack.length===0) {
    let base = { x: W/2, y: baseY, size: cupS, emoji: "🧁", vx: 0, vy: 0, dropped:true };
    stack.push(base);
  }
  let falling = stack[stack.length-1];
  if (!falling.dropped) {
    falling.x += stackSpeed * (falling.vx||0);
    if (falling.x < cupS) { falling.x = cupS; falling.vx*=-1; }
    if (falling.x > W-cupS) { falling.x = W-cupS; falling.vx*=-1; }
    ctx.font = `${cupS}px serif`;
    ctx.fillText("🧁", falling.x, falling.y);
    if (Math.random()<0.012) falling.vx = (Math.random()<0.5?-1:1)*0.86;
  } else {
    falling.vy = (falling.vy||0) + 0.8;
    falling.y += falling.vy;
    ctx.font = `${cupS}px serif`;
    ctx.fillText("🧁", falling.x, falling.y);
    if (stack.length>1) {
      let prev = stack[stack.length-2];
      if (falling.y + cupS*0.5 >= prev.y - cupS*0.5 &&
          Math.abs(falling.x - prev.x) < cupS*0.82) {
        falling.y = prev.y - cupS*0.94;
        falling.vy = 0;
        waitingTap = true;
        if (falling.y > 35) {
          let newCup = { x: W/2, y: 40, size: cupS, emoji: "🧁", vx: (Math.random()<0.5?-1:1)*0.8, vy:0, dropped:false };
          stack.push(newCup);
          score++;
          scoreDiv.textContent = `Score: ${score}`;
        }
      }
      else if (falling.y > prev.y - cupS*0.65 && Math.abs(falling.x - prev.x) > cupS*0.93) {
        return endStack();
      }
    } else {
      if (falling.y > baseY - cupS*0.3) {
        falling.y = baseY - cupS*0.3;
        falling.vy = 0;
        waitingTap = true;
        let newCup = { x: W/2, y: 40, size: cupS, emoji: "🧁", vx: (Math.random()<0.5?-1:1)*0.8, vy:0, dropped:false };
        stack.push(newCup);
        score++;
        scoreDiv.textContent = `Score: ${score}`;
      }
    }
    if (falling.y > H) return endStack();
  }
  for (let i=stack.length-1; i>=0; i--) {
    let c = stack[i];
    ctx.font = `${c.size}px serif`;
    ctx.fillText(c.emoji, c.x, c.y);
  }
  requestAnimationFrame(stackLoop);
}
function endStack() {
  gameOver = true;
  backInGameBtn.style.display = 'none';
  canvas.onclick = null;
  showGameOver(score, 'stack');
}

// ------- SWEET MATCH (CANDY CRUSH STYLE) --------
let matchGrid, matchSize, matchAnim, matchSelected, match3Score, match3Swapping, match3Cols = 7, match3Rows = 9;
const MATCH_EMOJI = ["🧋", "🧁", "👜", "🎀", "🍬"];
function startMatch3() {
  matchGrid = [];
  matchAnim = {};
  match3Score = 0;
  matchSelected = null;
  match3Swapping = false;
  matchSize = Math.min(W/(match3Cols+1), H/(match3Rows+2));
  for(let r=0;r<match3Rows;r++) {
    let row = [];
    for(let c=0;c<match3Cols;c++) {
      row.push(MATCH_EMOJI[Math.floor(Math.random()*MATCH_EMOJI.length)]);
    }
    matchGrid.push(row);
  }
  scoreDiv.textContent = "Score: 0";
  restartBtn.style.display = '';
  canvas.onclick = match3Click;
  requestAnimationFrame(match3Loop);
}
function match3Click(e) {
  if (match3Swapping) return;
  let rect = canvas.getBoundingClientRect();
  let x = e.clientX - rect.left, y = e.clientY - rect.top;
  let c = Math.floor((x-(W-match3Cols*matchSize)/2)/matchSize);
  let r = Math.floor((y-matchSize*1.1)/matchSize);
  if (r<0||r>=match3Rows||c<0||c>=match3Cols) return;
  if (!matchSelected) {
    matchSelected = {r,c};
  } else {
    let dr = Math.abs(matchSelected.r-r), dc = Math.abs(matchSelected.c-c);
    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
      match3Swapping = true;
      [matchGrid[matchSelected.r][matchSelected.c], matchGrid[r][c]] = [matchGrid[r][c], matchGrid[matchSelected.r][matchSelected.c]];
      setTimeout(()=>{
        if (!match3Clear()) {
          [matchGrid[matchSelected.r][matchSelected.c], matchGrid[r][c]] = [matchGrid[r][c], matchGrid[matchSelected.r][matchSelected.c]];
        }
        matchSelected = null;
        match3Swapping = false;
      }, 120);
    } else {
      matchSelected = {r,c};
    }
  }
}
function match3Loop() {
  if (gameMode !== 'match3' || gameOver) return;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle="#f8f3fc"; ctx.fillRect(0,0,W,H);
  for(let r=0;r<match3Rows;r++) {
    for(let c=0;c<match3Cols;c++) {
      let x = (W-match3Cols*matchSize)/2 + c*matchSize + matchSize/2;
      let y = matchSize*1.1 + r*matchSize + matchSize/2;
      ctx.font = `${matchSize*0.85}px serif`;
      ctx.textAlign = "center"; ctx.textBaseline="middle";
      ctx.globalAlpha = matchSelected && matchSelected.r === r && matchSelected.c === c ? 0.5 : 1;
      ctx.fillText(matchGrid[r][c], x, y);
      ctx.globalAlpha = 1;
    }
  }
  scoreDiv.textContent = "Score: "+match3Score;
  if (!match3HasMoves()) {
    setTimeout(()=>showGameOver(match3Score,'match3'),650);
    return;
  }
  requestAnimationFrame(match3Loop);
}
function match3Clear() {
  let cleared = false, toClear = [];
  // horizontal
  for(let r=0;r<match3Rows;r++) {
    let cnt = 1, last = matchGrid[r][0];
    for(let c=1;c<match3Cols;c++) {
      if (matchGrid[r][c]===last) cnt++;
      else {
        if (cnt>=3) toClear.push({r, c1:c-cnt, c2:c-1});
        cnt=1; last=matchGrid[r][c];
      }
    }
    if (cnt>=3) toClear.push({r, c1:match3Cols-cnt, c2:match3Cols-1});
  }
  // vertical
  for(let c=0;c<match3Cols;c++) {
    let cnt = 1, last = matchGrid[0][c];
    for(let r=1;r<match3Rows;r++) {
      if (matchGrid[r][c]===last) cnt++;
      else {
        if (cnt>=3) toClear.push({c, r1:r-cnt, r2:r-1});
        cnt=1; last=matchGrid[r][c];
      }
    }
    if (cnt>=3) toClear.push({c, r1:match3Rows-cnt, r2:match3Rows-1});
  }
  if (toClear.length===0) return false;
  toClear.forEach(cl=>{
    if (cl.r!==undefined) {
      for(let c=cl.c1;c<=cl.c2;c++) {
        matchGrid[cl.r][c]=null; match3Score+=5;
      }
    } else if (cl.c!==undefined) {
      for(let r=cl.r1;r<=cl.r2;r++) {
        matchGrid[r][cl.c]=null; match3Score+=5;
      }
    }
  });
  // Drop
  for(let c=0;c<match3Cols;c++) {
    for(let r=match3Rows-1;r>=0;r--) {
      if (matchGrid[r][c]===null) {
        for(let rr=r-1;rr>=0;rr--) {
          if (matchGrid[rr][c]) {
            matchGrid[r][c]=matchGrid[rr][c];
            matchGrid[rr][c]=null;
            break;
          }
        }
      }
    }
  }
  for(let r=0;r<match3Rows;r++) {
    for(let c=0;c<match3Cols;c++) {
      if (!matchGrid[r][c]) matchGrid[r][c]=MATCH_EMOJI[Math.floor(Math.random()*MATCH_EMOJI.length)];
    }
  }
  setTimeout(match3Clear, 220);
  return true;
}
function match3HasMoves() {
  return true;
}

// --------- MEMORY MATCH GAME ---------
const MEMORY_EMOJIS = ["👜", "🧋", "🧁", "🎀", "🍬", "💄", "💅", "👒"];
let memoryGrid, memoryFlipped, memoryMatched, memorySize, memoryRows, memoryCols, memoryBusy, memoryScore, memoryTries;

function startMemory() {
  memoryRows = 4;
  memoryCols = 4;
  memorySize = Math.min(W/(memoryCols+1.2), H/(memoryRows+2));
  let pairs = [];
  let used = [...MEMORY_EMOJIS];
  while (pairs.length < (memoryRows*memoryCols)/2) {
    if (used.length === 0) used = [...MEMORY_EMOJIS];
    let idx = Math.floor(Math.random()*used.length);
    pairs.push(used[idx]);
    used.splice(idx,1);
  }
  pairs = [...pairs, ...pairs]; // duplicate for pairs
  // shuffle
  for(let i=pairs.length-1;i>0;i--) {
    let j = Math.floor(Math.random()*(i+1));
    [pairs[i],pairs[j]] = [pairs[j],pairs[i]];
  }
  memoryGrid = [];
  for (let r=0; r<memoryRows; r++) {
    let row = [];
    for (let c=0; c<memoryCols; c++) {
      row.push({emoji: pairs[r*memoryCols+c], flipped:false, matched:false});
    }
    memoryGrid.push(row);
  }
  memoryFlipped = [];
  memoryMatched = 0;
  memoryScore = 0;
  memoryTries = 0;
  memoryBusy = false;
  restartBtn.style.display = '';
  scoreDiv.textContent = "Score: 0";
  canvas.onclick = memoryClick;
  requestAnimationFrame(memoryLoop);
}

function memoryClick(e) {
  if (memoryBusy || gameOver) return;
  let rect = canvas.getBoundingClientRect();
  let x = e.clientX - rect.left, y = e.clientY - rect.top;
  let gridStartX = (W - memoryCols*memorySize)/2, gridStartY = memorySize*1.4;
  let c = Math.floor((x - gridStartX)/memorySize);
  let r = Math.floor((y - gridStartY)/memorySize);
  if (r<0||r>=memoryRows||c<0||c>=memoryCols) return;
  let card = memoryGrid[r][c];
  if (card.flipped || card.matched) return;
  card.flipped = true;
  memoryFlipped.push({r,c});
  if (memoryFlipped.length === 2) {
    memoryBusy = true;
    memoryTries++;
    setTimeout(()=>{
      let [a,b] = memoryFlipped;
      let cardA = memoryGrid[a.r][a.c], cardB = memoryGrid[b.r][b.c];
      if (cardA.emoji === cardB.emoji) {
        cardA.matched = cardB.matched = true;
        memoryMatched += 2;
        memoryScore++;
      } else {
        cardA.flipped = cardB.flipped = false;
      }
      memoryFlipped = [];
      memoryBusy = false;
      if (memoryMatched === memoryRows*memoryCols) {
        setTimeout(()=>showGameOver(`Tries: ${memoryTries}`, 'memory'), 550);
        gameOver = true;
      }
    }, 700);
  }
}

function memoryLoop() {
  if (gameMode !== 'memory' || gameOver) return;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle="#fffafc"; ctx.fillRect(0,0,W,H);
  let gridStartX = (W - memoryCols*memorySize)/2, gridStartY = memorySize*1.4;
  for (let r=0; r<memoryRows; r++) {
    for (let c=0; c<memoryCols; c++) {
      let card = memoryGrid[r][c];
      let x = gridStartX + c*memorySize, y = gridStartY + r*memorySize;
      ctx.save();
      ctx.strokeStyle = "#dfbae8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(x, y, memorySize*0.92, memorySize*0.92, 13);
      ctx.fillStyle = card.flipped || card.matched ? "#fbeafd" : "#f7e5fa";
      ctx.shadowColor = "#eed4ff";
      ctx.shadowBlur = 5;
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      if (card.flipped || card.matched) {
        ctx.font = `${memorySize*0.62}px serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = "#bb70c3";
        ctx.fillText(card.emoji, x+memorySize*0.46, y+memorySize*0.51);
      } else {
        ctx.font = `${memorySize*0.22}px 'Montserrat',sans-serif`;
        ctx.fillStyle = "#c9a2d6";
        ctx.textAlign = "center";
        ctx.fillText("?", x+memorySize*0.47, y+memorySize*0.60);
      }
    }
  }
  scoreDiv.textContent = `Matches: ${memoryScore} / ${(memoryRows*memoryCols)/2}`;
  requestAnimationFrame(memoryLoop);
}

// --- Shared game over logic ---
function showGameOver(score, mode) {
  overDiv.style.display = '';
  finalDiv.textContent = typeof score === "string" ? score : `Score: ${score}`;
  restartBtn.style.display = mode === 'stack' || mode === 'match3' || mode === 'memory' ? '' : 'none';
  backInGameBtn.style.display = 'none';
}

// --- Startup ---
canvas.style.display = "none";
gameui.style.display = "none";
overDiv.style.display = "none";
