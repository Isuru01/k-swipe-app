# 🏙️ Neo-Oasis Linguistic Data Strategy

This document outlines the protocol for expanding the **K-Swipe Linguistic Vault**. Following these guidelines ensures data integrity across the **Forge**, **Arena**, and **Scribe** districts.

---

## 📐 1. The Blueprint (Schema)
The `vocabulary` table is managed via **Drizzle ORM** (`db/schema.ts`). Every entry must strictly follow this shape:

| Field | Type | Description |
| :--- | :--- | :--- |
| `hangeul` | String | The core Hangeul character/word (Source of Truth). |
| `romanization` | String | Phonetics (e.g., *daebak*). |
| `english` | String | Translation or slang equivalent. |
| `category` | String | District identifier (e.g., `Slangs`, `K-Drama`). |
| `difficulty` | Integer | **1** (Basics) to **5** (Advanced). |

---

## 🛠️ 2. Execution Script (`db/import.ts`)
Instead of wiping the database (the traditional `seed` method), use this **Surgical UPSERT** pattern. This preserves existing user performance records while adding new words.

```typescript
// Proposed logic for db/import.ts
import { db } from './index';
import { vocabulary } from './schema';
import { sql } from 'drizzle-orm';

export async function importNewWords(newWords: any[]) {
  console.log(`🏙️ Injection: ${newWords.length} assets...`);
  for (const word of newWords) {
    await db.insert(vocabulary)
      .values(word)
      .onConflictDoUpdate({
        target: vocabulary.id, // Or use a custom unique constraint on 'hangeul'
        set: {
          romanization: word.romanization,
          english: word.english,
          category: word.category,
          difficulty: word.difficulty
        }
      });
  }
}
```

---

## 📈 3. Difficulty Tiers
Assign difficulty carefully to ensure the **Arena** progression feels natural:
*   **Tier 1**: Single Alphabets (ㄱ, ㄴ).
*   **Tier 2**: Basic 1-syllable blocks (가, 나).
*   **Tier 3**: Daily essentials (Hello, Water).
*   **Tier 4**: Slang & Context-heavy words (Awesome, Mood-killer).
*   **Tier 5**: Complex phrases and Business/Honorific terms.

---

## 🛡️ 4. Safety Protocols
1.  **Collision check**: Before running a script, check for duplicate `hangeul` entries.
2.  **Audio mapping**: Use consistent naming if planning to add `.mp3` files later (e.g., `word_id_101.mp3`).
3.  **UTF-8 Enforcement**: Ensure Hangeul characters are handled in UTF-8 to prevent character corruption.

---
**Protocol Version:** 1.0.0
**District:** Data Architecture
