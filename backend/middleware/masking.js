export function maskPerson(person, requesterRole) {
  if (!person) return null;
  
  if (requesterRole === 'admin') {
    return person;
  }

  return {
    ...person,
    street_address: person.street_address ? '***MASKED***' : null,
    phone: person.phone ? maskPhone(person.phone) : null,
  };
}

export function maskPersons(persons, requesterRole) {
  if (!Array.isArray(persons)) return persons;
  return persons.map(p => maskPerson(p, requesterRole));
}

function maskPhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 4) {
    return '***-***-' + digits.slice(-4);
  }
  return '***-***-****';
}

export function applyMasking(req, res, next) {
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    if (data && data.data) {
      if (Array.isArray(data.data)) {
        data.data = maskPersons(data.data, req.user?.role);
      } else if (data.data.subject_id) {
        data.data = maskPerson(data.data, req.user?.role);
      }
    }
    return originalJson(data);
  };
  next();
}