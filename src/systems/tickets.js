// Tickets: creación, spawn temporizado y expiración.
import {
  POINTS, SPAWN_BASE, SPAWN_MIN, GAME_TIME,
  TICKET_LIFETIME_BUG, TICKET_LIFETIME_FEAT, BUG_DESCS, FEAT_DESCS,
  TUTORIAL_TICKETS, COL,
} from '../config.js';
import { flash } from '../effects.js';

export function makeTicket(state) {
  // Tutorial-scripted ticket
  if (state.learningPhase && state.learningTicketIdx < TUTORIAL_TICKETS.length) {
    const scripted = TUTORIAL_TICKETS[state.learningTicketIdx++];
    const lifetime = 90;
    return {
      id: state.nextTicketId++,
      type: scripted.type,
      desc: scripted.desc,
      hint: scripted.hint,
      stages: new Set(),
      timeLeft: lifetime,
      maxTime: lifetime,
    };
  }
  // Normal random ticket
  const isFeature = Math.random() < 0.55;
  const type = isFeature ? 'FEATURE' : 'BUG';
  const arr = isFeature ? FEAT_DESCS : BUG_DESCS;
  const desc = arr[Math.floor(Math.random() * arr.length)];
  const lifetime = isFeature ? TICKET_LIFETIME_FEAT : TICKET_LIFETIME_BUG;
  return {
    id: state.nextTicketId++,
    type, desc,
    stages: new Set(),
    timeLeft: lifetime,
    maxTime: lifetime,
  };
}

export function spawnIfDue(state, dt) {
  state.nextSpawnIn -= dt;
  if (state.nextSpawnIn <= 0) {
    // During learning, cap concurrent tickets
    if (state.learningPhase) {
      const inFlight = state.inbox.length +
        state.players.filter(p => p.holding).length +
        state.stations
          .filter(s => s.kind === 'process')
          .reduce((sum, s) => sum + s.queue.length, 0);
      if (inFlight >= 2) {
        state.nextSpawnIn = 1.0;
        return;
      }
      state.inbox.push(makeTicket(state));
      state.nextSpawnIn = 8.0;
      return;
    }
    // Normal: ramp up with game progress
    state.inbox.push(makeTicket(state));
    const progress = state.elapsed / GAME_TIME;
    const rate = SPAWN_BASE - (SPAWN_BASE - SPAWN_MIN) * progress;
    state.nextSpawnIn = rate * (0.85 + Math.random() * 0.3);
  }
}

export function updateTickets(state, dt) {
  // Inbox tickets count down (lose if forgotten)
  for (let i = state.inbox.length - 1; i >= 0; i--) {
    state.inbox[i].timeLeft -= dt;
    if (state.inbox[i].timeLeft <= 0) {
      state.score += POINTS.EXPIRED;
      state.expired++;
      flash(state, state.stations.find(s => s.id === 'INBOX').x, 280, 'EXPIRED', COL.red);
      state.inbox.splice(i, 1);
    }
  }
  // Each player's held ticket counts down
  for (const p of state.players) {
    if (p.holding) {
      p.holding.timeLeft -= dt;
      if (p.holding.timeLeft <= 0) {
        state.score += POINTS.EXPIRED;
        state.expired++;
        flash(state, p.x, p.y - 30, 'EXPIRED', COL.red);
        p.holding = null;
      }
    }
  }
  // Tickets in station queues also count down (every ticket, not just the front)
  for (const s of state.stations) {
    if (s.kind !== 'process') continue;
    for (let i = s.queue.length - 1; i >= 0; i--) {
      const entry = s.queue[i];
      entry.ticket.timeLeft -= dt;
      if (entry.ticket.timeLeft <= 0) {
        state.score += POINTS.EXPIRED;
        state.expired++;
        flash(state, s.x, s.y - s.h/2 - 16, 'EXPIRED', COL.red);
        s.queue.splice(i, 1);
      }
    }
  }
}
