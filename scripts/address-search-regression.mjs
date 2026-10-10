import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

// Execute the actual handlers with controlled hooks, timers and HTTP responses.
// This lets requests finish during the debounce window without external APIs.
const source = readFileSync(new URL('../website/src/App.jsx', import.meta.url), 'utf8');

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

for (const query of ['IST', 'istanbul hava', 'SAW', 'sabiha gokcen']) {
  test(`HomeBookingCard: ${query} keeps provider addresses without a canonical airport`, async () => {
    const form = formHarness('HomeBookingCard');
    form.change('pickup', query);
    const pending = form.runTimer();
    form.requests[0].resolve({ data: { data: [{
      name: 'Airport address from Geoapify',
      provider: 'geoapify',
      latitude: 41.2626742,
      longitude: 28.743779,
      is_airport: false,
      location_id: null,
    }] } });
    await pending;
    assert.equal(form.suggestions('pickup').length, 1);
    assert.equal(form.suggestions('pickup')[0].provider, 'geoapify');
    assert.equal(form.suggestions('pickup')[0].location_id, null);
  });
}

test('HomeBookingCard: a canonical airport takes priority over provider addresses', async () => {
  const form = formHarness('HomeBookingCard');
  form.change('pickup', 'istanbul hava');
  const pending = form.runTimer();
  form.requests[0].resolve({ data: { data: [
    { name: 'Other address', provider: 'geoapify', location_id: null },
    { name: 'Istanbul Airport', provider: 'skyfleet', is_airport: true, location_id: 123, iata: 'IST' },
  ] } });
  await pending;
  assert.equal(form.suggestions('pickup').length, 1);
  assert.equal(form.suggestions('pickup')[0].location_id, 123);
});

function formHarness(component) {
  const home = component === 'HomeBookingCard';
  const start = source.indexOf(`function ${component}(`);
  const end = source.indexOf(home ? '  function renderSuggestions(' : '  function closeLocationDropdown(', start);
  assert.ok(start >= 0 && end > start, 'Address handler source found');
  const states = [];
  const timers = new Map();
  const requests = [];
  const details = deferred();
  let timerId = 0;
  const context = vm.createContext({
    console,
    PUBLIC_API_BASE: '/public',
    useState(initial) {
      const index = states.length;
      states.push(initial);
      return [initial, (next) => {
        states[index] = typeof next === 'function' ? next(states[index]) : next;
      }];
    },
    useRef: (current) => ({ current }),
    setTimeout(callback) { timers.set(++timerId, callback); return timerId; },
    clearTimeout(id) { timers.delete(id); },
    queryHasAirportIntent: () => false,
    resolveGooglePlaceSuggestion: () => details.promise,
    axios: { get() {
      const request = deferred();
      requests.push(request);
      return request.promise;
    } },
  });
  const handlers = vm.runInContext(
    `${source.slice(start, end)}\nreturn { change: ${home ? 'changeLocation' : 'updateLocationValue'}, select: selectLocation };\n}\n${component}({ language: 'tr' });`,
    context,
  );
  return {
    ...handlers,
    requests,
    details,
    runTimer() {
      const [id, callback] = timers.entries().next().value;
      timers.delete(id);
      return callback();
    },
    suggestions(field) { return home ? states[3][field] : states[field === 'pickup' ? 6 : 7]; },
    loading(field) { return home ? states[5][field] : states[field === 'pickup' ? 10 : 11]; },
    selected(field) { return states[home ? 2 : 5][field]; },
    text(field) { return states[home ? (field === 'pickup' ? 0 : 1) : (field === 'pickup' ? 3 : 4)]; },
  };
}

for (const component of ['HomeBookingCard', 'TransferPage']) {
  for (const field of ['pickup', 'dropoff']) {
    test(`${component} ${field}: old response during debounce cannot populate suggestions`, async () => {
      const form = formHarness(component);
      form.change(field, 'Old address');
      const first = form.runTimer();
      form.change(field, 'New address');
      form.requests[0].resolve({ data: { data: [{ name: 'Old result' }] } });
      await first;
      assert.equal(form.suggestions(field).length, 0);
      assert.equal(form.loading(field), true);
      const second = form.runTimer();
      form.requests[1].resolve({ data: { data: [{ name: 'New result' }] } });
      await second;
      assert.equal(form.suggestions(field)[0].name, 'New result');
      assert.equal(form.loading(field), false);
    });

    test(`${component} ${field}: clearing input ignores an outstanding response`, async () => {
      const form = formHarness(component);
      form.change(field, 'Old address');
      const pending = form.runTimer();
      form.change(field, '');
      form.requests[0].resolve({ data: { data: [{ name: 'Old result' }] } });
      await pending;
      assert.equal(form.suggestions(field).length, 0);
      assert.equal(form.loading(field), false);
    });

    test(`${component} ${field}: stale place details cannot overwrite a new address`, async () => {
      const form = formHarness(component);
      const selecting = form.select(field, { provider: 'google_maps', place_id: 'old', latitude: null, longitude: null });
      form.change(field, 'New address');
      form.details.resolve({ formatted_address: 'Old selected address', latitude: 41, longitude: 29 });
      await selecting;
      assert.equal(form.text(field), 'New address');
      assert.equal(form.selected(field), null);
      assert.equal(form.loading(field), true);
    });

    test(`${component} ${field}: a current place selection still succeeds`, async () => {
      const form = formHarness(component);
      const selecting = form.select(field, { provider: 'google_maps', place_id: 'current', latitude: null, longitude: null });
      form.details.resolve({ formatted_address: 'Selected address', latitude: 41, longitude: 29 });
      await selecting;
      assert.equal(form.text(field), 'Selected address');
      assert.equal(form.selected(field).latitude, 41);
      assert.equal(form.loading(field), false);
    });
  }
}
