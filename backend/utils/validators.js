export const subjectIdRegex = /^SUBJ-\d{4}-\d{4}$/;
export const eventIdRegex = /^EVT-\d{4}-\d{3}$/;
export const specimenIdRegex = /^SPC-\d{4}-\d{4}$/;

export function validateSubjectId(id) {
  return subjectIdRegex.test(id);
}

export function validateEventId(id) {
  return eventIdRegex.test(id);
}

export function validateSpecimenId(id) {
  return specimenIdRegex.test(id);
}

export function calculateAge(dob) {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

export function formatDateForInput(dateString) {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

export function formatDateTimeForInput(dateString) {
  const date = new Date(dateString);
  return date.toISOString().slice(0, 16);
}