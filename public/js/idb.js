const { get, ServerResponse } = require("http");

// create variable to hold db connection
let db;
// establish a connection to IndexedDB database called 'budget' and set it to version 1
const request = indexedDB.open('budget', 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function (event) {
    // save a reference to the database 
    const db = event.target.result;
    // create an object store (table) called `transactions`, set it to have an auto incrementing primary key of sorts 
    db.createObjectStore('transactions', { autoIncrement: true });
};

// upon a successful 
request.onsuccess = function (event) {
    // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
    db = event.target.result;

    // check if app is online, if yes run uploadPizza() function to send all local db data to api
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
    const transaction = db.transaction(['transaction'], 'readwrite');

    // access  object store
    const store = transaction.objectStore('transaction');

    // get all records from store and set to a variable
    const getAll = pizzaObjectStore.getAll();

    //after a successful getAll, run this function
    getAll.onsuccess = function () {
        //send any data in indexDB store to the api server
        if (getAll.result.length > 0) {
            fetch('/api/budget', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }

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