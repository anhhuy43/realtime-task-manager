import admin from "firebase-admin";
import dotenv from "dotenv";
import serviceAccount from "./firebase-admin.json" assert { type: "json" };

dotenv.config();

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("Firebase Admin SDK initialized successfully.");
} catch (error) {
  console.error(
    "Failed to parse Firebase service account key or initialize Firebase:",
    error
  );
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

export { db, auth, admin };
