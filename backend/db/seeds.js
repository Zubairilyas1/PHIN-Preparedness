import bcrypt from 'bcryptjs';
import { initDatabase, prepare, exec } from './index.js';

async function seed() {
  await initDatabase();

  const hashPassword = (pwd) => bcrypt.hashSync(pwd, 10);

  const insertUser = prepare(`
    INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)
  `);

  insertUser.run('admin', hashPassword('admin123'), 'admin');
  insertUser.run('investigator1', hashPassword('inv123'), 'investigator');

  const insertPerson = prepare(`
    INSERT OR IGNORE INTO persons (subject_id, first_name, last_name, dob, gender, phone, country, street_address, city, state, zip_code, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  insertPerson.run('SUBJ-2025-0001', 'John', 'Doe', '1980-05-15', 'M', '555-0101', 'USA', '123 Main St', 'Springfield', 'IL', '62701');
  insertPerson.run('SUBJ-2025-0002', 'Jane', 'Smith', '1992-08-22', 'F', '555-0102', 'USA', '456 Oak Ave', 'Springfield', 'IL', '62702');
  insertPerson.run('SUBJ-2025-0003', 'Bob', 'Wilson', '1975-11-03', 'M', '555-0103', 'USA', '789 Elm Dr', 'Springfield', 'IL', '62703');
  insertPerson.run('SUBJ-2025-0004', 'Alice', 'Brown', '1988-03-17', 'F', '555-0104', 'USA', '321 Pine Rd', 'Springfield', 'IL', '62704');
  insertPerson.run('SUBJ-2025-0005', 'Charlie', 'Davis', '1995-09-30', 'O', '555-0105', 'USA', '654 Maple Ln', 'Springfield', 'IL', '62705');

  const insertEvent = prepare(`
    INSERT OR IGNORE INTO health_events (event_id, name, category, status, suspected_agent, geographic_area, start_date, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);

  insertEvent.run('EVT-2025-001', 'Salmonella Outbreak - Springfield', 'infectious', 'Open', 'Salmonella enterica', 'Springfield, IL', '2025-01-10');
  insertEvent.run('EVT-2025-002', 'Unknown Respiratory Illness', 'infectious', 'Open', 'Novel coronavirus', 'Springfield, IL', '2025-02-01');

  const insertSpecimen = prepare(`
    INSERT OR IGNORE INTO specimens (specimen_id, subject_id, event_id, specimen_type, collection_date, collection_location, collector_name, suspected_agent, risk_level, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  insertSpecimen.run('SPC-2025-0001', 'SUBJ-2025-0001', 'EVT-2025-001', 'clinical', '2025-01-12 10:30', 'Springfield General Hospital', 'Dr. Miller', 'Salmonella', 'medium');
  insertSpecimen.run('SPC-2025-0002', 'SUBJ-2025-0002', 'EVT-2025-001', 'clinical', '2025-01-13 14:00', 'Springfield General Hospital', 'Dr. Miller', 'Salmonella', 'medium');
  insertSpecimen.run('SPC-2025-0003', 'SUBJ-2025-0003', 'EVT-2025-002', 'clinical', '2025-02-03 09:15', 'County Clinic', 'Nurse Rivera', 'Coronavirus', 'high');
  insertSpecimen.run('SPC-2025-0004', 'SUBJ-2025-0004', 'EVT-2025-001', 'food', '2025-01-14 11:00', 'Local Deli - Chicken Salad', 'Env. Health Tech', 'Salmonella', 'low');

  const insertLinkage = prepare(`
    INSERT OR IGNORE INTO linkages (source_entity_type, source_entity_id, target_entity_type, target_entity_id, relationship_type, confidence, created_by)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  insertLinkage.run('person', 'SUBJ-2025-0001', 'location', 'Springfield General Hospital', 'treated_at', 'confirmed');
  insertLinkage.run('person', 'SUBJ-2025-0001', 'person', 'SUBJ-2025-0002', 'contact_of', 'probable');
  insertLinkage.run('person', 'SUBJ-2025-0003', 'location', 'County Clinic', 'treated_at', 'confirmed');
  insertLinkage.run('specimen', 'SPC-2025-0004', 'location', 'Local Deli', 'collected_from', 'confirmed');
  insertLinkage.run('person', 'SUBJ-2025-0004', 'event', 'EVT-2025-001', 'case_in', 'confirmed');
  insertLinkage.run('person', 'SUBJ-2025-0005', 'event', 'EVT-2025-002', 'case_in', 'confirmed');

  const insertContact = prepare(`
    INSERT OR IGNORE INTO contacts (contact_subject_id, case_subject_id, event_id, exposure_type, exposure_start, exposure_end, proximity, priority, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  insertContact.run('SUBJ-2025-0005', 'SUBJ-2025-0001', 'EVT-2025-001', 'household', '2025-01-10', '2025-01-15', 'direct', 'high', 'monitoring');
  insertContact.run('SUBJ-2025-0005', 'SUBJ-2025-0002', 'EVT-2025-001', 'household', '2025-01-10', '2025-01-15', 'direct', 'high', 'monitoring');
  insertContact.run('SUBJ-2025-0003', 'SUBJ-2025-0004', 'EVT-2025-001', 'social', '2025-01-12', '2025-01-12', 'close', 'medium', 'interviewed');
  insertContact.run('SUBJ-2025-0001', 'SUBJ-2025-0003', 'EVT-2025-002', 'occupational', '2025-02-01', '2025-02-03', 'close', 'high', 'notified');
  insertContact.run('SUBJ-2025-0002', 'SUBJ-2025-0003', 'EVT-2025-002', 'social', '2025-02-02', '2025-02-02', 'casual', 'low', 'identified');

  console.log('Seed data inserted successfully');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});