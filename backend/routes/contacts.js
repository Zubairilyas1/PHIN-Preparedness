import express from 'express';
import { prepare } from '../db/index.js';
import { asyncHandler, errorResponse, notFound } from '../utils/response.js';
import { contactValidation, subjectIdParamValidation, eventIdParamValidation, validate } from '../middleware/validation.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const contactId = req.query.contact_subject_id;
  const caseId = req.query.case_subject_id;
  const eventId = req.query.event_id;

  let query = `
    SELECT c.*, 
      cp.first_name as contact_first, cp.last_name as contact_last,
      cs.first_name as case_first, cs.last_name as case_last,
      e.name as event_name
    FROM contacts c
    LEFT JOIN persons cp ON c.contact_subject_id = cp.subject_id
    LEFT JOIN persons cs ON c.case_subject_id = cs.subject_id
    LEFT JOIN health_events e ON c.event_id = e.event_id
  `;
  const params = [];
  const conditions = [];

  if (contactId) { conditions.push('c.contact_subject_id = ?'); params.push(contactId); }
  if (caseId) { conditions.push('c.case_subject_id = ?'); params.push(caseId); }
  if (eventId) { conditions.push('c.event_id = ?'); params.push(eventId); }

  if (conditions.length) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const contacts = prepare(query).all(...params);

  let countQuery = 'SELECT COUNT(*) as count FROM contacts';
  const countParams = [];
  if (conditions.length) {
    countQuery += ' WHERE ' + conditions.join(' AND ');
    countParams.push(...params.slice(0, -2));
  }
  const total = prepare(countQuery).get(...countParams).count;

  res.json({
    success: true,
    data: contacts,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
}));

router.get('/contact/:subjectId', subjectIdParamValidation, validate, asyncHandler(async (req, res) => {
  const contacts = prepare(`
    SELECT c.*, 
      cp.first_name as contact_first, cp.last_name as contact_last,
      cs.first_name as case_first, cs.last_name as case_last,
      e.name as event_name
    FROM contacts c
    LEFT JOIN persons cp ON c.contact_subject_id = cp.subject_id
    LEFT JOIN persons cs ON c.case_subject_id = cs.subject_id
    LEFT JOIN health_events e ON c.event_id = e.event_id
    WHERE c.contact_subject_id = ?
    ORDER BY c.created_at DESC
  `).all(req.params.subjectId);

  const caseCount = contacts.length;
  const cases = contacts.map(c => ({
    case_subject_id: c.case_subject_id,
    case_name: `${c.case_first} ${c.case_last}`,
    event_id: c.event_id,
    event_name: c.event_name,
    exposure_type: c.exposure_type,
    proximity: c.proximity,
    priority: c.priority,
    status: c.status
  }));

  res.json({
    success: true,
    data: { contact_subject_id: req.params.subjectId, case_count: caseCount, cases }
  });
}));

router.post('/', contactValidation, validate, requireRole('admin', 'investigator'), asyncHandler(async (req, res) => {
  const { contact_subject_id, case_subject_id, event_id, exposure_type, exposure_start, exposure_end, proximity, priority, status, notes } = req.body;

  const contactPerson = prepare('SELECT 1 FROM persons WHERE subject_id = ?').get(contact_subject_id);
  if (!contactPerson) {
    return res.status(400).json({ success: false, error: 'Contact Subject ID does not exist' });
  }

  const casePerson = prepare('SELECT 1 FROM persons WHERE subject_id = ?').get(case_subject_id);
  if (!casePerson) {
    return res.status(400).json({ success: false, error: 'Case Subject ID does not exist' });
  }

  const event = prepare('SELECT event_id, status FROM health_events WHERE event_id = ?').get(event_id);
  if (!event) {
    return res.status(400).json({ success: false, error: 'Target health event no longer exists' });
  }
  if (event.status === 'Archived') {
    return res.status(400).json({ success: false, error: 'Target health event no longer exists' });
  }

  try {
    const stmt = prepare(`
      INSERT INTO contacts (contact_subject_id, case_subject_id, event_id, exposure_type, exposure_start, exposure_end, proximity, priority, status, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(contact_subject_id, case_subject_id, event_id, exposure_type, exposure_start, exposure_end, proximity, priority, status || 'identified', notes, req.user.id);

    const contact = prepare('SELECT * FROM contacts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, message: 'Contact exposure recorded', data: contact });
  } catch (err) {
    console.error('Contact creation error:', err.message, err.stack);
    return res.status(500).json({ success: false, error: 'Internal server error', details: err.message });
  }
}));

router.put('/:id', validate, requireRole('admin', 'investigator'), asyncHandler(async (req, res) => {
  const { exposure_type, exposure_start, exposure_end, proximity, priority, status, notes } = req.body;

  const contact = prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  if (!contact) throw notFound('Contact not found');

  const stmt = prepare(`
    UPDATE contacts SET 
      exposure_type = ?, exposure_start = ?, exposure_end = ?, proximity = ?, priority = ?, status = ?, notes = ?
    WHERE id = ?
  `);
  stmt.run(exposure_type, exposure_start, exposure_end, proximity, priority, status, notes, req.params.id);

  const updated = prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  res.json({ success: true, message: 'Contact updated', data: updated });
}));

router.delete('/:id', validate, requireRole('admin'), asyncHandler(async (req, res) => {
  const contact = prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  if (!contact) throw notFound('Contact not found');

  prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Contact deleted' });
}));

export default router;