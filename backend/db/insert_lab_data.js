import { getDb, initDatabase, saveDatabase } from './index.js';

async function run() {
  await initDatabase();
  const db = getDb();
  
  db.run("INSERT OR IGNORE INTO persons (subject_id, first_name, last_name, dob, gender, country) VALUES ('SUBJ-2026-0101', 'Test', 'Patient', '1980-05-05', 'M', 'USA')");
  db.run("INSERT OR IGNORE INTO specimens (specimen_id, subject_id, specimen_type, collection_date, risk_level) VALUES ('SPC-2026-0901', 'SUBJ-2026-0101', 'clinical', '2026-09-05T10:15:00Z', 'low')");
  
  saveDatabase();
  console.log('Test data injected!');
}

run().catch(console.error);
