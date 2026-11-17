import { PET_ANIMATIONS } from "./petAnimations";
import { $ } from "../content/utils";
// pet.js
export const DEFAULT_PET = {
  name: null,

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
      const stageLevelEl = $(".pet-level");

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
  const petName = $(".pet-title strong");

  if (petName) {
    petName.textContent = pet.name || "Unnamed Pet";
  }

  const namingPrompt = document.getElementById("petNamingPrompt");
  if (namingPrompt) {
    namingPrompt.classList.toggle("hidden", !!pet.name);
  }

  // Pet mood
  const mood = getPetStats(pet);
  const moodEl = document.getElementById("petMood");

  if (moodEl) {
    const label = moodEl.querySelector(".pet-label");
    if (label) {
      label.textContent = mood;
    }
  }

  // Mood tooltip content
  const moodTooltip = document.getElementById("moodTooltip");

  if (moodTooltip) {
    moodTooltip.innerHTML = `
      <strong>${mood}</strong>
      ${getPetGuidance(pet)}<br><br>

      <strong>Stats: </strong>
      Hunger: ${Math.round(pet.hunger)}%<br>
      Energy: ${Math.round(pet.energy)}%<br>
      Social: ${Math.round(pet.social)}%<br>
      Hygiene: ${Math.round(pet.hygiene)}%<br>
      Mood: ${Math.round(pet.mood)}%
    `;
  }

  // Pet activity
  const activityEl = document.getElementById("petActivity");

  if (activityEl) {
    const label = activityEl.querySelector(".pet-label");
    if (label) {
      label.textContent = pet.activity || "Idle";
    }
  }

  // Activity tooltip content
  const activityTooltip = document.getElementById("activityTooltip");

  if (activityTooltip) {
    activityTooltip.innerHTML = `
      <strong>${pet.activity || "Idle"}</strong>
      ${getActivityDescription(pet.activity, pet)}
    `;  
  }

  updateEffectsUI(pet);

  // Pet stat bars
  updatePetBar("pet-hunger-bar", "pet-hunger-value", pet.hunger);
  updatePetBar("pet-mood-bar", "pet-mood-value", pet.mood);
  updatePetBar("pet-hygiene-bar", "pet-hygiene-value", pet.hygiene);
  updatePetBar("pet-social-bar", "pet-social-value", pet.social);
  updatePetBar("pet-energy-bar", "pet-energy-value", pet.energy);
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

function getPetGuidance(pet) {
  const mood = getPetStats(pet);

  const petName = pet?.name || "Your pet";

  const lowest = [
    { name: "hunger", value: pet.hunger },
    { name: "energy", value: pet.energy },
    { name: "social", value: pet.social },
    { name: "hygiene", value: pet.hygiene },
    { name: "mood", value: pet.mood },
  ].sort((a, b) => a.value - b.value)[0];

  switch (mood) {
    case "Happy":
      return `${petName} is thriving and enjoying life. Keep reading and caring for them to maintain that happiness.`;

    case "Content":
      return pickRandom([
        `${petName} is feeling content and relaxed.`,
        `${petName} seems comfortable but could use a little extra attention.`,
        `${petName} is doing well overall, though ${lowest.name} is starting to fall behind.`,
      ]);

    case "Tired":
      return `${petName} is running low on energy and could use some rest.`;

    case "Lonely":
      return `${petName} feels lonely and would appreciate some attention.`;

    case "Hungry":
      return `${petName} is hungry and would love something to eat.`;

    case "Sad":
      return `${petName}'s spirits are low. Improving their needs should help them feel better.`;

    case "Uncomfortable":
      return `${petName} isn't feeling comfortable right now. ${lowest.name} is only at ${Math.round(lowest.value)}%.`;

    case "Sick":
      return `${petName} is feeling sick because several needs have dropped too low.`;

    case "Weary":
      return `${petName} is exhausted. Most needs are critically low and require urgent attention.`;

    case "Neglected":
      return `${petName} has been neglected for too long and needs immediate care.`;

    default:
      return `${petName} is quietly observing the world.`;
  }
}

function getActivityDescription(activity, pet) {
  const petName = pet?.name || "your pet";

  const descriptions = {
    Dancing: `${petName} is full of energy and celebrating.`,
    Excited: `Something has ${petName} feeling especially happy.`,
    Relaxing: `${petName} is taking it easy.`,
    Observing: `${petName} is watching the world around it.`,
    Sleeping: `${petName} is recovering energy.`,
    Yawning: `${petName} is getting sleepy.`,
    Waiting: `${petName} is hoping for attention.`,
    Staring: `${petName} seems lonely.`,
    Crying: `${petName} is feeling down.`,
    Moping: `${petName} isn't having a great day.`,
    Angry: `${petName} is frustrated by unmet needs.`,
    Annoyed: `Something is bothering ${petName}.`,
    Refusing: `${petName} is unhappy and doesn't want to cooperate.`,
    "Life Support": `${petName} is in very poor condition and needs help immediately.`,
    Fever: `${petName} is feeling sick and needs some care.`,
    Coma: `${petName} has been neglected for too long and needs immediate care.`,
  };

  return descriptions[activity] ?? `${petName} is doing its own thing.`;
}

function getPetStats(pet){ //Send out why they are the animation they are (what they can do to up the stats )
  const problems = [];

  // Activities: Happy, Content, Tired, Lonely, Sad, Sick, defualt/idle 
  const totalStats = pet.hunger + pet.energy + pet.social + pet.hygiene + pet.mood;
  const statMap = [
    { value: pet.hunger, mood: "Hungry" },
    { value: pet.energy, mood: "Tired" },
    { value: pet.social, mood: "Lonely" },
    { value: pet.hygiene, mood: "Uncomfortable" },
    { value: pet.mood, mood: "Sad" },
  ];

  const lowest = [...statMap].sort((a, b) => a.value - b.value)[0];
  
  // if (totalStats <= 100){
  //     if (pet.hunger <= 10 && pet.energy <= 10 && pet.social <= 10 && pet.hygiene <= 10)
  //       return "Neglected";
  //   return "Sick"; 
  if (totalStats <= 150) {
    if (totalStats === 0) {
      return "Neglected";
    }

    if (totalStats <= 50) {
      return "Weary";
    }

    if (totalStats <= 75) {
      return "Sick";
    }

    return lowest.mood;
  } else if (totalStats < 250) {
    // higher chance of returning something other that content at 250
    if (pet.hunger <= 50) 
      problems.push("Hungry");  
    if (pet.energy <= 50)
      problems.push("Tired");
    if (pet.social <= 50)
      problems.push("Lonely");
    if (pet.hygiene <= 50)
      problems.push("Uncomfortable");
    if (pet.mood <= 50) 
      problems.push("Sad");
    if (problems.length) {
      if (totalStats >= 200 && totalStats < 250){ //might cause error
        problems.push("Content");
      }
      return pickRandom(problems);
    }  
  } else if (totalStats <= 300) {
    // higher chance of returning something other that content at 300
    if (pet.hunger <= 30) 
      problems.push("Hungry");
    if (pet.energy <= 30)
      problems.push("Tired");
    if (pet.social <= 30)
      problems.push("Lonely");
    if (pet.hygiene <= 30)
      problems.push("Uncomfortable");
    if (pet.mood <= 30) 
      problems.push("Sad");
    if (problems.length) {
      problems.push("Content");
      return pickRandom(problems);
    } 
    return "Content";
  } else if (totalStats < 425) {
    // small chance of returning anything other than content at 425
    if (pet.hunger <= 15) 
      problems.push("Hungry"); 
    if (pet.energy <= 15)
      problems.push("Tired");
    if (pet.social <= 15)
      problems.push("Lonely");
    if (pet.hygiene <= 15)
      problems.push("Uncomfortable");
    if (pet.mood <= 15)
      problems.push("Sad");
    if (problems.length) {
      problems.push("Content");
      return pickRandom(problems);
    }
    return "Content";
  } if (totalStats >= 425){
    return "Happy";
  }
  return "Content";
}

// Pick random activity from base stats
function rollPetActivity(pet) {
  const mood = getPetStats(pet);
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
        "Box",
        "Box2",
        "Box3",
        "Shy",
        "Paw"
      ]);

    case "Tired":
      return pickRandom([
        "Yawning",
        "Sleeping"
      ]);

    case "Lonely":
      return pickRandom([
        "Waiting",
        "Staring",
      ]);

    case "Hungry":
      return pickRandom([
        "Angry",
        "Annoyed",
        "Refusing",
      ]);

    case "Mad":
      return pickRandom([
        "Angry",
        "Annoyed",
        "Refusing",
      ]);

    case "Uncomfortable": 
      return pickRandom([
        "Angry",
        "Annoyed",
        "Crying",
        "Surprised"
      ]);

    case "Sad":
      return pickRandom([
        "Moping",
        "Crying"
      ]);

    case "Sick":
      return pickRandom([
        "Fever"
      ]);

    case "Weary":
      return pickRandom([
        "Life Support"
      ]);

    case "Neglected":
      return pickRandom([
        "Coma"
      ]);

    default:
      return "Content";
  }
}

function updatePetActivity(pet) {
  const now = Date.now();
  const mood = getPetStats(pet);

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
  updateEffectsUI(pet);

  const mood = getPetStats(pet);
  const activity = pet.activity;

  const moodTooltip = document.getElementById("moodTooltip");

  if (moodTooltip) {
    moodTooltip.innerHTML = `
      <strong>${mood}</strong>
      ${getPetGuidance(pet)}<br><br>
      <strong>Stats:</strong>
      Hunger: ${Math.round(pet.hunger)}%<br>
      Energy: ${Math.round(pet.energy)}%<br>
      Social: ${Math.round(pet.social)}%<br>
      Hygiene: ${Math.round(pet.hygiene)}%<br>
      Mood: ${Math.round(pet.mood)}%
    `;
  }

  const activityTooltip = document.getElementById("activityTooltip");

  if (activityTooltip) {
    activityTooltip.innerHTML = `
      <strong>${activity || "Idle"}</strong>
      ${getActivityDescription(activity, pet)}
    `;
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
    case "Box2":
      setPetState("box2");
      break;
    case "Box3":
      setPetState("box3");
      break;
    case "Shy":
      setPetState("shy");
      break;
    case "Paw":
      setPetState("paw");
      break;
    // Tired:
    case "Yawning":
      setPetState("sleepy");
      break;
    case "Sleeping":
      setPetState("sleep");
      break;
    // Lonely:
    case "Staring":
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
    case "Life Support":
      setPetState("sick1");
      break;
    case "Fever":
      setPetState("sick2");
      break;
     case "Coma":
      setPetState("dead");
      break;
    // Mad:
    case "Angry":
      setPetState("angry");
      break;
    case "Annoyed":
      setPetState("annoyed");
      break;
    case "Refusing":
      setPetState("refusing");
      break;
    // Other:
    case "Eating":
      setPetState("eating");
      break;
    case "Surprised":
      setPetState("surprised");
      break;
  }
  console.log("[PET]", "Mood:", mood, "Activity:", activity);
}

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
  if (!config.frames) return;

  if (animationInterval) {
    clearInterval(animationInterval);
  }

  petSprite.style.backgroundImage = `url("../popup/assets/cat/${config.sheet}")`;

  petSprite.style.width = `${config.width ?? 96}px`;

  petSprite.style.height = `${config.height ?? 96}px`;

  const frameWidth = config.frameWidth ?? 96;
  const frameHeight = config.frameHeight ?? 96;
  const row = config.row ?? 0;
  const startFrame = config.startFrame ?? 0;

  let scale = 1;

  // Multi-animation sheet
  if (config.sheet === "AnimationSheet.png") {
    scale = 3;

    petSprite.style.backgroundSize =
      `${512 * scale}px ${800 * scale}px`;
  } else {
    petSprite.style.backgroundSize = "";
  }

  let frame = 0;

  // Show first frame immediately
  const initialX = startFrame * frameWidth * scale;
  const initialY = row * frameHeight * scale;

  petSprite.style.backgroundPosition = `-${initialX}px -${initialY}px`;

  animationInterval = setInterval(() => {
    const currentFrame = startFrame + frame;

    const x = currentFrame * frameWidth * scale;
    const y = row * frameHeight * scale;

    petSprite.style.backgroundPosition = `-${x}px -${y}px`;

    frame = (frame + 1) % config.frames;
  }, 150);

  console.log("[PET]", {
    animation,
    row,
    frameWidth,
    frameHeight,
    startFrame,
    frames: config.frames
  });
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

// Button that raises these  stats
export const CARE_PRICE = 10;

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
  pet.mood = Math.min(100, pet.mood + 10);

  return {
    success: true,
    price: CARE_PRICE
  };
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

export function getActiveEffects(pet) {
  const modifiers = [];
  const passives = [];

  const coinMultiplier = getMoodCoinMultiplier(pet);

  if (coinMultiplier > 1) {
    modifiers.push(
      `Happy Mood (+${Math.round((coinMultiplier - 1) * 100)}% Coin Rewards)`
    );
  }

  if (coinMultiplier < 1) {
    modifiers.push(
      `Low Mood (-${Math.round((1 - coinMultiplier) * 100)}% Coin Rewards)`
    );
  }

  passives.push(
    "Reading sessions grant +1 Mood and +1 Social"
  );

  passives.push(
    `Daily Reading Rewards Remaining: ${
      MAX_DAILY_READING_REWARDS - pet.dailyReadingRewards
    }/${MAX_DAILY_READING_REWARDS}`
  );

  return {
    activeCount: modifiers.length,
    passiveCount: passives.length,
    totalCount: modifiers.length + passives.length,
    modifiers, passives
  };
}

function pickRandom(items) {
  return items[
    Math.floor(Math.random() * items.length)
  ];
}

// effects helper 
function updateEffectsUI(pet) {
  const effectsEl = document.getElementById("petEffects");

  if (!effectsEl) return;

  const effects = getActiveEffects(pet);

  effectsEl.innerHTML = `
    Effects: ${effects.totalCount}
    <div id="effectsTooltip" class="effects-tooltip">
      <strong>Active Effects (${effects.activeCount})</strong>

      ${effects.modifiers.length? effects.modifiers
        .map(effect => `<div>• ${effect}</div>`).join("")
        : "<div>• No active effects.</div>"
      }
      <br>
      <strong>Passive Effects (${effects.passiveCount})</strong>
      ${effects.passives.length? effects.passives
        .map(effect => `<div>• ${effect}</div>`).join("")
        : "<div>• No passive effects.</div>"
      }
    </div>
  `;
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

// Animation test 
window.testPetAnimation = (animation) => {
  console.log("Testing animation:", animation);
  setPetState(animation);
}; // Just run: testPetAnimation("box3");

//Configured animations 
window.listPetAnimations = () => {
  console.table(Object.keys(PET_ANIMATIONS));
  const img = new Image();
img.src = "assets/cat/AnimationSheet.png";
img.onload = () => {
  console.log(img.width, img.height);
};
}; //run: listPetAnimations();