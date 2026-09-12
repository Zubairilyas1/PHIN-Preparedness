import express from 'express';
import { prepare } from '../db/index.js';
import { asyncHandler, errorResponse } from '../utils/response.js';
import { query, validationResult } from 'express-validator';

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

const epiCurveValidation = [
  query('eventId').optional().matches(/^EVT-\d{4}-\d{3}$/).withMessage('Invalid Event ID format'),
  query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO 8601'),
  query('endDate').optional().isISO8601().withMessage('End date must be valid ISO 8601'),
];

router.get('/epi-curve', epiCurveValidation, validate, asyncHandler(async (req, res) => {
  const { eventId, startDate, endDate } = req.query;

  let query = `
    SELECT 
      date(c.exposure_start) as onset_date,
      COUNT(CASE WHEN c.status = 'confirmed' THEN 1 END) as confirmed,
      COUNT(CASE WHEN c.status = 'probable' THEN 1 END) as probable,
      COUNT(CASE WHEN c.status = 'suspect' THEN 1 END) as suspect,
      COUNT(*) as total
    FROM contacts c
    JOIN health_events e ON c.event_id = e.event_id
  `;
  const params = [];
  const conditions = [];

  if (eventId) {
    conditions.push('c.event_id = ?');
    params.push(eventId);
  }
  if (startDate) {
    conditions.push('date(c.exposure_start) >= ?');
    params.push(startDate);
  }
  if (endDate) {
    conditions.push('date(c.exposure_start) <= ?');
    params.push(endDate);
  }

  if (conditions.length) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' GROUP BY date(c.exposure_start) ORDER BY date(c.exposure_start) ASC';

  const rows = prepare(query).all(...params);

  const data = rows.map(r => ({
    date: r.onset_date,
    confirmed: r.confirmed,
    probable: r.probable,
    suspect: r.suspect,
    total: r.total
  }));

  res.json({ success: true, data });
}));

export default router;