import { getDocs, collection } from 'firebase/firestore';
import { db } from '../firebaseConfig.js';

export const fetchEvents = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'events'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

export const getRandomEvents = (events, count) => {
  if (!Array.isArray(events) || events.length === 0) return [];
  const shuffled = [...events].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};