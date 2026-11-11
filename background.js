// Normalize Chrome / Firefox APIs
const api = globalThis.browser || globalThis.chrome;

let lastSelection = "";

// api.runtime.onMessage.addListener(
//   (msg, sendResponse) => {
//     switch (msg.action) {
//       case "store-selection": {
//         lastSelection = msg.text?.trim() || "";

//         console.log(
//           "[SELECTION] Stored:",
//           lastSelection.slice(0, 100)
//         );

//         // sendResponse({ success: true });
//         return true;
//       }

//       case "get-selection": {
//         sendResponse({
//           text: lastSelection,
//           hasSelection: !!lastSelection
//         });

//         return true;
//       }

//       case "clear-selection": {
//         lastSelection = "";

//         sendResponse({success: true});
//         return true;
//       }

//       default:
//         return false;
//     }
//   }
// );