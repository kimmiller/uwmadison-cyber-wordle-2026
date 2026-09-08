// Simple Wordle-like game for October 2026 with clues and UW–Madison branding
const DATE_PREFIX = '2026-10-'
const STORAGE_KEY_SOLVED = 'cw_solved_2026_10' // store object {"2026-10-01":true}

let wordsByDate = {}
let selectedDate = '2026-10-01'
let solution = ''
let attempts = []
let maxAttempts = 6
let currentRow = 0
let currentCol = 0

function $(s){return document.querySelector(s)}
function createBoard(){
  const board = $('#board')
  board.innerHTML = ''
  for(let r=0;r<6;r++){
    const row = document.createElement('div');row.className='row';
    for(let c=0;c<5;c++){
      const t = document.createElement('div');t.className='tile';t.dataset.r=r; t.dataset.c=c;row.appendChild(t)
    }
    board.appendChild(row)
  }
}

function createKeyboard(){
  const keys = [['Q','W','E','R','T','Y','U','I','O','P'],['A','S','D','F','G','H','J','K','L'],['Enter','Z','X','C','V','B','N','M','Back']]
  const kb = $('#keyboard');kb.innerHTML=''
  keys.forEach(row=>{
    const r = document.createElement('div');r.className='k-row'
    row.forEach(k=>{
      const b = document.createElement('button');b.textContent=k;b.className='key'
      if(k==='Enter'||k==='Back') b.classList.add('wide')
      b.addEventListener('click',()=>handleKey(k))
      r.appendChild(b)
    })
    kb.appendChild(r)
  })
}

function updateWinCount(){
  const solved = JSON.parse(localStorage.getItem(STORAGE_KEY_SOLVED)||'{}')
  const count = Object.keys(solved).length
  $('#win-count').textContent = count
}

function loadWords(){
  return fetch('assets/words.json').then(r=>r.json()).then(j=>{wordsByDate=j})
}

function populateDateSelect(){
  const sel = $('#date-select')
  sel.innerHTML=''
  for(let d=1;d<=31;d++){
    const day = String(d).padStart(2,'0')
    const val = DATE_PREFIX+day
    const opt = document.createElement('option');opt.value=val;opt.textContent=`Oct ${day}`
    sel.appendChild(opt)
  }
  // default to Oct 1 or today if in Oct 2026
  sel.value = selectedDate
  sel.addEventListener('change',()=>{selectedDate=sel.value;startGame()})
}

function setClue(){
  const clueText = $('#clue-text')
  const info = wordsByDate[selectedDate]
  clueText.textContent = info?info.clue:'No clue available'
}

function startGame(){
  attempts = []
  currentRow=0;currentCol=0
  createBoard();updateKeyboardState()
  const info = wordsByDate[selectedDate]
  solution = info?info.word.toUpperCase():'?????'
  setClue()
  // restore if solved
  const solved = JSON.parse(localStorage.getItem(STORAGE_KEY_SOLVED)||'{}')
  if(solved[selectedDate]){
    // reveal solution in board first row
    const tiles = document.querySelectorAll('.tile')
    for(let i=0;i<5;i++){
      tiles[i].textContent = solution[i]
      tiles[i].classList.add('green')
    }
  }
}

function handleKey(k){
  if(k==='Back') return handleBack()
  if(k==='Enter') return handleEnter()
  if(k.length===1 && /^[A-Z]$/.test(k)) return handleLetter(k)
}

function handleLetter(letter){
  if(currentCol>=5 || currentRow>=6) return
  const tile = document.querySelector(`.tile[data-r="${currentRow}"][data-c="${currentCol}"]`)
  tile.textContent = letter
  tile.classList.add('filled')
  currentCol++
}

function handleBack(){
  if(currentCol===0) return
  currentCol--
  const tile = document.querySelector(`.tile[data-r="${currentRow}"][data-c="${currentCol}"]`)
  tile.textContent = ''
  tile.classList.remove('filled')
}

function handleEnter(){
  if(currentCol<5) return alert('Not enough letters')
  // read guess
  let guess=''
  for(let c=0;c<5;c++){
    const tile = document.querySelector(`.tile[data-r="${currentRow}"][data-c="${c}"]`)
    guess += (tile.textContent||'')
  }
  guess = guess.toUpperCase()
  // TODO: could check a dictionary; accept any for now
  gradeGuess(guess)
}

function gradeGuess(guess){
  const solutionArr = solution.split('')
  const guessArr = guess.split('')
  const colors = Array(5).fill('gray')
  const used = Array(5).fill(false)
  // greens
  for(let i=0;i<5;i++){
    if(guessArr[i]===solutionArr[i]){colors[i]='green';used[i]=true}
  }
  // yellows
  for(let i=0;i<5;i++){
    if(colors[i]==='green') continue
    for(let j=0;j<5;j++){
      if(!used[j] && guessArr[i]===solutionArr[j]){colors[i]='yellow';used[j]=true;break}
    }
  }
  // apply colors and update keyboard
  for(let i=0;i<5;i++){
    const tile = document.querySelector(`.tile[data-r="${currentRow}"][data-c="${i}"]`)
    tile.classList.add(colors[i])
    // mark key
    const keyBtns = Array.from(document.querySelectorAll('.key'))
    const btn = keyBtns.find(b=>b.textContent===guessArr[i])
    if(btn){
      // prioritize green>yellow>gray
      if(colors[i]==='green') btn.style.background='var(--green)'
      else if(colors[i]==='yellow' && btn.style.background!=='var(--green)') btn.style.background='var(--yellow)'
      else if(colors[i]==='gray' && !btn.style.background) btn.style.background='var(--gray)'
    }
  }
  attempts.push(guess)
  if(guess===solution){
    markSolved()
    alert('Correct!')
    updateWinCount()
    currentRow = 6 // lock
    return
  }
  currentRow++
  currentCol=0
  if(currentRow>=6){
    alert('Out of attempts. The word was: '+solution)
  }
}

function markSolved(){
  const solved = JSON.parse(localStorage.getItem(STORAGE_KEY_SOLVED)||'{}')
  if(!solved[selectedDate]){
    solved[selectedDate]=true
    localStorage.setItem(STORAGE_KEY_SOLVED, JSON.stringify(solved))
  }
}

function updateKeyboardState(){
  // reset key styles
  document.querySelectorAll('.key').forEach(k=>k.style.background='')
}

// handle physical keyboard
window.addEventListener('keydown',(e)=>{
  if(e.key==='Backspace') handleBack()
  else if(e.key==='Enter') handleEnter()
  else if(e.key.length===1){
    const ch = e.key.toUpperCase()
    if(/^[A-Z]$/.test(ch)) handleLetter(ch)
  }
})

// init
Promise.resolve()
  .then(loadWords)
  .then(()=>{populateDateSelect();createKeyboard();createBoard();updateWinCount();startGame()})

