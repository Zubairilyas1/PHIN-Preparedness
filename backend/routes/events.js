import express from 'express';
import { prepare } from '../db/index.js';
import { asyncHandler, errorResponse, notFound } from '../utils/response.js';
import { eventValidation, eventIdParamValidation, validate } from '../middleware/validation.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const status = req.query.status;

  let query = 'SELECT * FROM health_events';
  const params = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const events = prepare(query).all(...params);
  const total = prepare('SELECT COUNT(*) as count FROM health_events').get().count;

  res.json({
    success: true,
    data: events,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
}));

router.get('/:eventId', eventIdParamValidation, validate, asyncHandler(async (req, res) => {
  const event = prepare('SELECT * FROM health_events WHERE event_id = ?').get(req.params.eventId);
  if (!event) throw notFound('Event not found');
  res.json({ success: true, data: event });
}));

router.post('/', eventValidation, validate, requireRole('admin', 'investigator'), asyncHandler(async (req, res) => {
  const { event_id, name, category, status, suspected_agent, geographic_area, start_date, end_date } = req.body;

  const existing = prepare('SELECT 1 FROM health_events WHERE event_id = ?').get(event_id);
  if (existing) {
    return res.status(409).json({ success: false, error: 'Event ID already exists' });
  }

  const stmt = prepare(`
    INSERT INTO health_events (event_id, name, category, status, suspected_agent, geographic_area, start_date, end_date, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(event_id, name, category, status || 'Open', suspected_agent, geographic_area, start_date, end_date, req.user.id);

  const event = prepare('SELECT * FROM health_events WHERE event_id = ?').get(event_id);
  res.status(201).json({ success: true, message: 'Event created', data: event });
}));

router.put('/:eventId', eventIdParamValidation, validate, requireRole('admin'), asyncHandler(async (req, res) => {
  const { name, category, status, suspected_agent, geographic_area, start_date, end_date } = req.body;

  const event = prepare('SELECT * FROM health_events WHERE event_id = ?').get(req.params.eventId);
  if (!event) throw notFound('Event not found');

  // Build dynamic update query for partial updates
  const updates = [];
  const params = [];

  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (category !== undefined) { updates.push('category = ?'); params.push(category); }
  if (status !== undefined) { updates.push('status = ?'); params.push(status); }
  if (suspected_agent !== undefined) { updates.push('suspected_agent = ?'); params.push(suspected_agent); }
  if (geographic_area !== undefined) { updates.push('geographic_area = ?'); params.push(geographic_area); }
  if (start_date !== undefined) { updates.push('start_date = ?'); params.push(start_date); }
  if (end_date !== undefined) { updates.push('end_date = ?'); params.push(end_date); }

  if (updates.length === 0) {
    return res.status(400).json({ success: false, error: 'No fields to update' });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(req.params.eventId);

  const stmt = prepare(`
    UPDATE health_events SET ${updates.join(', ')} WHERE event_id = ?
  `);
  stmt.run(...params);

  const updated = prepare('SELECT * FROM health_events WHERE event_id = ?').get(req.params.eventId);
  res.json({ success: true, message: 'Event updated', data: updated });
}));

router.delete('/:eventId', eventIdParamValidation, validate, requireRole('admin'), asyncHandler(async (req, res) => {
  const event = prepare('SELECT * FROM health_events WHERE event_id = ?').get(req.params.eventId);
  if (!event) throw notFound('Event not found');

  prepare('DELETE FROM health_events WHERE event_id = ?').run(req.params.eventId);
  res.json({ success: true, message: 'Event deleted' });
}));

export default router;