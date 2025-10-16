const noteStorageToken = "SWTORNotes";
const sectionStorageToken = "SWTORSections";
const hpStorageToken = "SWTORHP";

var inputText = document.getElementById("inputText");
var outputText = document.getElementById("outputText");

var btnPanelBack = document.getElementById("btnPanelBack");
var btnPanelForward = document.getElementById("btnPanelForward");
var btnCopyOutput = document.getElementById("btnCopyOutput");

var outputTracker = document.getElementById("outputTracker");
var notesField = document.getElementById("notes");

var sectionStatus = localStorage.getItem(sectionStorageToken) || 0;

var textPrefix;
var textChunks;
var curPanel;

// === Splitter ===
function setCurrentPanel(newPanel) {
  if ((newPanel < 0) || (newPanel >= textChunks.length)) return;

  curPanel = newPanel;
  btnPanelBack.disabled = (curPanel <= 0);
  btnPanelForward.disabled = (curPanel >= textChunks.length - 1);
  outputTracker.innerHTML = (curPanel + 1) + "/" + textChunks.length;

  var tmpOutput = textPrefix;
  if (curPanel > 0) tmpOutput += "+ ";
  tmpOutput += textChunks[curPanel];
  if (curPanel < textChunks.length - 1) tmpOutput += " +";

  outputText.value = tmpOutput;
}

function processInput(e) {
  if (e.target.value) {
    textPrefix = "/e ";
    var inputMe = e.target.value;
    textChunks = [];

    // Detect slash prefix
    if (inputMe.startsWith("/")) {
      textPrefix = inputMe.substring(0, inputMe.indexOf(" ") + 1);
      if (textPrefix.match(/^\/(e|ops|p|ra|s|y) $/g)?.length) {
        inputMe = inputMe.substring(textPrefix.length).trim();
      } else {
        if (textPrefix.length > 4) {
          textPrefix = "/e ";
          inputMe = inputMe.substring(1).trim();
        } else {
          inputMe = inputMe.substring(textPrefix.length).trim();
          textPrefix = "/s ";
        }
      }
    }

    var start = 0;
    var end = start + 253 - textPrefix.length;

    while (end < inputMe.length - 1) {
      while (inputMe[end] !== " ") {
        end--;
        if (end === start) {
          end = start + 251 - textPrefix.length;
          break;
        }
      }

      textChunks.push(inputMe.substring(start, end).trim());
      start = end;
      while ((start < inputMe.length - 1) && (inputMe[start] === " ")) start++;
      end = start + 251 - textPrefix.length;
    }

    textChunks.push(inputMe.substring(start));
    setCurrentPanel(0);
    btnCopyOutput.removeAttribute("disabled");
  } else {
    btnPanelBack.disabled = true;
    btnPanelForward.disabled = true;
    btnCopyOutput.disabled = true;
    outputTracker.innerHTML = "0/0";
    outputText.value = "";
  }
}

// === Collapsible Sections ===
function initializeSections() {
  var closeButtons = document.querySelectorAll(".closeButton button");
  closeButtons.forEach((element, index) => {
    element.addEventListener("click", () => { toggleSection(index); });
    if (sectionStatus & (1 << index)) {
      toggleSection(index, false);
    }
  });
}

function toggleSection(index, doUpdate = true) {
  var currentSection = document.querySelectorAll(".closeButton")[index].parentElement;
  var currentClasses = currentSection.className.split(" ");

  if (currentClasses.indexOf("closed") > -1) {
    currentSection.className = currentClasses.filter(e => e !== "closed").join(" ");
    currentSection.querySelector(".closeButton button").innerHTML = "-";
    sectionStatus &= ~(1 << index);
  } else {
    currentSection.className = currentClasses.join(" ") + " closed";
    currentSection.querySelector(".closeButton button").innerHTML = "+";
    sectionStatus |= (1 << index);
  }

  if (doUpdate) {
    localStorage.setItem(sectionStorageToken, sectionStatus);
  }
}

inputText.addEventListener("change", processInput);
btnPanelBack.addEventListener("click", () => setCurrentPanel(curPanel - 1));
btnPanelForward.addEventListener("click", () => setCurrentPanel(curPanel + 1));
btnCopyOutput.addEventListener("click", () => navigator.clipboard.writeText(outputText.value));

notesField.value = localStorage.getItem(noteStorageToken);
notesField.addEventListener("change", () => {
  localStorage.setItem(noteStorageToken, notesField.value);
});

// === HP Tracker ===
document.addEventListener("DOMContentLoaded", () => {
  const hpValue = document.getElementById("hpValue");
  const hpPlus = document.getElementById("hpPlus");
  const hpMinus = document.getElementById("hpMinus");
  const hpSet = document.getElementById("hpSet");
  const hpBar = document.getElementById("hpBar");

  let currentHP = 0;
  let maxHP = 0;
  let hpInitialized = false;

  const savedHP = parseInt(localStorage.getItem(hpStorageToken), 10);
  const savedMax = parseInt(localStorage.getItem(hpStorageToken + "_max"), 10);
  if (!isNaN(savedHP) && savedHP >= 0) {
    currentHP = savedHP;
    hpInitialized = true;
  }
  if (!isNaN(savedMax) && savedMax > 0) maxHP = savedMax;

  function updateBar() {
    if (!hpBar) return;
    if (!hpInitialized || maxHP <= 0) {
      hpBar.style.width = "0%";
      hpBar.style.background = "linear-gradient(90deg, #400000, #600000)";
      return;
    }
    let percent = (currentHP / maxHP) * 100;
    percent = Math.max(0, Math.min(100, percent));
    hpBar.style.width = `${percent}%`;

    if (currentHP === 0) {
      hpBar.style.background = "linear-gradient(90deg, #400000, #600000)";
    } else if (percent < 25) {
      hpBar.style.background = "linear-gradient(90deg, #800000, #a00000)";
    } else if (percent < 70) {
      hpBar.style.background = "linear-gradient(90deg, #a04000, #c09020)";
    } else {
      hpBar.style.background = "linear-gradient(90deg, #c0a040, #ffe080)";
    }
  }

  function updateHP(newHP) {
    currentHP = Math.max(0, newHP);
    if (hpValue) hpValue.value = currentHP;
    localStorage.setItem(hpStorageToken, currentHP);
    updateBar();
  }

  hpSet.addEventListener("click", () => {
    const val = parseInt(hpValue.value, 10);
    if (!isNaN(val) && val > 0) {
      maxHP = val;
      currentHP = val;
      hpInitialized = true;
      localStorage.setItem(hpStorageToken + "_max", maxHP);
      updateHP(currentHP);
    }
  });

  hpPlus.addEventListener("click", () => {
    if (!hpInitialized) return;
    updateHP(currentHP + 1);
  });

  hpMinus.addEventListener("click", () => {
    if (!hpInitialized) return;
    updateHP(currentHP - 1);
  });

  hpValue.addEventListener("input", e => {
    if (!hpInitialized) return;
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v)) updateHP(v);
  });

  updateBar();
});

// === Compact Damage Calculator ===
document.addEventListener("DOMContentLoaded", () => {
  const calcBtn = document.getElementById('calcDamageBtn');
  const resultEl = document.getElementById('damageResult');

  if (!calcBtn || !resultEl) return;

  calcBtn.addEventListener('click', () => {
    const yourRoll = parseInt(document.getElementById('yourRoll').value) || 0;
    const enemyRoll = parseInt(document.getElementById('enemyRoll').value) || 0;
    const playerCrit = document.getElementById('critCheckPlayer').checked;
    const enemyCrit = document.getElementById('critCheckEnemy').checked;

    let playerDamage = 0;
    let enemyDamage = 0;

    // Base roll logic
    if (yourRoll > enemyRoll) {
      playerDamage = 1 + Math.floor((yourRoll - enemyRoll) / 10);
      if (playerCrit) playerDamage += 1;
    } else if (enemyRoll > yourRoll) {
      enemyDamage = 1 + Math.floor((enemyRoll - yourRoll) / 10);
      if (enemyCrit) enemyDamage += 1;
    }

    // Crits always deal 1 damage, even if they lose
    if (playerCrit && enemyRoll >= yourRoll) playerDamage = Math.max(playerDamage, 1);
    if (enemyCrit && yourRoll >= enemyRoll) enemyDamage = Math.max(enemyDamage, 1);

    // Output summary
    if (playerDamage === 0 && enemyDamage === 0) {
      resultEl.textContent = "No damage dealt — tie!";
    } else if (playerDamage > 0 && enemyDamage > 0) {
      resultEl.textContent = `⚔️ You deal ${playerDamage} dmg • You take ${enemyDamage} dmg (Trade)`;
    } else if (playerDamage > 0) {
      resultEl.textContent = `🟥 You deal ${playerDamage} dmg`;
    } else {
      resultEl.textContent = `🟦 You take ${enemyDamage} dmg`;
    }
  });
});

initializeSections();
