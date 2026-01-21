const admin = require("firebase-admin");
const serviceAccount = require("../config/firebaseKey.json");

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const db = admin.firestore();
module.exports = { admin, db };