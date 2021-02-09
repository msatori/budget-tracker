const indexedDB =
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB ||
    window.shimIndexedDB;


// create variable to hold db connection
let db;
// establish a connection to IndexedDB database called 'budget' and set it to version 1
const request = indexedDB.open('budget', 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function ({target}) {
    // save a reference to the database 
    const db = target.result;
    // create an object store (table) called `transactions`, set it to have an auto incrementing primary key of sorts 
    db.createObjectStore('transactions', { autoIncrement: true });
};

// upon a successful 
request.onsuccess = function ({target}) {
    // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
    db = target.result;

    // check if app is online, if yes run uploadAction() function to send all local db data to api
    if (navigator.onLine) {
        uploadAction();
    }
};

request.onerror = function (event) {
    // log error here
    console.log(event.target.errorCode);
};

// This function will be executed if we attempt to submit a new transaction and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['transactions'], 'readwrite');

    // access the object store for `new_pizza`
    const store = transaction.objectStore('transactions');

    // add record to store with add method
    store.add(record);
}

function uploadAction() {


    // open a transaction on db
    const transaction = db.transaction(['transactions'], 'readwrite');

    // access  object store
    const store = transaction.objectStore('transactions');

    // get all records from store and set to a variable
    const getAll = store.getAll();

    //after a successful getAll, run this function
    getAll.onsuccess = function () {
        //send any data in indexDB store to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': "application/json"
                }
            })
                .then(response => { return response.json() })
                .then(() => {
                   
                    //open one more transaction
                    const transaction = db.transaction(['transactions'], 'readwrite');

                    //access transactions object store
                    const store = transaction.objectStore('transactions');

                    //clear all items in store
                    store.clear();

                    alert('All transactions have been updated');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
};

// listen for app coming back online
window.addEventListener('online', uploadAction());