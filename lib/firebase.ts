import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import {
    Firestore,
    getFirestore,
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager
} from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAg6gh-Uxfp9J6lkmsuvYFjloledQZItmY",
    authDomain: "travel-agency-69260.firebaseapp.com",
    projectId: "travel-agency-69260",
    storageBucket: "travel-agency-69260.firebasestorage.app",
    messagingSenderId: "499714729222",
    appId: "1:499714729222:web:9872b945e18c1d1c0eaa87"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Initialize Firebase - handle both server and client
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);

    // Only use persistence on client side
    if (typeof window !== 'undefined') {
        db = initializeFirestore(app, {
            localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager()
            })
        });
    } else {
        db = getFirestore(app);
    }
} else {
    app = getApp();
    auth = getAuth(app);
    db = getFirestore(app);
}

export { auth, db };
