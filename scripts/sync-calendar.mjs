#!/usr/bin/env node
// Syncs the club's Google Calendar with the sessions defined in
// content/programacio/**/index.md. Runs on every deploy (see
// .github/workflows/deploy.yml) so the calendar always reflects the
// live site without anyone touching it by hand.
//
// This manages the WHOLE calendar: any event that isn't the "default"
// type (birthdays, out-of-office, etc. are left alone) and doesn't match
// a current session gets deleted, even if it was added by hand. Set
// DRY_RUN=true to log the planned creates/updates/deletes without
// calling the API.
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { google } from "googleapis";

const BASE_URL = "https://cineclubrodadebera.cat";
const VENUE_NAME = "Teatre del Casino Municipal de Roda de Berà";
const EVENT_DURATION_HOURS = 3;
const SOURCE_TAG = "cineclub-website-sync";
const CONTENT_DIR = path.join(process.cwd(), "content", "programacio");

function findSessionFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      const indexPath = path.join(full, "index.md");
      try {
        if (statSync(indexPath).isFile()) files.push(indexPath);
      } catch {
        // no index.md in this directory, skip
      }
      files.push(...findSessionFiles(full));
    }
  }
  return files;
}

function extractSinopsi(body) {
  const match = body.match(/## Sinopsi\s*\n([\s\S]*?)(?:\n##\s|$)/);
  return match ? match[1].trim() : "";
}

function displayTitle(data) {
  const original = data.title;
  const spanish = data.titol_espanya;
  if (spanish && spanish.trim().toLowerCase() !== original.trim().toLowerCase()) {
    return `${original} (${spanish})`;
  }
  return original;
}

function buildSessions() {
  const files = findSessionFiles(CONTENT_DIR);
  const sessions = [];
  for (const file of files) {
    const raw = readFileSync(file, "utf8");
    const { data, content } = matter(raw);
    if (!data.date) continue;

    const slug = path.basename(path.dirname(file));
    const year = new Date(data.date).getUTCFullYear();
    const url = `${BASE_URL}/programacio/${year}/${slug}/`;

    let synopsis = data.sinopsi_cartell || extractSinopsi(content);
    synopsis = synopsis
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (synopsis.length > 200) {
      synopsis = `${synopsis.slice(0, 200).trim()}…`;
    }

    sessions.push({
      uid: `${slug}-${new Date(data.date).toISOString().slice(0, 10).replace(/-/g, "")}@cineclubrodadebera.cat`,
      title: displayTitle(data),
      seccio: data.seccio,
      start: new Date(data.date),
      synopsis,
      url,
    });
  }
  return sessions;
}

// -- "Per determinar" placeholders --------------------------------------
// The calendar should always show 3 upcoming placeholders for any month
// that doesn't yet have a cartellera session scheduled, defaulting to the
// first Thursday of that month at 19:00h (Europe/Madrid).

function lastSundayOfMonth(year, month) {
  // month is 0-indexed; returns the day-of-month of the last Sunday.
  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  return lastDay.getUTCDate() - lastDay.getUTCDay();
}

function isEuSummerTime(utcDate) {
  const year = utcDate.getUTCFullYear();
  const dstStart = new Date(Date.UTC(year, 2, lastSundayOfMonth(year, 2), 1, 0, 0));
  const dstEnd = new Date(Date.UTC(year, 9, lastSundayOfMonth(year, 9), 1, 0, 0));
  return utcDate >= dstStart && utcDate < dstEnd;
}

function firstThursdayAt19Madrid(year, month) {
  const first = new Date(Date.UTC(year, month, 1));
  const dayOfMonth = 1 + ((4 - first.getUTCDay() + 7) % 7); // 4 = Thursday
  const noonReference = new Date(Date.UTC(year, month, dayOfMonth, 12, 0, 0));
  const offsetHours = isEuSummerTime(noonReference) ? 2 : 1;
  return new Date(Date.UTC(year, month, dayOfMonth, 19 - offsetHours, 0, 0));
}

function buildPlaceholders(sessions, now) {
  const cartelleraMonths = new Set(
    sessions
      .filter((s) => s.seccio === "cartellera")
      .map((s) => `${s.start.getUTCFullYear()}-${s.start.getUTCMonth()}`),
  );

  const placeholders = [];
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth();
  let safety = 0;
  while (placeholders.length < 3 && safety < 60) {
    safety += 1;
    const key = `${year}-${month}`;
    if (!cartelleraMonths.has(key)) {
      const start = firstThursdayAt19Madrid(year, month);
      if (start > now) {
        placeholders.push({
          uid: `placeholder-${year}-${String(month + 1).padStart(2, "0")}@cineclubrodadebera.cat`,
          title: "Sessió per determinar",
          seccio: "placeholder",
          start,
          synopsis: "Pel·lícula encara per determinar.",
          url: `${BASE_URL}/programacio/`,
        });
      }
    }
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return placeholders;
}

async function main() {
  const keyJson = process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const dryRun = process.env.DRY_RUN === "true";
  if (!keyJson || !calendarId) {
    throw new Error("Missing GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY or GOOGLE_CALENDAR_ID");
  }
  if (dryRun) console.log("DRY RUN: no changes will be made to the calendar.");

  const credentials = JSON.parse(keyJson);
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  const calendar = google.calendar({ version: "v3", auth });

  const sessions = buildSessions();
  const placeholders = buildPlaceholders(sessions, new Date());
  const allEvents = [...sessions, ...placeholders];
  console.log(`Found ${sessions.length} sessions and ${placeholders.length} placeholders to sync.`);

  // List every event on the calendar, not just ones we manage: any
  // "default" event that doesn't match a current session is treated as
  // stale and removed, even if a human added it by hand. Non-default
  // event types (birthdays, out-of-office, working location, etc.) are
  // always left alone.
  const existingByUid = new Map();
  let pageToken;
  do {
    const res = await calendar.events.list({
      calendarId,
      showDeleted: false,
      singleEvents: true,
      maxResults: 250,
      pageToken,
    });
    for (const ev of res.data.items ?? []) {
      if ((ev.eventType ?? "default") !== "default") continue;
      if (ev.iCalUID) existingByUid.set(ev.iCalUID, ev);
    }
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  for (const session of sessions) {
    const end = new Date(session.start.getTime() + EVENT_DURATION_HOURS * 60 * 60 * 1000);
    const description = `${session.synopsis}\n\nMés informació i entrades: ${session.url}`;
    const resource = {
      summary: session.title,
      location: VENUE_NAME,
      description,
      start: { dateTime: session.start.toISOString() },
      end: { dateTime: end.toISOString() },
      source: { title: "Fitxa de la sessió", url: session.url },
      extendedProperties: { private: { source: SOURCE_TAG } },
    };

    const existing = existingByUid.get(session.uid);
    if (existing) {
      // Same session, same UID: update the existing event in place
      // (e.g. the date, synopsis or title changed) instead of creating
      // a second copy.
      if (!dryRun) {
        await calendar.events.patch({ calendarId, eventId: existing.id, requestBody: resource });
      }
      console.log(`${dryRun ? "[dry-run] " : ""}Updated: ${session.title}`);
      existingByUid.delete(session.uid);
    } else {
      // No event with this UID yet: either a brand-new session, or an
      // existing session whose date changed (its UID embeds the date,
      // so a reschedule looks like a new UID here — the stale event
      // under the old UID gets removed below).
      if (!dryRun) {
        await calendar.events.insert({
          calendarId,
          requestBody: { ...resource, iCalUID: session.uid },
        });
      }
      console.log(`${dryRun ? "[dry-run] " : ""}Created: ${session.title}`);
    }
  }

  for (const [uid, ev] of existingByUid) {
    if (!dryRun) {
      await calendar.events.delete({ calendarId, eventId: ev.id });
    }
    console.log(`${dryRun ? "[dry-run] " : ""}Removed: ${ev.summary ?? uid}`);
  }

  console.log("Calendar sync complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
