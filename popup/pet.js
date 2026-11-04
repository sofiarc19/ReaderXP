import { PET_ANIMATIONS } from "./petAnimations";
// pet.js
export const DEFAULT_PET = {
  name: "Pet name",

  hunger: 100,
  mood: 100,
  hygiene: 100,
  social: 100,
  energy: 100,

  activity: null,
  activityChangedAt: null,
  currentMood: null,

  dailyCareUses: 3,
  lastCareReset: Date.now(),

  dailyReadingRewards: 0,
  lastReadingReset: Date.now(),

  lastUpdated: Date.now(),
  //evolutionStage: 1,

  inventory: []
};

//let animationStarted = false;
let animationInterval = null;

export function loadPet(callback) {
  chrome.storage.sync.get(["pet"], (data) => {
    const pet = {...DEFAULT_PET, ...(data.pet || {})};

    if (pet.dailyCareUses === undefined) {
      pet.dailyCareUses = 3;
    }

    if (!pet.lastCareReset) {
      pet.lastCareReset = Date.now();
    }
    resetDailyCare(pet);
    resetDailyRewards(pet);
      
    updatePetDecay(pet);
    savePet(pet);
    callback(pet);

  });
}

export function savePet(pet) {
  chrome.storage.sync.set({ pet });
}

export function renderPet(pet) {
  // Reader level becomes pet level
  console.log("[PET] Rendering:", pet);

  chrome.storage.sync.get(["level", "coins", "xp", "required"],
    (data) => {
      const currentLevel = data.level ?? 1;
      const currentXp = data.xp ?? 0;
      const requiredXp = data.required ?? 100;
      const stageLevelEl = document.querySelector(".pet-level");

      if (stageLevelEl) {
        stageLevelEl.textContent = `Level ${currentLevel}`;
      }

      // Pet level
      const currentLevelEl = document.getElementById("pet-current-level");

      if (currentLevelEl) {
        currentLevelEl.textContent = `Level ${currentLevel}`;
      }

      // XP display
      const xpEl = document.getElementById("pet-current-xp");

      if (xpEl) {
        xpEl.textContent = `${currentXp} / ${requiredXp} XP`;
      }

      // XP progress bar
      const levelBar = document.getElementById("pet-level-bar");

      if (levelBar) {
        levelBar.style.width =
          `${Math.min(100, requiredXp > 0 ? (currentXp / requiredXp) * 100 : 0)}%`;
      }

      // Care Button
      const careInfo =document.getElementById("careInfo");

      if (careInfo) {
        careInfo.textContent =`$10 • ${pet.dailyCareUses}/3 uses`;
      }
    }
  );

  // Pet name
  const petName = document.querySelector(".pet-title strong");

  if (petName) {
    petName.textContent = pet.name;
  }

  // Pet mood label
  const mood = document.getElementById("petMood");

  if (mood) {mood.textContent = getPetMood(pet);}

  // Pet status text
  const status = document.getElementById("petThought");

  if (status) {
    if (pet.hunger < 25) {
      status.textContent = "Needs a snack";
    }
    else if (pet.energy < 25) {
      status.textContent = "Feeling sleepy";
    }
    else if (pet.social < 25) {
      status.textContent = "Wants some attention";
    }
    else if (pet.hygiene < 25) {
      status.textContent = "Needs a bath";
    }
    else {
      status.textContent = "Happy and ready to read";
    }
  }

  // Show stat percentages in tooltip/title
  updatePetBar("pet-hunger-bar", "pet-hunger-value", pet.hunger);
  updatePetBar("pet-mood-bar", "pet-mood-value", pet.mood);
  updatePetBar("pet-hygiene-bar", "pet-hygiene-value", pet.hygiene);
  updatePetBar("pet-social-bar", "pet-social-value", pet.social);
  updatePetBar("pet-energy-bar", "pet-energy-value", pet.energy);

  mood?.setAttribute(
    "title",
    `Hunger: ${Math.round(pet.hunger)}%
    Energy: ${Math.round(pet.energy)}%
    Social: ${Math.round(pet.social)}%
    Hygiene: ${Math.round(pet.hygiene)}%`
  );
}

function updatePetBar(barId, valueId, value) {
  const bar = document.getElementById(barId);
  const label = document.getElementById(valueId);
  const rounded = Math.round(value);

  if (bar) {
    bar.style.width = `${rounded}%`;
  }

  if (label) {
    label.textContent = `${rounded}%`;
  }
}

// Purely Emotional/Mood
function getPetMood(pet) {
  if (pet.hunger < 25)
    return "Sick"; // going to be angry 
  if (pet.energy < 25)
    return "Tired";
  if (pet.social < 25)
    return "Lonely";
  if (pet.hygiene < 25)
    return "Uncomfortable";
  if (pet.mood > 80)
    return "Happy";
  if (pet.mood > 50)
    return "Content";
  return "Sad";
}

function rollPetActivity(pet) {
  const mood = getPetMood(pet);
  // Update cases and returns 
  switch (mood) {
    case "Happy":
      return pickRandom([
        "Dancing",
        "Excited"
      ]);

    case "Content":
      return pickRandom([
        "Relaxing",
        "Observing",
        "Box"
      ]);

    case "Tired":
      return pickRandom([
        "Yawning",
        "Sleeping"
      ]);

    case "Lonely":
      return pickRandom([
        "Waiting",
        "Looking Around"
      ]);

    case "Sad":
      return pickRandom([
        "Moping",
        "Crying"
      ]);

    case "Sick":
      return pickRandom([
        "Sick",
        "Uncomfortable"
      ]);

    default:
      return "idle2";
  }
}

function updatePetActivity(pet) {
  const now = Date.now();
  const mood = getPetMood(pet);

  const moodChanged = pet.currentMood !== mood;

  const activityExpired = !pet.activityChangedAt ||
    now - pet.activityChangedAt > 300000;

  if (moodChanged || activityExpired || !pet.activity) {
    pet.activity = rollPetActivity(pet);
    pet.activityChangedAt = now;
    pet.currentMood = mood;

    savePet(pet);
  }
}

export function updatePetUI(pet) {
  updatePetActivity(pet);
  const mood = getPetMood(pet);
  const activity = pet.activity;

  const moodEl = document.getElementById("petMood");
  const activityEl = document.getElementById("petActivity");

  if (moodEl) {
    moodEl.textContent = mood;
  }
  if (activityEl) {
    activityEl.textContent = activity;
  }

  // case= emotion/mood setPetState("name of png")
  switch (activity) {
    default:
      setPetState("idle2");
      break;
    // Happy:
    case "Dancing":
      setPetState("dance");
      break;
    case "Excited":
      setPetState("excited");
      break;
    // Content: 
    case "Relaxing":
      setPetState("laydown");
      break;
    case "Observing":
      setPetState("idle2");
      break;
    case "Box":
      setPetState("box");
      break;
    // Tired:
    case "Yawning":
      setPetState("sleepy");
      break;
    case "Sleeping":
      setPetState("sleep");
      break;
    // Lonely:
    case "Looking Around":
      setPetState("idle");
      break;
    case "Waiting":
      setPetState("waiting");
      break;
    // Sad:
    case "Moping":
      setPetState("sad");
      break;
    case "Crying":
      setPetState("cry");
      break;
    // Sick:
    case "Sick":
      setPetState("sick1");
      break;
    case "Uncomfortable":
      setPetState("sick2");
      break;
    // Mad:
    // case "Mad":
    //   setPetState("angry");
    //   break;
    // Other:
    case "Eating":
      setPetState("eating");
      break;
    case "Surprised":
      setPetState("surprised");
      break;
    case "Negelected":
      setPetState("dead");
      break;
  }
  console.log("[PET]", "Mood:", mood, "Activity:", activity);}

export function setPetState(state) {
  startPetAnimation(state);
  console.log("[PET] Animation:", state);
}

export function startPetAnimation(
  animation = "idle") {
  const petSprite = document.getElementById("petSprite");

  if (!petSprite) return;

  const config = PET_ANIMATIONS[animation];

  if (!config) return;

  if (animationInterval) {
    clearInterval(animationInterval);
  }

  petSprite.style.backgroundImage = `url("../popup/assets/cat/${config.sheet}")`;

  petSprite.style.width = `${config.width ?? 96}px`;

  petSprite.style.height = `${config.height ?? 100}px`;

  let frame = 0;

  const frameWidth = config.frameWidth ?? 96;
  const frameHeight = config.frameHeight ?? 100;
  const row = config.row ?? 0;
  const startFrame = config.startFrame ?? 0;

  animationInterval = setInterval(() => {
    const currentFrame = startFrame + frame;

    const x = currentFrame * frameWidth;

    const y = row * frameHeight;

    petSprite.style.backgroundPosition = `-${x}px -${y}px`;

    frame = (frame + 1) % config.frames;
  }, 150);
}

export function updatePetDecay(pet) {
  const now = Date.now();
  const hoursPassed = (now - pet.lastUpdated) / (1000 * 60 * 60);

  // Core needs
  pet.hunger = Math.max(0, pet.hunger - hoursPassed * 2.5);
  pet.energy = Math.max(0, pet.energy - hoursPassed * 1.5);
  pet.social = Math.max(0, pet.social - hoursPassed * 1.0);
  pet.hygiene = Math.max(0, pet.hygiene - hoursPassed * 0.75);

  // Mood naturally drifts down
  let moodDecay = hoursPassed * 0.5;

  // Extra penalties
  if (pet.hunger < 25) moodDecay += hoursPassed * 2;
  if (pet.energy < 25) moodDecay += hoursPassed * 1.5;
  if (pet.social < 25) moodDecay += hoursPassed * 1;
  if (pet.hygiene < 25) moodDecay += hoursPassed * 1;

  pet.mood = Math.max( 0, pet.mood - moodDecay);

  pet.lastUpdated = now;
}

export const CARE_PRICE = 10;
// Temp button that raises these  stats
export function careForPet(pet) {
  if (pet.dailyCareUses <= 0) {
    return {
      success: false,
      reason:"No daily care uses remaining."
    };
  }

  pet.dailyCareUses--;

  pet.hunger = Math.min(100, pet.hunger + 10);
  pet.hygiene = Math.min(100, pet.hygiene + 10);
  pet.energy = Math.min(100, pet.energy + 10);
  pet.social = Math.min(100, pet.social + 10);
  pet.mood = Math.min(100, pet.mood + 3);

  return {
    success: true,
    price: CARE_PRICE
  };
}

//Reward raise certain stats after user reads:
//Pet gains happiness + social + energy because the user read
const MAX_DAILY_READING_REWARDS = 10;

export function rewardPetForReading(pet) {
  if (pet.dailyReadingRewards >= MAX_DAILY_READING_REWARDS) {
    return false;
  }

  pet.mood = Math.min(100, pet.mood + 1);
  pet.social = Math.min(100, pet.social + 1);
  pet.dailyReadingRewards++;

  return true;
}

export function resetDailyRewards(pet) {
  const now = Date.now();
  const lastReset = new Date(pet.lastReadingReset || now)
  const today = new Date(now);

  if (lastReset.toDateString() !== today.toDateString()) {
    pet.dailyReadingRewards = 0;
    pet.lastReadingReset = now;
  }
}

export function resetDailyCare(pet) {
  const now = Date.now();

  const lastReset = new Date(pet.lastCareReset || now);
  const today = new Date(now);

  const isNewDay =
    lastReset.toDateString() !==
    today.toDateString();

  if (isNewDay) {
    pet.dailyCareUses = 3;
    pet.lastCareReset = now;
  }
}

//Helper for coins, mood adds or decreases amount fo coins earned 
export function getMoodCoinMultiplier(pet) {
  if (pet.mood >= 80) {
    return 1.20;
  }
  if (pet.mood >= 50) {
    return 1.00;
  }
  if (pet.mood >= 25) {
    return 0.90;
  }
  return 0.80;
}

// Helper
window.inspectSprite = (file, frames) => {
  const img = new Image();

  img.src = `assets/cat/${file}`;

  img.onload = () => {
    const frameWidth = img.width / frames;

    const scale = 96 / img.height;

    console.log({
      imageWidth: img.width,
      imageHeight: img.height,
      frames,
      originalFrameWidth:
        frameWidth,
      scaledFrameWidth:
        frameWidth * scale
    });
  };
};

function pickRandom(items) {
  return items[
    Math.floor(Math.random() * items.length)
  ];
}