import express from 'express';
import { prepare } from '../db/index.js';
import { asyncHandler, errorResponse, notFound } from '../utils/response.js';
import { personValidation, subjectIdParamValidation, validate } from '../middleware/validation.js';
import { requireRole } from '../middleware/rbac.js';
import { maskPerson } from '../middleware/masking.js';

const router = express.Router();

function maskPersons(persons, role) {
  return persons.map(p => maskPerson(p, role));
}

router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';

  let query = 'SELECT * FROM persons';
  const params = [];

  if (search) {
    query += ' WHERE first_name LIKE ? OR last_name LIKE ? OR subject_id LIKE ?';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const persons = prepare(query).all(...params);
  const total = prepare('SELECT COUNT(*) as count FROM persons').get().count;

  const masked = maskPersons(persons, req.user?.role);

  res.json({
    success: true,
    data: masked,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
}));

router.get('/:subjectId', subjectIdParamValidation, validate, asyncHandler(async (req, res) => {
  const person = prepare('SELECT * FROM persons WHERE subject_id = ?').get(req.params.subjectId);
  if (!person) throw notFound('Person not found');

  const masked = maskPerson(person, req.user?.role);
  res.json({ success: true, data: masked });
}));

router.post('/', personValidation, validate, requireRole('admin', 'investigator'), asyncHandler(async (req, res) => {
  const { subject_id, first_name, last_name, dob, gender, phone, country, street_address, city, state, zip_code } = req.body;

  const existing = prepare('SELECT 1 FROM persons WHERE subject_id = ?').get(subject_id);
  if (existing) {
    return res.status(409).json({ success: false, error: 'Subject ID already exists' });
  }

  const stmt = prepare(`
    INSERT INTO persons (subject_id, first_name, last_name, dob, gender, phone, country, street_address, city, state, zip_code, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(subject_id, first_name, last_name, dob, gender, phone, country, street_address, city, state, zip_code, req.user.id);

  const person = prepare('SELECT * FROM persons WHERE subject_id = ?').get(subject_id);
  const masked = maskPerson(person, req.user?.role);

  res.status(201).json({ success: true, message: 'Person created', data: masked });
}));

router.put('/:subjectId', subjectIdParamValidation, validate, requireRole('admin', 'investigator'), asyncHandler(async (req, res) => {
  const { first_name, last_name, dob, gender, phone, country, street_address, city, state, zip_code } = req.body;

  const person = prepare('SELECT * FROM persons WHERE subject_id = ?').get(req.params.subjectId);
  if (!person) throw notFound('Person not found');

  const stmt = prepare(`
    UPDATE persons SET 
      first_name = ?, last_name = ?, dob = ?, gender = ?, phone = ?, country = ?,
      street_address = ?, city = ?, state = ?, zip_code = ?, updated_at = CURRENT_TIMESTAMP
    WHERE subject_id = ?
  `);
  stmt.run(first_name, last_name, dob, gender, phone, country, street_address, city, state, zip_code, req.params.subjectId);

  const updated = prepare('SELECT * FROM persons WHERE subject_id = ?').get(req.params.subjectId);
  const masked = maskPerson(updated, req.user?.role);

  res.json({ success: true, message: 'Person updated', data: masked });
}));

router.delete('/:subjectId', subjectIdParamValidation, validate, requireRole('admin'), asyncHandler(async (req, res) => {
  const person = prepare('SELECT * FROM persons WHERE subject_id = ?').get(req.params.subjectId);
  if (!person) throw notFound('Person not found');

  prepare('DELETE FROM persons WHERE subject_id = ?').run(req.params.subjectId);
  res.json({ success: true, message: 'Person deleted' });
}));

export default router;