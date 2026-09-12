import { body, param, query, validationResult } from 'express-validator';

export const validate = (req, res, next) => {
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

export const personValidation = [
  body('subject_id')
    .matches(/^SUBJ-\d{4}-\d{4}$/)
    .withMessage('Subject ID must be in format SUBJ-YYYY-NNNN'),
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required'),
  body('dob')
    .isISO8601()
    .withMessage('DOB must be a valid date (YYYY-MM-DD)')
    .custom((value) => {
      const age = new Date().getFullYear() - new Date(value).getFullYear();
      if (age < 0 || age > 120) throw new Error('Age must be between 0 and 120');
      return true;
    }),
  body('gender').isIn(['M', 'F', 'O', 'U']).withMessage('Gender must be M, F, O, or U'),
  body('phone').optional().matches(/^\+?[\d\s\-\(\)]{7,}$/).withMessage('Invalid phone format'),
  body('country').trim().notEmpty().withMessage('Country is required'),
  body('street_address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('zip_code').optional().trim(),
];

export const eventValidation = [
  body('event_id').matches(/^EVT-\d{4}-\d{3}$/).withMessage('Event ID must be in format EVT-YYYY-NNN'),
  body('name').trim().notEmpty().withMessage('Event name is required'),
  body('category').isIn(['infectious', 'environmental', 'bioterrorism', 'other']).withMessage('Invalid category'),
  body('status').optional().isIn(['Open', 'Closed', 'Archived']).withMessage('Invalid status'),
  body('suspected_agent').optional().trim(),
  body('geographic_area').optional().trim(),
  body('start_date').isISO8601().withMessage('Start date must be valid (YYYY-MM-DD)'),
  body('end_date').optional().isISO8601().withMessage('End date must be valid (YYYY-MM-DD)'),
];

export const specimenValidation = [
  body('specimen_id').matches(/^SPC-\d{4}-\d{4}$/).withMessage('Specimen ID must be in format SPC-YYYY-NNNN'),
  body('subject_id').matches(/^SUBJ-\d{4}-\d{4}$/).withMessage('Subject ID must be in format SUBJ-YYYY-NNNN'),
  body('event_id').optional().matches(/^EVT-\d{4}-\d{3}$/).withMessage('Event ID must be in format EVT-YYYY-NNN'),
  body('specimen_type').isIn(['clinical', 'environmental', 'food', 'other']).withMessage('Invalid specimen type'),
  body('collection_date').isISO8601().withMessage('Collection date must be valid ISO 8601'),
  body('collection_location').optional().trim(),
  body('collector_name').optional().trim(),
  body('suspected_agent').optional().trim(),
  body('risk_level').optional().isIn(['low', 'medium', 'high', 'select_agent']).withMessage('Invalid risk level'),
  body('notes').optional().trim(),
];

export const linkageValidation = [
  body('source_entity_type').trim().notEmpty().withMessage('Source entity type is required'),
  body('source_entity_id').trim().notEmpty().withMessage('Source entity ID is required'),
  body('target_entity_type').trim().notEmpty().withMessage('Target entity type is required'),
  body('target_entity_id').trim().notEmpty().withMessage('Target entity ID is required'),
  body('relationship_type').trim().notEmpty().withMessage('Relationship type is required'),
  body('confidence').optional().isIn(['confirmed', 'probable', 'suspected']).withMessage('Invalid confidence'),
  body('notes').optional().trim(),
];

export const contactValidation = [
  body('contact_subject_id').matches(/^SUBJ-\d{4}-\d{4}$/).withMessage('Contact Subject ID must be in format SUBJ-YYYY-NNNN'),
  body('case_subject_id').matches(/^SUBJ-\d{4}-\d{4}$/).withMessage('Case Subject ID must be in format SUBJ-YYYY-NNNN'),
  body('event_id').matches(/^EVT-\d{4}-\d{3}$/).withMessage('Event ID must be in format EVT-YYYY-NNN'),
  body('exposure_type').optional().isIn(['intimate', 'social', 'household', 'conveyance', 'environmental', 'occupational']).withMessage('Invalid exposure type'),
  body('exposure_start').optional().isISO8601().withMessage('Exposure start must be valid ISO 8601'),
  body('exposure_end').optional().isISO8601().withMessage('Exposure end must be valid ISO 8601'),
  body('proximity').optional().isIn(['direct', 'close', 'casual', 'unknown']).withMessage('Invalid proximity'),
  body('priority').optional().isIn(['high', 'medium', 'low']).withMessage('Invalid priority'),
  body('status').optional().isIn(['identified', 'notified', 'interviewed', 'monitoring', 'released']).withMessage('Invalid status'),
  body('notes').optional().trim(),
];

export const labMessageValidation = [
  body('specimenIds').isArray({ min: 1 }).withMessage('At least one specimen ID required'),
  body('specimenIds.*').matches(/^SPC-\d{4}-\d{4}$/).withMessage('Invalid specimen ID format'),
  body('requestedTests').isArray({ min: 1 }).withMessage('At least one test required'),
  body('requestedTests.*.loinc').trim().notEmpty().withMessage('LOINC code required'),
  body('requestedTests.*.description').optional().trim(),
  body('priority').optional().isIn(['routine', 'urgent', 'stat']).withMessage('Invalid priority'),
];

export const idParamValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid ID parameter'),
];

export const subjectIdParamValidation = [
  param('subjectId').matches(/^SUBJ-\d{4}-\d{4}$/).withMessage('Invalid Subject ID format'),
];

export const eventIdParamValidation = [
  param('eventId').matches(/^EVT-\d{4}-\d{3}$/).withMessage('Invalid Event ID format'),
];

export const specimenIdParamValidation = [
  param('specimenId').matches(/^SPC-\d{4}-\d{4}$/).withMessage('Invalid Specimen ID format'),
];