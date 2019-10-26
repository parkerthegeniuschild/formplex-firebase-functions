import 'core-js/stable';
import 'regenerator-runtime/runtime';

import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import firebase from 'firebase-admin';
import uuidv5 from 'uuid/v5';

firebase.initializeApp();

const app = express();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});

app.use(cors());

const database = firebase.database();

// UUID v5 helper function
const UUIDv5 = (data) => {

    // add user's first_name with current time to create a very unique string
    const string = `${data} ${new Date(Date.now())}`;
    return uuidv5(string, uuidv5.DNS);
};

// helper function to add entry
const addEntry = (req) => {
    const user = req.body;
    const { first_name } = req.body;
    user['_id']  = UUIDv5(first_name);

    return database.ref(`users/${user['_id']}/`).set({
        ...user
    });
};

// helper function to read entries
const readEntries = (req, res) => {
    database.ref().on("value", snapshot => {
        return res.status(200).send(snapshot.val());
    }, err => {
        return res.status(500).send(err.message);
    });
};

// post an entry
app.post('/', (req, res) => {
    addEntry(req)
        .then(() => res.status(201).send(req.body))
        .catch(err => res.status(500).send(err.message));
});

// read all entries
app.get("/", (req, res) => {
    readEntries(req, res);
});

exports.users = functions.https.onRequest(app);
