import { initReader, updateReaderPopupStats, updateLifeTimeStats, validateReaderState } from "./popupReader";
import {loadPet, renderPet, savePet, careForPet, updatePetUI } from "./pet";
import { renderShopCategory, renderInventory, updateCoinsUI, spendCoins} from "./shop";
import { initSessions } from "./popupSession";
import { $, $$ } from "../content/utils";
import { api} from "./popupUtils";

async function loadCurrentArticleTitle() {
  const tabs = await new Promise((resolve) => {
    api.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      resolve
    );
  });

  const title =
    tabs?.[0]?.title ||
    "Unknown Article";

  const articleTitle =
    $(".article-title");

  if (articleTitle) {
    articleTitle.textContent = title;
  }
}

function initPetUI() {
  $("#carePet")?.addEventListener("click", () => {
    console.log("[PET] Care button clicked");
      loadPet((pet) => {
        const result = careForPet(pet);

        if (!result.success) {
          alert(result.reason);
          return;
        }

        // Spend the coins required for Care For Pet
        spendCoins(result.price, (success, state) => {
          if (!success) {
            alert("Not enough coins.");
            return;
          }

          savePet(pet);
          updatePetUI(pet);
          renderPet(pet);
          updateCoinsUI(state);
        });
      });
    });  
   
    $("#savePetName")?.addEventListener("click", () => {
      const input = document.getElementById("petNameInput");
      const name = input?.value?.trim();
    
      if (!name || name.length < 2) {
        alert("Please enter a name at least 2 characters long.");
        return;
      }
    
      loadPet((pet) => {
        pet.name = name.substring(0, 20);
        savePet(pet);
        
        input.value = "";
        renderPet(pet);
        updatePetUI(pet);
      });
    });
      
    $("#openInventory")?.addEventListener("click", () => {
      loadPet((pet) => {
        renderInventory(pet);

        document.getElementById("inventoryPanel")
          ?.classList.toggle("hidden");
    });
  });

  document.addEventListener("click", (e) => {
    const petEffects = $("#petEffects");

    if (petEffects && petEffects.contains(e.target)) {
      $("#effectsTooltip")?.classList.toggle("visible");

      e.stopPropagation();
      return;
    }

    $("#effectsTooltip")
      ?.classList.remove("visible");
  });
}

function initShopUI() {
  loadPet((pet) => {

    chrome.storage.sync.get(
      ["coins", "totalCoinsSpent"], (state) => {

        state.coins ??= 0;
        state.totalCoinsSpent ??= 0;

        // Initial shop render
        renderShopCategory("Food", pet, state);

        $$(".shop-categories button").forEach((btn) => {
          btn.addEventListener("click", () => {
            // Update active button
            $$(".shop-categories button").forEach((b) =>
              b.classList.remove("active"));
              btn.classList.add("active");

              const category = btn.dataset.shop;
              // Refresh state so coin count is always current
              chrome.storage.sync.get(["coins", "totalCoinsSpent"],
                (freshState) => {
                  freshState.coins ??= 0;
                  freshState.totalCoinsSpent ??= 0;

                  renderShopCategory(category, pet, freshState);
                  // $("#shopCategoryLabel").textContent =
                  //   `Showing ${category.toLowerCase()} items`;
              });
          });
        });
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadCurrentArticleTitle();
  await validateReaderState();

  initReader();
  initSessions();

  initPetUI();
  initShopUI();

  // Reader popup stats
  updateReaderPopupStats();
  updateLifeTimeStats();
  
  setInterval(() => {
    updateReaderPopupStats();
  }, 1000);

  // Pet
  loadPet((pet) => {
    console.log("[PET] Rendering:", pet);
    updatePetUI(pet);
    renderPet(pet);
    renderInventory(pet);
  });
  chrome.storage.sync.get(
    ["coins", "totalCoinsEarned", "totalCoinsSpent"],
    (state) => {

      state.coins ??= 15;
      state.totalCoinsEarned ??= 15;
      state.totalCoinsSpent ??= 0;

      chrome.storage.sync.set({
        coins: state.coins,
        totalCoinsEarned: state.totalCoinsEarned,
        totalCoinsSpent: state.totalCoinsSpent
      });

      updateCoinsUI(state);
    }
  );
});