// import { addDoc, collection, doc, setDoc, Timestamp } from 'firebase/firestore';
// import { db } from '../firebase/firebase';

// function dayId(d: Date) {
//   const yyyy = d.getFullYear();
//   const mm = String(d.getMonth() + 1).padStart(2, '0');
//   const dd = String(d.getDate()).padStart(2, '0');
//   return `${yyyy}-${mm}-${dd}`;
// }

// function randInt(min: number, max: number) {
//   return Math.floor(Math.random() * (max - min + 1)) + min;
// }

// export async function devSeedInsightsData(userId: string, days = 120) {
//   const now = new Date();

//   // 1) Seed moods: users/{uid}/moods/{YYYY-MM-DD}
//   for (let i = 0; i < days; i++) {
//     const d = new Date(now);
//     d.setDate(d.getDate() - i);
//     d.setHours(21, randInt(0, 59), 0, 0); // approx evening entry

//     const mood = randInt(1, 5);
//     const id = dayId(d);

//     await setDoc(doc(db, 'users', userId, 'moods', id), {
//       dayId: id,
//       value: mood,
//       note: null,
//       updatedAt: Timestamp.fromDate(d),
//     });
//   }

//   // 2) Seed thought logs: users/{uid}/thoughtLogs/{autoId}
//   // Add more logs on low mood days to create correlation
//   for (let i = 0; i < days; i++) {
//     const d = new Date(now);
//     d.setDate(d.getDate() - i);

//     // decide logs/day
//     const logsToday = randInt(0, 4); // tweak
//     for (let j = 0; j < logsToday; j++) {
//       const t = new Date(d);
//       t.setHours(randInt(8, 23), randInt(0, 59), 0, 0);

//       const intensityBefore = randInt(3, 10);
//       const intensityAfter = Math.max(0, intensityBefore - randInt(0, 4));

//       await addDoc(collection(db, 'users', userId, 'thoughtLogs'), {
//         createdAt: Timestamp.fromDate(t),
//         intensityBefore,
//         intensityAfter,
//         // optional: thoughts/bodySensations ako ih imaš u šemi
//         // thoughts: 'seed',
//       });
//     }
//   }
// }


import { addDoc, collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';

function dayId(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const triggerWords = [
  'posao',
  'porodica',
  'novac',
  'zdravlje',
  'odnosi',
  'škola',
  'ispit',
  'veza',
  'samoća',
  'budućnost',
  'anksioznost',
  'stres',
  'umor',
  'pritisak',
  'ljudi',
  'vreme',
  'obaveze',
  'nemir',
];

const moodNotes = [
  'Bio dobar dan',
  'Loše spavao',
  'Mnogo posla',
  'Svađa sa nekim',
  'Lepo vreme',
  'Umoran ceo dan',
  'Uspeo nešto važno',
  'Nervozan bez razloga',
];

function randomText(): string {
  const numWords = randInt(3, 8);
  const words: string[] = [];
  for (let i = 0; i < numWords; i++) {
    words.push(triggerWords[randInt(0, triggerWords.length - 1)]);
  }
  return words.join(' ');
}

function randomNote(): string | null {
  // 40% šanse za note, 60% null
  return Math.random() < 0.4 ? moodNotes[randInt(0, moodNotes.length - 1)] : null;
}

export async function devSeedInsightsData(userId: string, days = 120) {
  const now = new Date();

  console.log(`🌱 Seeding ${days} dana: moods (sa notes) + thoughtLogs...`);

  // 1) Seed moods sa random note
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(21, randInt(0, 59), 0, 0);

    const mood = randInt(1, 5);
    const id = dayId(d);

    await setDoc(doc(db, 'users', userId, 'moods', id), {
      dayId: id,
      value: mood,
      note: randomNote(), // ← Random note ili null
      updatedAt: Timestamp.fromDate(d),
    });
  }

  console.log(`✅ Moods: ${days} dana (sa notes)`);

  // 2) Seed thought logs sa text
  let totalLogs = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);

    const logsToday = randInt(1, 5);
    for (let j = 0; j < logsToday; j++) {
      const t = new Date(d);
      t.setHours(randInt(8, 23), randInt(0, 59), 0, 0);

      const intensityBefore = randInt(5, 10);
      const intensityAfter = Math.max(3, intensityBefore - randInt(0, 4));

      await addDoc(collection(db, 'users', userId, 'thoughtLogs'), {
        text: randomText(),
        createdAt: Timestamp.fromDate(t),
        intensityBefore,
        intensityAfter,
      });

      totalLogs++;
    }
  }

  console.log(`✅ ThoughtLogs: ${totalLogs} logova sa text`);
  console.log(`🎉 GOTOVO!`);
}
