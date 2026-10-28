// pet.js
export const DEFAULT_PET = {
  name: "Reading Buddy",

  hunger: 100,
  mood: 100,
  hygiene: 100,
  social: 100,
  energy: 100,

  lastUpdated: Date.now(),
  //evolutionStage: 1,

  inventory: []
};

export function loadPet(callback) {
  chrome.storage.sync.get(
    ["pet"],
    (data) => {
    const pet =
      data.pet || { ...DEFAULT_PET };


      updatePetDecay(pet);
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

      const levelEl =
        document.querySelector(".pet-level");

      if (levelEl) {
        levelEl.textContent =
          `Level ${data.level || 1}`;
      }

      const coins = document.getElementById("petCoins");

      if (coins) {
        coins.textContent = data.coins || 0;
      }

      const levelLabel = document.getElementById("pet-level-label");
      const levelBar = document.getElementById("pet-level-bar");

      const currentXp = data.xp || 0;
      const requiredXp = data.required || 100;

      if (levelLabel) {
        levelLabel.textContent =
          `${currentXp} / ${requiredXp} XP`;
      }

      if (levelBar) {
        levelBar.style.width =
          `${Math.min(
            100,
            (currentXp / requiredXp) * 100
          )}%`;
      }
    }
  );

  // Pet name
  const petName =
    document.querySelector(".pet-title strong");

  if (petName) {
    petName.textContent = pet.name;
  }

  // Pet mood label
  const mood = document.getElementById("petMood");

  if (mood) {mood.textContent = getPetMood(pet);}

  // Pet status text
  const status = document.getElementById("petStatus");

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
    return "Hungry";
  if (pet.energy < 25)
    return "Sleepy";
  if (pet.social < 25)
    return "Lonely";
  if (pet.hygiene < 25)
    return "Dirty";
  if (pet.mood > 80)
    return "Happy";
  if (pet.mood > 50)
    return "Content";
  return "Sad";
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


// Reward/raise certain stats after user reads:
// Pet gains happiness + social + energy because the user read
export function rewardPetForReading( pet, session) {
  pet.mood =
    Math.min( 
      100, pet.mood + 
      Math.ceil(session.xpGained / 5)
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

// Helper for coins, mood adds or decreases amount fo coins earned 
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