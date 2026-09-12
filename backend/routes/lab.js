import express from 'express';
import { prepare } from '../db/index.js';
import { asyncHandler, errorResponse } from '../utils/response.js';
import { labMessageValidation, validate } from '../middleware/validation.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

router.post('/message', labMessageValidation, validate, requireRole('admin', 'investigator'), asyncHandler(async (req, res) => {
  const { specimenIds, requestedTests, priority, submitter } = req.body;

  const placeholders = specimenIds.map(() => '?').join(',');
  const specimens = prepare(`
    SELECT s.*, p.first_name, p.last_name, p.dob, p.gender, p.phone, p.country, p.street_address, p.city, p.state, p.zip_code
    FROM specimens s
    JOIN persons p ON s.subject_id = p.subject_id
    WHERE s.specimen_id IN (${placeholders})
  `).all(...specimenIds);

  if (specimens.length !== specimenIds.length) {
    return res.status(400).json({ success: false, error: 'One or more specimen IDs not found' });
  }

  const message = {
    resourceType: 'Bundle',
    type: 'message',
    timestamp: new Date().toISOString(),
    entry: []
  };

  const serviceRequest = {
    resourceType: 'ServiceRequest',
    id: `lab-req-${Date.now()}`,
    status: 'active',
    intent: 'order',
    priority: priority || 'routine',
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/service-request-category', code: 'lab' }] }],
    code: {
      coding: requestedTests.map(t => ({
        system: 'http://loinc.org',
        code: t.loinc,
        display: t.description || ''
      }))
    },
    subject: {
      reference: `Patient/${specimens[0].subject_id}`,
      display: `${specimens[0].first_name} ${specimens[0].last_name}`
    },
    requester: {
      reference: `Practitioner/${submitter?.id || req.user.id}`,
      display: submitter?.name || req.user.username
    },
    authoredOn: new Date().toISOString(),
    specimen: specimens.map(s => ({
      reference: `Specimen/${s.specimen_id}`,
      display: `${s.specimen_type} - ${s.specimen_id}`
    })),
    note: [{ text: `Lab request for ${specimens.length} specimen(s)` }]
  };

  message.entry.push({ resource: serviceRequest });

  for (const specimen of specimens) {
    const specimenResource = {
      resourceType: 'Specimen',
      id: specimen.specimen_id,
      status: 'available',
      type: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0487',
          code: specimen.specimen_type,
          display: specimen.specimen_type
        }]
      },
      subject: {
        reference: `Patient/${specimen.subject_id}`,
        display: `${specimen.first_name} ${specimen.last_name}`
      },
      receivedTime: specimen.collection_date,
      collection: {
        collector: { display: specimen.collector_name },
        collectedDateTime: specimen.collection_date,
        location: { display: specimen.collection_location }
      },
      note: [{ text: `Suspected agent: ${specimen.suspected_agent || 'Unknown'}` }]
    };
    message.entry.push({ resource: specimenResource });

    const patientResource = {
      resourceType: 'Patient',
      id: specimen.subject_id,
      identifier: [{ system: 'urn:oid:2.16.840.1.113883.19.5', value: specimen.subject_id }],
      name: [{ family: specimen.last_name, given: [specimen.first_name] }],
      birthDate: specimen.dob,
      gender: specimen.gender.toLowerCase(),
      telecom: [{ system: 'phone', value: specimen.phone }],
      address: [{
        line: [specimen.street_address],
        city: specimen.city,
        state: specimen.state,
        postalCode: specimen.zip_code,
        country: specimen.country
      }]
    };
    message.entry.push({ resource: patientResource });
  }

  res.json({ success: true, message: 'Lab request message generated', data: message });
}));

export default router;