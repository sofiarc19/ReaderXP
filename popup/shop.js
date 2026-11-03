import { savePet, renderPet } from "./pet";
import { SHOP_ITEMS } from "./shopItems";

export function buyItem(pet, state, item, quantity = 1) {
  pet.inventory ??= [];
  const totalCost =
    item.price * quantity;

  if (state.coins < totalCost) {
    return false;
  }

  state.coins -= totalCost;
  state.totalCoinsSpent += totalCost;

  const existing = pet.inventory.find(
    i => i.id === item.id
  );

  if (existing) {
    existing.quantity += quantity;
  } else {
    pet.inventory.push({
      id: item.id,
      name: item.name,
      icon: item.icon,
      description: item.description,
      price: item.price,
      effects: item.effects,
      quantity
    });
  }

  return true;
}

export function renderShopCategory(category, pet, state) {
  console.log("[SHOP] Category:", category);
  
  const shopGrid = document.getElementById("shopGrid");

  if (!shopGrid) return;
  console.log("[SHOP] Grid:", shopGrid);

  if (category === "Accessories") {shopGrid.innerHTML = `
      <div class="shop-coming-soon">
        <strong>Accessories Coming Soon</strong>
      </div>`;
    return;
  }
  if (category === "Decor") {shopGrid.innerHTML = `
      <div class="shop-coming-soon">
        <strong>Room + Decor Coming Soon</strong>
      </div>`;
    return;
  }
  const items = SHOP_ITEMS[category] || [];
  console.log("[SHOP] Items:", items);

  shopGrid.innerHTML = items.map(item => `
    <button class="shop-item" data-item="${item.id}">
      <span class="shop-item-icon">
        <img src="${item.icon}" alt="${item.name}">
      </span>
      <div>
        <strong>${item.name}</strong>
        <small>${item.description}</small>
      </div>

      <small><i>$</i>${item.price}</small>
    </button>
  `).join("");

  shopGrid.querySelectorAll(".shop-item")
    .forEach(button => {
    button.addEventListener("click", () => {

      const itemId = button.dataset.item;
      const item = items.find(i => i.id === itemId);

      if (!item) return;
      const details = document.getElementById("shopDetails");

        if (!details) return;

        details.classList.remove("hidden");

        details.innerHTML = `
          <div class="shop-details-header">
            <img src="${item.icon}" alt="${item.name}">
            <h4>${item.name}</h4>
          </div>

          <p>${item.description}</p>
          <p>Price: $${item.price}</p>

          <div class="shop-buy-actions">
            <button id="buyOne">
              Buy 1
            </button>

            <button id="buyFive">
              Buy 5
            </button>
          </div>`;

        document
          .getElementById("buyOne")?.addEventListener(
            "click",() => {
              purchaseItem(item, 1, state);
          });

        document
          .getElementById("buyFive")?.addEventListener(
            "click",() => {
              purchaseItem(item, 5, state);
          });

    });
  });
}

function showShopMessage(text) {
  const msg = document.getElementById("shopMessage");
  document.getElementById("shopMessage")
    ?.classList.remove("hidden");
  if (!msg) return;
  msg.textContent = text;

  setTimeout(() => {
    if (
      msg.textContent === text
    ) {
      msg.textContent = "";
      document.getElementById("shopMessage")
        ?.classList.add("hidden");
    }
  }, 3000);
}

function purchaseItem(item, quantity,state) {

  loadPet((pet) => {
    const success =
      buyItem(pet, state, item, quantity);

    if (!success) {
      showShopMessage("Not enough coins!");
      return;
    }

    savePet(pet);

    chrome.storage.sync.set({
      coins: state.coins,
      totalCoinsSpent:
      state.totalCoinsSpent
    });

    updateCoinsUI(state);
    renderInventory(pet);

    showShopMessage(`Purchased ${quantity} ${item.name}!`);
  });
}

export function updateCoinsUI(state) {
  const petCoins = document.getElementById("petCoins");

  const shopCoins = document.getElementById("shopCoins");

  if (petCoins) {
    petCoins.textContent =
      state.coins;
  }

  if (shopCoins) {
    shopCoins.textContent =
      state.coins;
  }
}

export function renderInventory(pet) {
  const container = document.getElementById("inventoryList");

  const details = document.getElementById("inventoryDetails");

  if (!container) return;

  if (!pet.inventory || pet.inventory.length === 0) {
    container.innerHTML = "No items owned yet.";

    if (details) {
      details.innerHTML ="Select an item.";
    }
    return;
  }

  container.innerHTML = pet.inventory.map(item => `
    <button class="inventory-item" data-item="${item.id}">
      <span>
        <img class="inventory-icon" src="${item.icon}" alt="${item.name}">
        ${item.name}
      </span>
      <span>x${item.quantity}</span>
    </button>
  `).join("");

  container.querySelectorAll(".inventory-item")
    .forEach(button => {
      button.addEventListener("click", () => {

          const itemId = button.dataset.item;
          const item = pet.inventory.find(
            i => i.id === itemId
          );

          if (!item || !details) {
            return;
          }
          // Fix the item icon generation
          details.innerHTML = `
            <h4>
              <span>
                <img class="inventory-icon" src="${item.icon}" alt="${item.name}">
                ${item.name}
              </span>
            </h4>
            <p>${item.description}</p>
            <p>Owned: ${item.quantity}</p>
            <button id="useItem">
              Use Item
            </button>`;

          document.getElementById("useItem")?.addEventListener
            ("click",() => {
            const success = useInventoryItem(pet, item.id);

            if (!success) {
              return;
            }

            renderInventory(pet);
            renderPet(pet);
            details.innerHTML = "<p>Item used!</p>";    
          });
      });
  });
}

export function useInventoryItem(pet, itemId) {
  pet.inventory ??= [];
  const item = pet.inventory.find(i => i.id === itemId);

  if (!item) {
    return false;
  }

  Object.entries(item.effects || {}).forEach(
    ([stat, amount]) => {
      if (typeof pet[stat] === "number") {
        pet[stat] = Math.min(100, pet[stat] + amount);
      }
  });

  item.quantity--;

  if (item.quantity <= 0) {
    pet.inventory = pet.inventory.filter(i => i.id !== itemId);
  }

  savePet(pet);
  return true;
}

// Spend coins not for items 
export function spendCoins(amount, callback) {
  chrome.storage.sync.get(["coins"], (state) => {
    state.coins ??= 0;

    if (state.coins < amount) {
      callback(false);
      return;
    }

    state.coins -= amount;
    chrome.storage.sync.set({
      coins: state.coins
    }, () => {
        callback(true, state);
    });
  });
}