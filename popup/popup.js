import { initReader, updateReaderPopupStats, updateLifeTimeStats, validateReaderState } from "./popupReader";
import {loadPet, renderPet, savePet, careForPet, updatePetUI } from "./pet";
import { initSessions } from "./popupSession";
import { api, $, $$ } from "./popupUtils";

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
    document.querySelector(".article-title");

  if (articleTitle) {
    articleTitle.textContent = title;
  }
}

function initPetUI(){
  // Pet Panel
  $("#carePet")?.addEventListener("click", () => {

    loadPet((pet) => {
      careForPet(pet);
      updatePetUI(pet);
      renderPet(pet);
    });
  });
}

function initShopUI(){
  // Shop
  $$(".shop-categories button").forEach(
    
    (btn) => {
      btn.addEventListener("click", () => {
        $$(".shop-categories button")
          .forEach((b) =>
            b.classList.remove("active")
        );
      
        btn.classList.add("active");
        const category = btn.dataset.shop.toLowerCase();
        
        $("#shopCategoryLabel").textContent =`Showing ${category} items`;
      });
    }
  );
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
    console.log(
    "[PET] Rendering:",
    pet
  );
    updatePetUI(pet);
    renderPet(pet);
  });
});