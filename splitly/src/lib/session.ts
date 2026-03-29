import {doc, getDoc, onSnapshot, serverTimestamp, setDoc, Timestamp, updateDoc} from 'firebase/firestore';
import {db} from './firebase';
import {Person, ReceiptItem, Session} from '@/types';

const SESSIONS_COLLECTION = 'sessions';

// Create a new session
export async function createSession(): Promise<string> {
    const sessionId = generateSessionId();
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);

    const newSession: Session = {
        id: sessionId,
        receiptImageUrl: null,
        items: [],
        persons: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    await setDoc(sessionRef, {
        ...newSession,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    return sessionId;
}

// Get a session by ID
export async function getSession(sessionId: string): Promise<Session | null> {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (sessionSnap.exists()) {
        return sessionSnap.data() as Session;
    }
    return null;
}

// Update receipt image URL
export async function updateReceiptImage(sessionId: string, imageUrl: string): Promise<void> {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
    await updateDoc(sessionRef, {
        receiptImageUrl: imageUrl,
        updatedAt: serverTimestamp(),
    });
}

// Update items
export async function updateItems(sessionId: string, items: ReceiptItem[]): Promise<void> {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
    await updateDoc(sessionRef, {
        items,
        updatedAt: serverTimestamp(),
    });
}

// Update persons
export async function updatePersons(sessionId: string, persons: Person[]): Promise<void> {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
    await updateDoc(sessionRef, {
        persons,
        updatedAt: serverTimestamp(),
    });
}

// Add a person
export async function addPerson(sessionId: string, name: string): Promise<void> {
    const session = await getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const newPerson: Person = {
        id: Date.now().toString(),
        name,
    };

    await updatePersons(sessionId, [...session.persons, newPerson]);
}

// Remove a person
export async function removePerson(sessionId: string, personId: string): Promise<void> {
    const session = await getSession(sessionId);
    if (!session) throw new Error('Session not found');

    // Remove person from persons list
    const updatedPersons = session.persons.filter(p => p.id !== personId);

    // Remove person from all item assignments
    const updatedItems = session.items.map(item => ({
        ...item,
        assignedTo: item.assignedTo.filter(id => id !== personId),
    }));

    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
    await updateDoc(sessionRef, {
        persons: updatedPersons,
        items: updatedItems,
        updatedAt: serverTimestamp(),
    });
}

// Toggle item assignment
export async function toggleItemAssignment(
    sessionId: string,
    itemId: string,
    personId: string
): Promise<void> {
    const session = await getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const updatedItems = session.items.map(item => {
        if (item.id === itemId) {
            const isAssigned = item.assignedTo.includes(personId);
            return {
                ...item,
                assignedTo: isAssigned
                    ? item.assignedTo.filter(id => id !== personId)
                    : [...item.assignedTo, personId],
            };
        }
        return item;
    });

    await updateItems(sessionId, updatedItems);
}

// Subscribe to session changes
export function subscribeToSession(
    sessionId: string,
    callback: (session: Session) => void
): () => void {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);

    return onSnapshot(sessionRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.data() as Session);
        }
    });
}

// Generate a random session ID
function generateSessionId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}
