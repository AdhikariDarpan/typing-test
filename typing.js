const paragraphEl = document.getElementById("paragraph");
const inputBox = document.getElementById("input-box");
const resultsEl = document.getElementById("results");
const languageSelector = document.getElementById("languages");
const nextButton = document.getElementById("next-btn");
const tryAgain = document.getElementById("try-again");
const levelOfHardness = document.getElementById('levels');

let originalText = "";
let startTime = null;
let timerInterval = null; 
let elapsedTime = 0; 
let incorrectCharacters = 0;
let currentLanguage = 'en';
let currentLevel = 'normal';

function getRandomParagraph(paragraphList) {
  let randomIndex;
  randomIndex = Math.floor(Math.random() * paragraphList.length); 
  return sanitizeText(paragraphList[randomIndex]);
}

function randomizeWords(text) {
  const words = text.split(/\s+/);
  let swappedIndexes = new Set();
  const complexWords = words.filter(word => word.length >= 3);
  for (let i = complexWords.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    if (swappedIndexes.has(i) || swappedIndexes.has(j)) {
      continue;
    }
    [complexWords[i], complexWords[j]] = [complexWords[j], complexWords[i]];
    swappedIndexes.add(i);
    swappedIndexes.add(j);
  }
  let wordIndex = 0;
  const shuffledText = words.map(word => {
    if (word.length >= 3) {
      return complexWords[wordIndex++];
    }
    return word; 
  });

  return shuffledText.join(" ");
}

function fetchParagraph(language,level) {
  try {
    sessionStorage.setItem('level',level);
    sessionStorage.setItem('lang',language);
    if(level == 'extreme'){
      const paragraphList = typingTestParagraphs['difficult'][language];
      originalText = randomizeWords(getRandomParagraph(paragraphList, language));
    }else{
      if (!typingTestParagraphs[level][language]) {
        throw new Error("Language not supported");
      }
      const paragraphList = typingTestParagraphs[level][language];
      originalText = getRandomParagraph(paragraphList, language);
    }
    displayParagraph(originalText);
    resetTimer();
    resetInputBox();
    inputBox.focus();
  } catch (error) {
    paragraphEl.textContent = `Error fetching paragraph. Please select another language or level.`;
    resetInputBox(true);
  }
}

function resetInputBox(disable = false) {
  inputBox.disabled = disable;
  inputBox.value = "";
  resultsEl.innerHTML = "";
  startTime = null;
  if (!disable) inputBox.focus();
}

function sanitizeText(text) {
  return text.replace(/\s+/g, " ");
}

function displayParagraph(text) {
  paragraphEl.innerHTML = text
    .split("")
    .map((char) => `<span>${char}</span>`)
    .join("");
}


function displayResults() {
  const totalTime = (Date.now() - startTime) / 60000;
  const typedText = inputBox.value;
  const correctChars = [...typedText].filter(
    (char, index) => char === originalText[index]
  ).length;

  const wordCount = typedText.trim().split(/\s+/).length;
  const correctWords = typedText
    .split(/\s+/)
    .filter((word, index) => originalText.split(/\s+/)[index] === word).length;

  const wpm = Math.round(wordCount / totalTime);
  const ccpm = Math.round((correctChars / totalTime)/60);
  const wrongWords = wordCount - correctWords;

  const accuracy = ((correctChars / (correctChars + incorrectCharacters)) * 100).toFixed(2);

  resultsEl.innerHTML = `
    <h1 style="text-align: center;">Results</h1>
    <p><strong>Words Per Minute:</strong> ${wpm}</p>
    <p><strong>Correct Char/Sec:</strong> ${ccpm}</p>
    <p><strong>Correct:</strong> ${correctWords}</p>
    <p><strong>Wrong:</strong> ${wrongWords}</p>
    <p><strong>Accuracy:</strong> ${accuracy}%</p>
  `;
  document.querySelector('.result-container').classList.add('show');
}

function updateTimer() {
  elapsedTime++;
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  document.getElementById("time").textContent = formattedTime;
}
tryAgain.addEventListener('click',()=>{
  resetTimer();
  resetInputBox();
});
function resetTimer() {
  elapsedTime = 0;
  incorrectCharacters = 0; 
  clearInterval(timerInterval);
  document.getElementById("time").textContent = "0:00";
  startTime = null;
  paragraphEl.querySelectorAll("span")?.forEach(sp=>{
    sp.classList.add('reset')
    sp.classList.remove('incorrect');
    sp.classList.remove('correct');
  });
}
inputBox.addEventListener("input", () => {
  if (!startTime) {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
  }
  
  const typedText = inputBox.value;
  const spans = paragraphEl.querySelectorAll("span");
  
  spans.forEach((span, index) => {
    const typedChar = typedText[index];
    if (!typedChar) {
      span.className = "";
    } else if (typedChar === originalText[index]) {
      span.className = "correct";
    } else {
      span.className = "incorrect";
      if (typedChar !== originalText[index]) {
        incorrectCharacters++;
      }
    }
  });
  
  if (typedText.length >= originalText.length) {
    inputBox.disabled = true;
    clearInterval(timerInterval);
    displayResults();
  }
});
nextButton.addEventListener("click", () => {
  const language = languageSelector.value;
  changeSelector({language:language});
});
languageSelector.addEventListener("change", () => {
  const language = languageSelector.value;
  changeSelector({language:language});
});
levelOfHardness.addEventListener("change", () => {
  const level = levelOfHardness.value;
  changeSelector({level});
});

function changeSelector({language = currentLanguage, level = currentLevel}) {
  if (language == currentLanguage || level == currentLevel) {
    currentLanguage = language;
    currentLevel = level;
    fetchParagraph(currentLanguage, currentLevel);
  }
}
let setLevel = sessionStorage.getItem('level');
let setlang = sessionStorage.getItem('lang');
if(setLevel && setlang){
  if(setLevel && setLevel.trim() !== ''){
    levelOfHardness.querySelectorAll('option')?.forEach(opt=>{
      if(opt.value == setLevel){
        opt.selected = true;
      }
    })
    currentLevel = setLevel;
  }
  if(setlang && setlang.trim() !== ''){
    languageSelector.querySelectorAll('option')?.forEach(opt=>{
      if(opt.value == setlang){
        opt.selected = true;
      }
    })
    currentLanguage = setlang;
  }
}
fetchParagraph(currentLanguage, currentLevel);
document.addEventListener('copy',(e)=>{
  const selectedData = window.getSelection().toString();
  e.clipboardData.setData(
    "text/plain",
    "Don't be smart"
  )
  e.preventDefault();
})
inputBox.addEventListener('paste',(e)=>{
  e.preventDefault();
  inputBox.value += "Don't be smart";
})
