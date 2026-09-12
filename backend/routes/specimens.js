import express from 'express';
import { prepare } from '../db/index.js';
import { asyncHandler, errorResponse, notFound } from '../utils/response.js';
import { specimenValidation, specimenIdParamValidation, validate } from '../middleware/validation.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const subjectId = req.query.subject_id;
  const eventId = req.query.event_id;

  let query = `
    SELECT s.*, p.first_name, p.last_name, e.name as event_name
    FROM specimens s
    LEFT JOIN persons p ON s.subject_id = p.subject_id
    LEFT JOIN health_events e ON s.event_id = e.event_id
  `;
  const params = [];
  const conditions = [];

  if (subjectId) {
    conditions.push('s.subject_id = ?');
    params.push(subjectId);
  }
  if (eventId) {
    conditions.push('s.event_id = ?');
    params.push(eventId);
  }

  if (conditions.length) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const specimens = prepare(query).all(...params);

  let countQuery = 'SELECT COUNT(*) as count FROM specimens';
  const countParams = [];
  if (conditions.length) {
    countQuery += ' WHERE ' + conditions.join(' AND ');
    countParams.push(...params.slice(0, -2));
  }
  const total = prepare(countQuery).get(...countParams).count;

  res.json({
    success: true,
    data: specimens,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
}));

router.get('/:specimenId', specimenIdParamValidation, validate, asyncHandler(async (req, res) => {
  const specimen = prepare(`
    SELECT s.*, p.first_name, p.last_name, e.name as event_name
    FROM specimens s
    LEFT JOIN persons p ON s.subject_id = p.subject_id
    LEFT JOIN health_events e ON s.event_id = e.event_id
    WHERE s.specimen_id = ?
  `).get(req.params.specimenId);
  if (!specimen) throw notFound('Specimen not found');
  res.json({ success: true, data: specimen });
}));

router.post('/', specimenValidation, validate, requireRole('admin', 'investigator'), asyncHandler(async (req, res) => {
  const { specimen_id, subject_id, event_id, specimen_type, collection_date, collection_location, collector_name, suspected_agent, risk_level, notes } = req.body;

  const person = prepare('SELECT 1 FROM persons WHERE subject_id = ?').get(subject_id);
  if (!person) {
    return res.status(400).json({ success: false, error: 'Subject ID does not exist' });
  }

  const existing = prepare('SELECT 1 FROM specimens WHERE specimen_id = ?').get(specimen_id);
  if (existing) {
    return res.status(409).json({ success: false, error: 'Specimen ID already exists' });
  }

  if (event_id) {
    const event = prepare('SELECT 1 FROM health_events WHERE event_id = ?').get(event_id);
    if (!event) {
      return res.status(400).json({ success: false, error: 'Event ID does not exist' });
    }
  }

  const stmt = prepare(`
    INSERT INTO specimens (specimen_id, subject_id, event_id, specimen_type, collection_date, collection_location, collector_name, suspected_agent, risk_level, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(specimen_id, subject_id, event_id, specimen_type, collection_date, collection_location, collector_name, suspected_agent, risk_level, notes, req.user.id);

  const specimen = prepare('SELECT * FROM specimens WHERE specimen_id = ?').get(specimen_id);
  res.status(201).json({ success: true, message: 'Specimen created', data: specimen });
}));

router.put('/:specimenId', specimenIdParamValidation, validate, requireRole('admin', 'investigator'), asyncHandler(async (req, res) => {
  const { subject_id, event_id, specimen_type, collection_date, collection_location, collector_name, suspected_agent, risk_level, notes } = req.body;

  const specimen = prepare('SELECT * FROM specimens WHERE specimen_id = ?').get(req.params.specimenId);
  if (!specimen) throw notFound('Specimen not found');

  if (subject_id) {
    const person = prepare('SELECT 1 FROM persons WHERE subject_id = ?').get(subject_id);
    if (!person) {
      return res.status(400).json({ success: false, error: 'Subject ID does not exist' });
    }
  }

  if (event_id) {
    const event = prepare('SELECT 1 FROM health_events WHERE event_id = ?').get(event_id);
    if (!event) {
      return res.status(400).json({ success: false, error: 'Event ID does not exist' });
    }
  }

  const stmt = prepare(`
    UPDATE specimens SET 
      subject_id = ?, event_id = ?, specimen_type = ?, collection_date = ?, collection_location = ?,
      collector_name = ?, suspected_agent = ?, risk_level = ?, notes = ?
    WHERE specimen_id = ?
  `);
  stmt.run(subject_id, event_id, specimen_type, collection_date, collection_location, collector_name, suspected_agent, risk_level, notes, req.params.specimenId);

  const updated = prepare('SELECT * FROM specimens WHERE specimen_id = ?').get(req.params.specimenId);
  res.json({ success: true, message: 'Specimen updated', data: updated });
}));

router.delete('/:specimenId', specimenIdParamValidation, validate, requireRole('admin'), asyncHandler(async (req, res) => {
  const specimen = prepare('SELECT * FROM specimens WHERE specimen_id = ?').get(req.params.specimenId);
  if (!specimen) throw notFound('Specimen not found');

  prepare('DELETE FROM specimens WHERE specimen_id = ?').run(req.params.specimenId);
  res.json({ success: true, message: 'Specimen deleted' });
}));

export default router;