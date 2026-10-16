import test from 'node:test'
import assert from 'node:assert/strict'
import { formatCurrency } from './currency.js'

test('formats values in Rwandan Francs', () => {
  assert.equal(formatCurrency(1250), 'RWF 1,250.00')
  assert.equal(formatCurrency(250000.5), 'RWF 250,000.50')
})
