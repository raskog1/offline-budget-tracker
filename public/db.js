let db;

const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function(event) {
  // Local db variable does not exist outside of this function
  const db = event.target.result;
  const pending = db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function(event) {
  // Assigning global db variable here
  db = event.target.result;

  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function(event) {
  console.log("Unable to create a new collection");
};

// Offline function for adding an entry into indexedDB
function saveRecord(record) {
  const transaction = db.transaction(["pending"], "readwrite");
  const pendingStore = transaction.objectStore("pending");

  pendingStore.add(record);
}

// Function for checking for items in an indexedDB database, adding them
// to our main database, and clearing indexedDB
function checkDatabase() {
  const transaction = db.transaction(["pending"], "readwrite");
  const pendingStore = transaction.objectStore("pending");
  const getAll = pendingStore.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then(() => {
          const transaction = db.transaction(["pending"], "readwrite");
          const pendingStore = transaction.objectStore("pending");

          const clearStore = pendingStore.clear();
          clearStore.onsuccess = function(event) {
            console.log("Back online, and databases have been synced");
          };
        });
    }
  };
}

window.addEventListener("online", checkDatabase);
