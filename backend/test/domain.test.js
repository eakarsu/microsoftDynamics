const assert = require('node:assert/strict');
const test = require('node:test');
const { AppError, canonical, digest, qualifyLead, validateLead } = require('../domain');

test('lead validation normalizes identity and rejects malformed input', () => {
  assert.deepEqual(validateLead({
    firstName: ' Ada ', lastName: ' Lovelace ', email: ' ADA@EXAMPLE.COM ',
    company: ' Analytical Engines ', estimatedValue: '1250.239', notes: '',
  }), {
    firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com',
    company: 'Analytical Engines', estimatedValue: 1250.24, notes: null,
  });
  assert.throws(() => validateLead({ firstName: 'A', lastName: 'B', email: 'bad', company: 'C', estimatedValue: 1 }), (error) => error instanceof AppError && error.code === 'VALIDATION_ERROR');
});

test('qualification is deterministic and canonical request hashes are stable', () => {
  const input = { budgetConfirmed: true, authorityIdentified: true, needDefined: true, timelineDays: 90, expectedVersion: 1 };
  assert.deepEqual(qualifyLead(input), {
    rubric: { budgetConfirmed: true, authorityIdentified: true, needDefined: true, timelineDays: 90 },
    score: 100, outcome: 'qualified', notes: null, expectedVersion: 1,
  });
  assert.equal(digest({ b: 2, a: 1 }), digest({ a: 1, b: 2 }));
});

test('qualification threshold and timeline bands are explicit', () => {
  const base = { budgetConfirmed: true, authorityIdentified: true, needDefined: true, expectedVersion: 2 };
  assert.deepEqual(
    [90, 180, 181].map((timelineDays) => qualifyLead({ ...base, timelineDays }).score),
    [100, 90, 75],
  );
  assert.equal(qualifyLead({ ...base, timelineDays: 365 }).outcome, 'qualified');
});

test('invalid booleans, timelines, and versions fail closed', () => {
  assert.throws(() => qualifyLead({ budgetConfirmed: 'yes', authorityIdentified: true, needDefined: true, timelineDays: 30, expectedVersion: 1 }), /must be boolean/);
  assert.throws(() => qualifyLead({ budgetConfirmed: true, authorityIdentified: true, needDefined: true, timelineDays: 0, expectedVersion: 1 }), /positive integer/);
  assert.throws(() => qualifyLead({ budgetConfirmed: true, authorityIdentified: true, needDefined: true, timelineDays: 30, expectedVersion: 0 }), /positive integer/);
});

test('canonical serialization recursively sorts audit payload keys', () => {
  assert.equal(canonical({ b: 2, a: { d: 4, c: 3 } }), '{"a":{"c":3,"d":4},"b":2}');
});
