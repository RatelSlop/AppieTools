import test from 'node:test';
import assert from 'node:assert/strict';

// Test implementation of calculate functions for direct verification
function calculateEan13CheckDigit(first12Digits) {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(first12Digits[i], 10);
    sum += i % 2 === 0 ? digit * 1 : digit * 3;
  }
  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

function calculateEan8CheckDigit(first7Digits) {
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const digit = parseInt(first7Digits[i], 10);
    sum += i % 2 === 0 ? digit * 3 : digit * 1;
  }
  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

test('EAN-13 check digit calculation for Calvé Pindakaas', () => {
  const first12 = '871120043163';
  const check = calculateEan13CheckDigit(first12);
  assert.equal(check, 2);
});

test('EAN-13 check digit calculation for Coca-Cola 330ml', () => {
  // 5449000000996
  const first12 = '544900000099';
  const check = calculateEan13CheckDigit(first12);
  assert.equal(check, 6);
});

test('EAN-8 check digit calculation', () => {
  // 96385074
  const first7 = '9638507';
  const check = calculateEan8CheckDigit(first7);
  assert.equal(check, 4);
});
