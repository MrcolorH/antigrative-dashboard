import test from 'node:test';
import assert from 'node:assert/strict';

test('hover delay waits before showing, cancelable on leave, instant switch when warm', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });

  let cardName = null, hoverTimer = null, openTimer = null, lastWarmAt = 0;
  const HOVER_DELAY = 250, WARM_WINDOW = 350, LEAVE_DELAY = 120;
  const isWarm = () => Boolean(cardName || (lastWarmAt > 0 && Date.now() - lastWarmAt < WARM_WINDOW));

  function show(name) {
    clearTimeout(hoverTimer);
    clearTimeout(openTimer);
    openTimer = null;
    cardName = name;
    lastWarmAt = Date.now();
  }

  function hide() {
    clearTimeout(openTimer);
    openTimer = null;
    if (cardName) lastWarmAt = Date.now();
    cardName = null;
  }

  function hoverChip(name) {
    clearTimeout(hoverTimer);
    if (isWarm()) {
      clearTimeout(openTimer);
      openTimer = null;
      show(name);
    } else {
      clearTimeout(openTimer);
      openTimer = setTimeout(() => {
        openTimer = null;
        show(name);
      }, HOVER_DELAY);
    }
  }

  function leaveChip() {
    clearTimeout(openTimer);
    openTimer = null;
  }

  function scheduleHide(engaged = false) {
    clearTimeout(openTimer);
    openTimer = null;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => {
      if (!engaged) hide();
    }, LEAVE_DELAY);
  }

  // 1. Initial hover in cold state does not show immediately
  hoverChip('speed');
  assert.equal(cardName, null, 'cold hover must not show immediately');

  // 2. Leaving before delay cancels opening
  t.mock.timers.tick(100);
  leaveChip();
  t.mock.timers.tick(200);
  assert.equal(cardName, null, 'leaving before delay cancels opening');

  // 3. Hovering and waiting past HOVER_DELAY opens the card
  hoverChip('speed');
  t.mock.timers.tick(HOVER_DELAY);
  assert.equal(cardName, 'speed', 'waiting past delay opens the card');

  // 4. Moving to another chip while card is open switches immediately
  hoverChip('cache');
  assert.equal(cardName, 'cache', 'switching to another chip while warm is immediate');

  // 5. Leaving the toolbar starts cooldown
  scheduleHide(false);
  t.mock.timers.tick(LEAVE_DELAY);
  assert.equal(cardName, null, 'card hides after leave delay');

  // 6. Hovering another chip within WARM_WINDOW shows immediately
  t.mock.timers.tick(100);
  hoverChip('context');
  assert.equal(cardName, 'context', 'hovering within cooldown window opens immediately');

  // 7. Leaving and waiting past WARM_WINDOW resets to cold state
  scheduleHide(false);
  t.mock.timers.tick(LEAVE_DELAY);
  t.mock.timers.tick(400);
  assert.equal(isWarm(), false, 'cools down after warm window expires');
  hoverChip('speed');
  assert.equal(cardName, null, 'cold hover after cooldown requires delay again');
  t.mock.timers.tick(HOVER_DELAY);
  assert.equal(cardName, 'speed', 'opens after delay');
});
