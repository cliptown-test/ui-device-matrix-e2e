import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const matrix = JSON.parse(await readFile(
  new URL('../proximity-device-matrix.json', import.meta.url),
  'utf8',
));

test('all five release platforms have an explicit Flutter role and permission surface', () => {
  assert.deepEqual(Object.keys(matrix.platforms).sort(), [
    'android', 'ios', 'linux', 'macos', 'windows',
  ]);
  for (const [platform, contract] of Object.entries(matrix.platforms)) {
    assert.ok(contract.flutter.includes('central'), `${platform} must support Flutter central`);
    assert.ok(contract.permissionSurfaces.includes('radio-off'));
    assert.ok(contract.permissionSurfaces.includes('revocation'));
  }
});

test('independent Flutter and Rust desktop apps are certified in tandem without claiming Linux advertising', () => {
  for (const platform of ['windows', 'macos', 'linux']) {
    assert.ok(matrix.platforms[platform].flutter.includes('central'));
    assert.ok(matrix.platforms[platform].rust.includes('central'));
  }
  assert.ok(matrix.platforms.windows.flutter.includes('peripheral'));
  assert.ok(matrix.platforms.macos.flutter.includes('peripheral'));
  assert.equal(matrix.platforms.linux.flutter.includes('peripheral'), false);
  assert.equal(matrix.platforms.linux.rust.includes('peripheral'), false);
});

test('physical-device gate covers mobile-to-mobile, every desktop, consent, lifecycle, and attacks', () => {
  const pairs = new Set(matrix.requiredPhysicalPairs.map((pair) => pair.join(':')));
  for (const pair of [
    'android:android', 'ios:ios', 'android:ios',
    'android:windows', 'android:macos', 'android:linux',
    'ios:windows', 'ios:macos', 'ios:linux',
  ]) assert.ok(pairs.has(pair), `missing ${pair}`);

  for (const canary of [
    'explicit-foreground-start', 'matching-transcript-code',
    'bilateral-pairing-consent', 'per-offer-import-consent',
    'permission-denied', 'permission-revoked', 'radio-off', 'wrong-code',
    'one-sided-consent', 'wrong-recipient', 'replay', 'reorder', 'expiry',
    'oversize', 'digest-mismatch', 'signature-mismatch',
    'background-teardown', 'disconnect-reconnect',
  ]) assert.ok(matrix.requiredCanaries.includes(canary), `missing ${canary}`);
  assert.equal(matrix.hostedRadioEvidence, false);
});
