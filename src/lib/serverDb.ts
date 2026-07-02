import { MongoClient, Db } from "mongodb";
import fs from "fs";
import path from "path";

// Types
interface UserDoc {
  uid: string;
  email: string;
  passwordHash: string; // Plain-text or simple base64 encoded for prototype security
  displayName: string;
  createdAt: string;
}

interface SessionDoc {
  id: string;
  userId: string;
  title: string;
  jobRole: string;
  category: string;
  isCompleted: boolean;
  currentQuestionIndex: number;
  createdAt: string;
  updatedAt?: string;
  questions: any[];
  answers: Record<string, any>;
  score?: any;
}

// Global DB references
let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;

// Local DB path (for local dev fallback)
const DATA_DIR = path.join(process.cwd(), "data");
const LOCAL_DB_PATH = path.join(DATA_DIR, "db.json");

// In-memory cache for local fallback
interface LocalStoreSchema {
  users: Record<string, UserDoc>; // uid -> user
  sessions: Record<string, SessionDoc[]>; // userId -> sessions[]
}

let localStore: LocalStoreSchema = {
  users: {},
  sessions: {}
};

/**
 * Initializes local storage fallback
 */
function initLocalStorage() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const data = fs.readFileSync(LOCAL_DB_PATH, "utf8");
      localStore = JSON.parse(data);
    } else {
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(localStore, null, 2), "utf8");
    }
  } catch (err) {
    console.error("Failed to initialize local JSON storage fallback:", err);
  }
}

function saveLocalStorage() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(localStore, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to persist local JSON storage:", err);
  }
}

/**
 * Connect to Database
 */
export async function connectDb(): Promise<{ isMongo: boolean }> {
  const uri = process.env.MONGODB_URI;
  if (uri) {
    try {
      console.log("Connecting to MongoDB Atlas...");
      mongoClient = new MongoClient(uri);
      await mongoClient.connect();
      mongoDb = mongoClient.db("aura_placement_prep");
      console.log("Successfully connected to MongoDB database.");
      return { isMongo: true };
    } catch (err) {
      console.error("MongoDB Connection error. Falling back to Local JSON database:", err);
      initLocalStorage();
      return { isMongo: false };
    }
  } else {
    console.log("No MONGODB_URI found. Initializing Local JSON database fallback.");
    initLocalStorage();
    return { isMongo: false };
  }
}

/**
 * Helper to get MongoDB collections
 */
function getMongoCollection(name: string) {
  if (!mongoDb) throw new Error("Database not connected");
  return mongoDb.collection(name);
}

/**
 * Register a User
 */
export async function registerUser(email: string, passwordPlain: string, displayName: string): Promise<Omit<UserDoc, "passwordHash">> {
  const cleanEmail = email.trim().toLowerCase();
  const uid = "u_" + Math.random().toString(36).substring(2, 15);
  // Simple base64 encoding to avoid plaintext in files, but safe for mock environments
  const passwordHash = Buffer.from(passwordPlain).toString("base64");
  const createdAt = new Date().toISOString();

  const userObj: UserDoc = {
    uid,
    email: cleanEmail,
    passwordHash,
    displayName: displayName || cleanEmail.split("@")[0],
    createdAt
  };

  const isMongo = !!mongoDb;

  if (isMongo) {
    const usersCol = getMongoCollection("users");
    const existing = await usersCol.findOne({ email: cleanEmail });
    if (existing) {
      throw new Error("This email is already registered.");
    }
    await usersCol.insertOne(userObj);
  } else {
    // Check local store
    const existing = Object.values(localStore.users).find(u => u.email === cleanEmail);
    if (existing) {
      throw new Error("This email is already registered.");
    }
    localStore.users[uid] = userObj;
    saveLocalStorage();
  }

  return {
    uid,
    email: cleanEmail,
    displayName: userObj.displayName,
    createdAt
  };
}

/**
 * Login a User
 */
export async function loginUser(email: string, passwordPlain: string): Promise<Omit<UserDoc, "passwordHash">> {
  const cleanEmail = email.trim().toLowerCase();
  const inputHash = Buffer.from(passwordPlain).toString("base64");
  const isMongo = !!mongoDb;

  if (isMongo) {
    const usersCol = getMongoCollection("users");
    const userDoc = (await usersCol.findOne({ email: cleanEmail })) as unknown as UserDoc | null;
    if (!userDoc || userDoc.passwordHash !== inputHash) {
      throw new Error("Invalid email or password.");
    }
    return {
      uid: userDoc.uid,
      email: userDoc.email,
      displayName: userDoc.displayName,
      createdAt: userDoc.createdAt
    };
  } else {
    const userDoc = Object.values(localStore.users).find(u => u.email === cleanEmail && u.passwordHash === inputHash);
    if (!userDoc) {
      throw new Error("Invalid email or password.");
    }
    return {
      uid: userDoc.uid,
      email: userDoc.email,
      displayName: userDoc.displayName,
      createdAt: userDoc.createdAt
    };
  }
}

/**
 * Get Sessions
 */
export async function getSessions(userId: string): Promise<any[]> {
  const isMongo = !!mongoDb;

  if (isMongo) {
    const sessionsCol = getMongoCollection("sessions");
    const cursor = sessionsCol.find({ userId });
    const docs = await cursor.toArray();
    // Sort by createdAt descending
    return docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else {
    const list = localStore.sessions[userId] || [];
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

/**
 * Save Session
 */
export async function saveSession(userId: string, session: any): Promise<void> {
  const isMongo = !!mongoDb;
  const sessionDoc: SessionDoc = {
    ...session,
    userId,
    updatedAt: new Date().toISOString()
  };

  if (isMongo) {
    const sessionsCol = getMongoCollection("sessions");
    await sessionsCol.updateOne(
      { id: session.id, userId },
      { $set: sessionDoc },
      { upsert: true }
    );
  } else {
    if (!localStore.sessions[userId]) {
      localStore.sessions[userId] = [];
    }
    const list = localStore.sessions[userId];
    const index = list.findIndex(s => s.id === session.id);
    if (index >= 0) {
      list[index] = sessionDoc;
    } else {
      list.push(sessionDoc);
    }
    saveLocalStorage();
  }
}

/**
 * Delete Session
 */
export async function deleteSession(userId: string, sessionId: string): Promise<void> {
  const isMongo = !!mongoDb;

  if (isMongo) {
    const sessionsCol = getMongoCollection("sessions");
    await sessionsCol.deleteOne({ id: sessionId, userId });
  } else {
    if (localStore.sessions[userId]) {
      localStore.sessions[userId] = localStore.sessions[userId].filter(s => s.id !== sessionId);
      saveLocalStorage();
    }
  }
}
