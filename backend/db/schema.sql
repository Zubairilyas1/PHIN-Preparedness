-- Users & Roles (NFR2)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'investigator')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- FR1: Persons / Demographic Data
CREATE TABLE IF NOT EXISTS persons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dob DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('M', 'F', 'O', 'U')),
  phone TEXT,
  country TEXT NOT NULL,
  street_address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- FR2: Health Events
CREATE TABLE IF NOT EXISTS health_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('infectious', 'environmental', 'bioterrorism', 'other')),
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Closed', 'Archived')),
  suspected_agent TEXT,
  geographic_area TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- FR3: Specimens
CREATE TABLE IF NOT EXISTS specimens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  specimen_id TEXT UNIQUE NOT NULL,
  subject_id TEXT NOT NULL REFERENCES persons(subject_id),
  event_id TEXT REFERENCES health_events(event_id),
  specimen_type TEXT NOT NULL CHECK (specimen_type IN ('clinical', 'environmental', 'food', 'other')),
  collection_date DATETIME NOT NULL,
  collection_location TEXT,
  collector_name TEXT,
  suspected_agent TEXT,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'select_agent')),
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- FR4: Dynamic Entity Linkages
CREATE TABLE IF NOT EXISTS linkages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_entity_type TEXT NOT NULL,
  source_entity_id TEXT NOT NULL,
  target_entity_type TEXT NOT NULL,
  target_entity_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  confidence TEXT CHECK (confidence IN ('confirmed', 'probable', 'suspected')),
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_entity_type, source_entity_id, target_entity_type, target_entity_id, relationship_type)
);

-- FR5: Contact Exposure Tracing
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_subject_id TEXT NOT NULL REFERENCES persons(subject_id),
  case_subject_id TEXT NOT NULL REFERENCES persons(subject_id),
  event_id TEXT NOT NULL REFERENCES health_events(event_id),
  exposure_type TEXT CHECK (exposure_type IN ('intimate', 'social', 'household', 'conveyance', 'environmental', 'occupational')),
  exposure_start DATETIME,
  exposure_end DATETIME,
  proximity TEXT CHECK (proximity IN ('direct', 'close', 'casual', 'unknown')),
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT DEFAULT 'identified' CHECK (status IN ('identified', 'notified', 'interviewed', 'monitoring', 'released')),
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_persons_subject_id ON persons(subject_id);
CREATE INDEX IF NOT EXISTS idx_events_event_id ON health_events(event_id);
CREATE INDEX IF NOT EXISTS idx_specimens_subject ON specimens(subject_id);
CREATE INDEX IF NOT EXISTS idx_linkages_source ON linkages(source_entity_type, source_entity_id);
CREATE INDEX IF NOT EXISTS idx_linkages_target ON linkages(target_entity_type, target_entity_id);
CREATE INDEX IF NOT EXISTS idx_contacts_contact ON contacts(contact_subject_id);
CREATE INDEX IF NOT EXISTS idx_contacts_case ON contacts(case_subject_id);