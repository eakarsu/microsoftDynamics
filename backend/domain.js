const crypto = require('node:crypto');
const { AppError, assert } = require('./errors');

const ROLES = new Set(['sales_rep', 'manager', 'admin']);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value, field, { min = 1, max = 255, optional = false } = {}) {
  if ((value === undefined || value === null || value === '') && optional) return null;
  assert(typeof value === 'string', 400, 'VALIDATION_ERROR', `${field} must be text`);
  const normalized = value.trim();
  assert(normalized.length >= min && normalized.length <= max, 400, 'VALIDATION_ERROR', `${field} must be ${min}-${max} characters`);
  return normalized;
}

function email(value, field = 'email') {
  const normalized = text(value, field, { max: 254 }).toLowerCase();
  assert(EMAIL.test(normalized), 400, 'VALIDATION_ERROR', `${field} is invalid`);
  return normalized;
}

function money(value, field = 'estimatedValue') {
  const amount = typeof value === 'string' && value.trim() ? Number(value) : value;
  assert(Number.isFinite(amount) && amount >= 0 && amount <= 1_000_000_000, 400, 'VALIDATION_ERROR', `${field} must be between 0 and 1000000000`);
  return Math.round(amount * 100) / 100;
}

function positiveInteger(value, field) {
  const number = typeof value === 'string' ? Number(value) : value;
  assert(Number.isInteger(number) && number > 0, 400, 'VALIDATION_ERROR', `${field} must be a positive integer`);
  return number;
}

function boolean(value, field) {
  assert(typeof value === 'boolean', 400, 'VALIDATION_ERROR', `${field} must be boolean`);
  return value;
}

function validateRole(role) {
  assert(ROLES.has(role), 400, 'VALIDATION_ERROR', 'role is invalid');
  return role;
}

function validateLead(input = {}) {
  return {
    firstName: text(input.firstName, 'firstName', { max: 100 }),
    lastName: text(input.lastName, 'lastName', { max: 100 }),
    email: email(input.email),
    company: text(input.company, 'company', { max: 200 }),
    estimatedValue: money(input.estimatedValue),
    notes: text(input.notes, 'notes', { max: 2_000, optional: true }),
  };
}

function qualifyLead(input = {}) {
  const rubric = {
    budgetConfirmed: boolean(input.budgetConfirmed, 'budgetConfirmed'),
    authorityIdentified: boolean(input.authorityIdentified, 'authorityIdentified'),
    needDefined: boolean(input.needDefined, 'needDefined'),
    timelineDays: positiveInteger(input.timelineDays, 'timelineDays'),
  };
  assert(rubric.timelineDays <= 3_650, 400, 'VALIDATION_ERROR', 'timelineDays must not exceed 3650');
  const score = (rubric.budgetConfirmed ? 25 : 0)
    + (rubric.authorityIdentified ? 25 : 0)
    + (rubric.needDefined ? 25 : 0)
    + (rubric.timelineDays <= 90 ? 25 : rubric.timelineDays <= 180 ? 15 : 0);
  return {
    rubric,
    score,
    outcome: score >= 75 ? 'qualified' : 'new',
    notes: text(input.notes, 'notes', { max: 2_000, optional: true }),
    expectedVersion: positiveInteger(input.expectedVersion, 'expectedVersion'),
  };
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function digest(value) {
  return crypto.createHash('sha256').update(canonical(value)).digest('hex');
}

function parseId(value, field = 'id') {
  return positiveInteger(value, field);
}

function publicUser(row) {
  return { id: Number(row.id), tenantId: Number(row.tenant_id), email: row.email, name: row.full_name, role: row.role };
}

function toLead(row) {
  return {
    id: Number(row.id),
    ownerUserId: Number(row.owner_user_id),
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    company: row.company,
    estimatedValue: Number(row.estimated_value),
    status: row.status,
    score: Number(row.score),
    version: Number(row.version),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toOpportunity(row) {
  return {
    id: Number(row.id),
    leadId: Number(row.lead_id),
    ownerUserId: Number(row.owner_user_id),
    name: row.name,
    accountName: row.account_name,
    amount: Number(row.amount),
    stage: row.stage,
    probability: Number(row.probability),
    version: Number(row.version),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = {
  AppError,
  canonical,
  digest,
  email,
  parseId,
  publicUser,
  qualifyLead,
  text,
  toLead,
  toOpportunity,
  validateLead,
  validateRole,
};
