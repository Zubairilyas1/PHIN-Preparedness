import { getDb, initDatabase, saveDatabase } from './index.js';

async function run() {
  await initDatabase();
  const db = getDb();

  // Insert test user if not exists
  db.run("INSERT OR IGNORE INTO users (id, username, password_hash, role) VALUES (1, 'admin', 'dummy', 'admin')");

  // Insert Contact Subject
  db.run(`INSERT OR IGNORE INTO persons (subject_id, first_name, last_name, dob, gender, country) 
          VALUES ('SUBJ-2026-0102', 'Test', 'Contact', '1990-01-01', 'O', 'USA')`);

  // Insert Case Subject (needed for contacts table)
  db.run(`INSERT OR IGNORE INTO persons (subject_id, first_name, last_name, dob, gender, country) 
          VALUES ('SUBJ-2026-0001', 'Test', 'Case', '1990-01-01', 'O', 'USA')`);

  // Insert Events
  const events = ['EVT-2026-501', 'EVT-2026-502', 'EVT-2026-503'];
  for (const evt of events) {
    db.run(`INSERT OR IGNORE INTO health_events (event_id, name, category, status, start_date) 
            VALUES (?, 'Test Event', 'infectious', 'Open', '2026-01-01')`, [evt]);
  }

  // Insert Contacts (Exposure records)
  for (const evt of events) {
    try {
      db.run(`INSERT INTO contacts (contact_subject_id, case_subject_id, event_id, exposure_type) 
              VALUES ('SUBJ-2026-0102', 'SUBJ-2026-0001', ?, 'social')`, [evt]);
      console.log(`Inserted contact record for event ${evt}`);
    } catch (e) {
      console.log(`Record for ${evt} error:`, e.message);
    }
  }

  saveDatabase();
  console.log('Test data insertion complete. You can verify it in the UI.');
}

run().catch(console.error);
