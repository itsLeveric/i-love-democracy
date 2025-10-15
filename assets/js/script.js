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

function setCurrentPanel(newPanel) {
	if ((newPanel < 0) || (newPanel >= textChunks.length)) {
		return;
	}

	curPanel = newPanel;

	if (curPanel > 0) {
		btnPanelBack.removeAttribute("disabled");
	} else {
		btnPanelBack.setAttribute("disabled", true);
	}

	if (curPanel < textChunks.length - 1) {
		btnPanelForward.removeAttribute("disabled");
	} else {
		btnPanelForward.setAttribute("disabled", true);
	}

	outputTracker.innerHTML = (curPanel + 1) + "/" + textChunks.length;

	var tmpOutput = textPrefix;

	if (curPanel > 0) {
		tmpOutput += "+ ";
	}

	tmpOutput += textChunks[curPanel];

	if (curPanel < textChunks.length - 1) {
		tmpOutput += " +";
	}

	outputText.value = tmpOutput;
}

function processInput(e) {
	if (e.target.value) {
		textPrefix = "/e ";
		var inputMe = e.target.value;
		textChunks = [];

		// Determine which slash prefix we should be using.
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

		// Loop to break apart input text...
		while (end < inputMe.length - 1) {
			// Find end of last word, or if we can't, bite off the whole chunk.
			while (inputMe[end] !== " ") {
				end--;

				if (end === start) {
					end = start + 251 - textPrefix.length;
					break;
				}
			}

			textChunks.push(inputMe.substring(start, end).trim());

			// Set up the next go in the loop.
			start = end;

			while ((start < inputMe.length - 1) && (inputMe[start] === " ")) {
				start++;
			}

			end = start + 251 - textPrefix.length;
		}

		// Finally, grab the last piece.
		textChunks.push(inputMe.substring(start));

		setCurrentPanel(0);
		btnCopyOutput.removeAttribute("disabled");
	} else {
		btnPanelBack.setAttribute("disabled", true);
		btnPanelForward.setAttribute("disabled", true);
		btnCopyOutput.setAttribute("disabled", true);
		outputTracker.innerHTML = "0/0";
		outputText.value = "";
	}
}

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
		currentSection.className = currentClasses.filter(element => element !== "closed").join(" ");
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

btnPanelBack.addEventListener("click", () => { setCurrentPanel(curPanel - 1); });
btnPanelForward.addEventListener("click", () => { setCurrentPanel(curPanel + 1); });
btnCopyOutput.addEventListener("click", () => { navigator.clipboard.writeText(outputText.value); });

notesField.value = localStorage.getItem(noteStorageToken);

notesField.addEventListener("change", () => { localStorage.setItem(noteStorageToken, notesField.value); })

// === HP Tracker (no max, but can’t go below 0) with “Set HP” ===
document.addEventListener("DOMContentLoaded", () => {
  const hpValue = document.getElementById("hpValue");
  const hpPlus = document.getElementById("hpPlus");
  const hpMinus = document.getElementById("hpMinus");
  const hpSet = document.getElementById("hpSet");
  const hpBar = document.getElementById("hpBar");

  let currentHP = 0;
  let maxHP = 0;
  let hpInitialized = false;

  // Load saved
  const savedHP = parseInt(localStorage.getItem(hpStorageToken), 10);
  const savedMax = parseInt(localStorage.getItem(hpStorageToken + "_max"), 10);
  if (!isNaN(savedHP) && savedHP >= 0) {
    currentHP = savedHP;
    hpInitialized = true;
  }
  if (!isNaN(savedMax) && savedMax > 0) {
    maxHP = savedMax;
  }

  console.log("Loaded from storage:", { savedHP, savedMax, currentHP, maxHP, hpInitialized });

  function updateBar() {
    if (!hpBar) {
      console.error("hpBar is null, cannot draw bar");
      return;
    }
    if (!hpInitialized || maxHP <= 0) {
      hpBar.style.width = "0%";
      hpBar.style.background = "linear-gradient(90deg, #400000, #600000)";
      hpBar.style.boxShadow = "none";
      console.log("updateBar: not initialized or no maxHP, fallback. currentHP:", currentHP);
      return;
    }
    let percent = (currentHP / maxHP) * 100;
    if (percent > 100) percent = 100;
    if (percent < 0) percent = 0;

    console.log("updateBar: using maxHP logic — percent:", percent, "currentHP:", currentHP, "maxHP:", maxHP);

    hpBar.style.width = `${percent}%`;

    if (currentHP === 0) {
      hpBar.style.background = "linear-gradient(90deg, #400000, #600000)";
      hpBar.style.boxShadow = "0 0 5px #600000";
    } else if (percent < 25) {
      hpBar.style.background = "linear-gradient(90deg, #800000, #a00000)";
      hpBar.style.boxShadow = "0 0 6px #a00000";
    } else if (percent < 70) {
      hpBar.style.background = "linear-gradient(90deg, #a04000, #c09020)";
      hpBar.style.boxShadow = "0 0 8px #c09020";
    } else {
      hpBar.style.background = "linear-gradient(90deg, #c0a040, #ffe080)";
      hpBar.style.boxShadow = "0 0 10px #ffe080";
    }
  }

  function updateHP(newHP) {
    currentHP = Math.max(0, newHP);
    if (hpValue) {
      hpValue.value = currentHP;
    }
    localStorage.setItem(hpStorageToken, currentHP);
    console.log("updateHP: set currentHP to", currentHP);
    updateBar();
  }

  hpSet.addEventListener("click", () => {
    const val = parseInt(hpValue.value, 10);
    console.log("hpSet click, input value:", hpValue.value, "parsed:", val);
    if (!isNaN(val) && val > 0) {
      maxHP = val;
      currentHP = val;
      hpInitialized = true;
      localStorage.setItem(hpStorageToken + "_max", maxHP);
      console.log("hpSet: new maxHP:", maxHP);
      updateHP(currentHP);
    } else {
      console.warn("hpSet click: invalid value", val);
    }
  });

  hpPlus.addEventListener("click", () => {
    console.log("hpPlus click: hpInitialized:", hpInitialized, "currentHP:", currentHP);
    if (!hpInitialized) return;
    updateHP(currentHP + 1);
  });

  hpMinus.addEventListener("click", () => {
    console.log("hpMinus click: hpInitialized:", hpInitialized, "currentHP:", currentHP);
    if (!hpInitialized) return;
    updateHP(currentHP - 1);
  });

  hpValue.addEventListener("input", e => {
    console.log("hpValue input event:", e.target.value, "hpInitialized:", hpInitialized);
    if (!hpInitialized) return;
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v)) {
      updateHP(v);
    }
  });

  // Initial draw
  updateBar();
});

// === Damage Calculator ===
document.getElementById('calcDamageBtn').addEventListener('click', () => {
  const yourRoll = parseInt(document.getElementById('yourRoll').value) || 0;
  const enemyRoll = parseInt(document.getElementById('enemyRoll').value) || 0;
  const crit = document.getElementById('critCheck').checked;

  let damage = 0;

  if (yourRoll > enemyRoll) {
    damage = 1; // base damage for winning
    if (crit) damage += 1; // +1 for natural crit
    const diff = yourRoll - enemyRoll;
    damage += Math.floor(diff / 10); // +1 per 10-point difference
  }

  document.getElementById('damageResult').textContent = `Damage: ${damage}`;
});

initializeSections();

