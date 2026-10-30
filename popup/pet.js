// pet.js
export const DEFAULT_PET = {
  name: "Pet name",

  hunger: 100,
  mood: 100,
  hygiene: 100,
  social: 100,
  energy: 100,

  lastUpdated: Date.now(),
  //evolutionStage: 1,

  inventory: []
};

const PET_ANIMATIONS = {
  idle: {
    sheet: "Idle.png",
    frames: 10,
    frameWidth: 96,
    width: 96,
    height: 100,
    //speed: 250
  },
  idle2: {
    sheet: "Idle2.png",
    frames: 10,
    frameWidth: 96
  },
  content: {
    sheet: "Box1.png",
    frames: 4,
    frameWidth: 96
  },
  cry: {
    sheet: "Cry.png",
    frames: 8,
    frameWidth: 96
  },
  dance: {
    sheet: "Dance.png",
    frames: 4,
    frameWidth: 96
  },
  starving: {
    sheet: "catsick1.png",
    frames: 5,
    frameWidth: 96
  },
  mad: {
    sheet: "catsick2.png",
    frames: 4,
    frameWidth: 96
  },
  waiting: {
    sheet: "Waiting.png",
    frames: 6,
    frameWidth: 96
  },
  sad: {
    sheet: "Sad.png",
    frames: 9,
    frameWidth: 96
  },
  sleepy: {
    sheet: "Sleepy.png",
    frames: 8,
    frameWidth: 96
  },
  superLow: {
    sheet: "DeadCat.png",
    frames: 1,
    frameWidth: 96
  },
  surprised: {
    sheet: "Surprised.png",
    frames: 12,
    frameWidth: 96
  },
};

//let animationStarted = false;
let animationInterval = null;

export function loadPet(callback) {
  chrome.storage.sync.get(
    ["pet"],
    (data) => {
    const pet =
      data.pet || { ...DEFAULT_PET };


      updatePetDecay(pet);
      //updatePetUI(pet);
      savePet(pet);
      callback(pet);
    }
  );
}

export function savePet(pet) {
  chrome.storage.sync.set({ pet });
}

export function renderPet(pet) {
  // Reader level becomes pet level
  console.log(
    "[PET] Rendering:",
    pet
  );
  chrome.storage.sync.get(
    ["level", "coins", "xp", "required"],
    (data) => {
      const currentLevel =
        data.level ?? 1;

      const currentXp =
        data.xp ?? 0;

      const requiredXp =
        data.required ?? 100;

      const stageLevelEl =
        document.querySelector(".pet-level");

      if (stageLevelEl) {
        stageLevelEl.textContent =
          `Level ${currentLevel}`;
      }

      // Pet level
      const currentLevelEl =
        document.getElementById(
          "pet-current-level"
        );

      if (currentLevelEl) {
        currentLevelEl.textContent =
          `Level ${currentLevel}`;
      }

      // XP display
      const xpEl =
        document.getElementById(
          "pet-current-xp"
        );

      if (xpEl) {
        xpEl.textContent =
          `${currentXp} / ${requiredXp} XP`;
      }

      // XP progress bar
      const levelBar =
        document.getElementById(
          "pet-level-bar"
        );

      if (levelBar) {
        levelBar.style.width =
          `${Math.min(
            100,
            (currentXp / requiredXp) * 100
          )}%`;
      }

      // Coins
      const coinsEl =
        document.getElementById(
          "petCoins"
        );

      if (coinsEl) {
        coinsEl.textContent =
          data.coins ?? 0;
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
      status.textContent =
        "Needs a snack";
    }
    else if (pet.energy < 25) {
      status.textContent =
        "Feeling sleepy";
    }
    else if (pet.social < 25) {
      status.textContent =
        "Wants some attention";
    }
    else if (pet.hygiene < 25) {
      status.textContent =
        "Needs a bath";
    }
    else {
      status.textContent =
        "Happy and ready to read";
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
    bar.style.width =
      `${rounded}%`;
  }

  if (label) {
    label.textContent =
      `${rounded}%`;
  }
}

function getPetMood(pet) {
  if (pet.hunger < 25)
    return "Starving";
  if (pet.energy < 25)
    return "Sleepy";
  if (pet.social < 25)
    return "Waiting";
  if (pet.hygiene < 25)
    return "Surprised";
  if (pet.mood > 80)
    return "Dance";
  if (pet.mood > 50)
    return "Content";
  return "Sad";
}

export function updatePetUI(pet) {
  const mood = getPetMood(pet);

  const moodEl =
    document.getElementById("petMood");

  if (moodEl) {
    moodEl.textContent = mood;
  }

  switch (mood) {
    case "Starving":
      setPetState("starving");
      break;

    case "Sleepy":
      setPetState("sleepy");
      break;

    case "Waiting":
      setPetState("waiting");
      break;

    case "Surprised":
      setPetState("surprised");
      break;

    case "Dance":
      setPetState("dance");
      break;

    case "Content":
      setPetState("content");
      break;

    case "Sad":
      setPetState("sad");
      break;
  }
}

export function setPetState(state) {
  startPetAnimation(state);
}

// Currently after ~24 hours away:
// Hunger -48, Energy -24, Social -24, Mood -24, Hygiene  -12
// Pet doesn't die or anything it will just be upset/hungry but once 
// user comes back to take care of it, it can recover 
export function updatePetDecay(pet) {
  const now = Date.now();
  const hoursPassed = (now - pet.lastUpdated) /(1000 * 60 * 60);

  pet.hunger = Math.max(0, pet.hunger - hoursPassed * 2);
  pet.energy = Math.max(0, pet.energy - hoursPassed * 1);
  pet.social = Math.max(0, pet.social - hoursPassed * 1);

  pet.hygiene = Math.max(0,pet.hygiene - hoursPassed * 0.5);
  // Mood depends on hunger energy social hygiene if those are low mood will be low as well
  if (
    pet.hunger < 25 ||
    pet.energy < 25 ||
    pet.social < 25 ||
    pet.hygiene < 25
  ) {
    pet.mood = Math.max(0, pet.mood - 5);
  }
  pet.lastUpdated = now;
}

// Temp button that raises these  stats
export function careForPet(pet) {
  pet.hunger =
    Math.min(100, pet.hunger + 15);
  pet.hygiene =
    Math.min(100, pet.hygiene + 10);
  pet.energy =
    Math.min(100, pet.energy + 5);
  pet.social =
    Math.min(100, pet.social + 10);
  pet.mood =
    Math.min(100, pet.mood + 5);
}


//Reward raise certain stats after user reads:
//Pet gains happiness + social + energy because the user read
export function rewardPetForReading( pet, session) {
  pet.mood =
    Math.min( 
      100, pet.mood + 
      Math.ceil(session.xpGained / 10)
    );
    pet.social =
      Math.min(
        100, pet.social + 5
      );
    pet.energy =
      Math.min(
        100, pet.energy + 3
      );
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

export function startPetAnimation(
  animation = "idle"
) {
  const petSprite =
    document.getElementById("petSprite");

  if (!petSprite) return;

  const config =
    PET_ANIMATIONS[animation];

  if (!config) return;

  if (animationInterval) {
    clearInterval(animationInterval);
  }

  petSprite.style.backgroundImage =
    `url("../popup/assets/cat/${config.sheet}")`;

  petSprite.style.backgroundPositionX = "0px";
  let frame = 0;

  petSprite.style.width = `${config.width ?? 96}px`;
  petSprite.style.height = `${config.height ?? 100}px`;

  animationInterval = setInterval(() => {
    petSprite.style.backgroundPositionX =
      `-${frame * config.frameWidth}px`;

    frame = (frame + 1) % config.frames;
  }, 150);
}


// Helper
window.inspectSprite = (file, frames) => {
  const img = new Image();

  img.src =
    `assets/cat/${file}`;

  img.onload = () => {
    const frameWidth =
      img.width / frames;

    const scale =
      96 / img.height;

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