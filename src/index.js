import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { config } from 'dotenv';

import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import firebase from 'firebase-admin';
import uuidv5 from 'uuid/v5';

config();

const env = functions.config();

if (env.NODE_ENV === 'development') {
    firebase.initializeApp({
        databaseURL: env.DATABASE_URL,
    });
} else {
    firebase.initializeApp();
}

const database = firebase.database();

const app = express();

// add cors whitelist
const whitelist = ['https://formplex.firebaseapp.com'];
const corsOptionsDelegate = (req, callback) => {
    let corsOptions;
    if (whitelist.indexOf(req.header('Origin')) !== -1) {
        corsOptions = { origin: true }
    } else {
        corsOptions = { origin: false }
    }
    callback(null, corsOptions)
};

app.use(cors(corsOptionsDelegate));

// UUID v5 helper function
const UUIDv5 = (data) => {
    /* add user's first_name with current datetime to create a very unique string;
     the probability of collision is like 0.00000000000000000000000000000000000000000000
     000000000000000000000 X 10 raised to power minus 1 billion %, hehe :)
     */
    const string = `${data} ${new Date(Date.now())}`;

    return uuidv5(string, uuidv5.DNS);
};

// helper function to add entry
const addEntry = (req) => {
    const user = req.body;

    return database.ref('users/').push({
        ...user,
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

// read all entries
app.get("/", (req, res) => {
    readEntries(req, res);
});


// post an entry
app.post('/', (req, res) => {
    addEntry(req)
        .then(() => res.status(201).send(req.body))
        .catch(err => res.status(500).send(err.message));
});

exports.users = functions.https.onRequest(app);

exports.addUUID = functions.database.ref('/users/{child_ID}')
    .onCreate((snapshot) => {
        const originalData = snapshot.val();

        return snapshot.ref.update({
            _id: UUIDv5(originalData['first_name']),
        });
    });
