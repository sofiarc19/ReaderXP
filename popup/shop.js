function spendCoins(cost) {

  if (state.coins < cost) {
    return false;
  }

  state.coins -= cost;

  state.totalCoinsSpent += cost;

  chrome.storage.sync.set({
    coins: state.coins,
    totalCoinsSpent: state.totalCoinsSpent,
  });

  return true;
}