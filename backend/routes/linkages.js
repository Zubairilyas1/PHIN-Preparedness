import express from 'express';
import { prepare } from '../db/index.js';
import { asyncHandler, errorResponse, notFound } from '../utils/response.js';
import { linkageValidation, validate, idParamValidation } from '../middleware/validation.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const sourceType = req.query.source_type;
  const sourceId = req.query.source_id;
  const targetType = req.query.target_type;
  const targetId = req.query.target_id;

  let query = 'SELECT * FROM linkages';
  const params = [];
  const conditions = [];

  if (sourceType) { conditions.push('source_entity_type = ?'); params.push(sourceType); }
  if (sourceId) { conditions.push('source_entity_id = ?'); params.push(sourceId); }
  if (targetType) { conditions.push('target_entity_type = ?'); params.push(targetType); }
  if (targetId) { conditions.push('target_entity_id = ?'); params.push(targetId); }

  if (conditions.length) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const linkages = prepare(query).all(...params);

  let countQuery = 'SELECT COUNT(*) as count FROM linkages';
  const countParams = [];
  if (conditions.length) {
    countQuery += ' WHERE ' + conditions.join(' AND ');
    countParams.push(...params.slice(0, -2));
  }
  const total = prepare(countQuery).get(...countParams).count;

  res.json({
    success: true,
    data: linkages,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
}));

router.post('/', linkageValidation, validate, requireRole('admin', 'investigator'), asyncHandler(async (req, res) => {
  const { source_entity_type, source_entity_id, target_entity_type, target_entity_id, relationship_type, start_date, end_date, confidence, notes } = req.body;

  try {
    const stmt = prepare(`
      INSERT INTO linkages (source_entity_type, source_entity_id, target_entity_type, target_entity_id, relationship_type, start_date, end_date, confidence, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(source_entity_type, source_entity_id, target_entity_type, target_entity_id, relationship_type, start_date, end_date, confidence, notes, req.user.id);

    const linkage = prepare('SELECT * FROM linkages WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, message: 'Linkage created', data: linkage });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ success: false, error: 'Linkage already exists' });
    }
    throw err;
  }
}));

router.delete('/:id', idParamValidation, validate, requireRole('admin', 'investigator'), asyncHandler(async (req, res) => {
  const linkage = prepare('SELECT * FROM linkages WHERE id = ?').get(req.params.id);
  if (!linkage) throw notFound('Linkage not found');

  prepare('DELETE FROM linkages WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Linkage deleted' });
}));

export default router;