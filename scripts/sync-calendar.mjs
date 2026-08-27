#!/usr/bin/env node
// Syncs the club's Google Calendar with the sessions defined in
// content/programacio/**/index.md. Runs on every deploy (see
// .github/workflows/deploy.yml) so the calendar always reflects the
// live site without anyone touching it by hand.
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
      title: data.title,
      start: new Date(data.date),
      synopsis,
      url,
    });
  }
  return sessions;
}

async function main() {
  const keyJson = process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!keyJson || !calendarId) {
    throw new Error("Missing GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY or GOOGLE_CALENDAR_ID");
  }
  const credentials = JSON.parse(keyJson);
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  const calendar = google.calendar({ version: "v3", auth });

  const sessions = buildSessions();
  console.log(`Found ${sessions.length} sessions to sync.`);

  const managed = new Map();
  let pageToken;
  do {
    const res = await calendar.events.list({
      calendarId,
      privateExtendedProperty: [`source=${SOURCE_TAG}`],
      showDeleted: false,
      singleEvents: true,
      maxResults: 250,
      pageToken,
    });
    for (const ev of res.data.items ?? []) {
      if (ev.iCalUID) managed.set(ev.iCalUID, ev);
    }
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  for (const session of sessions) {
    const end = new Date(session.start.getTime() + EVENT_DURATION_HOURS * 60 * 60 * 1000);
    const description = `${session.synopsis}\n\nMés informació i entrades: ${session.url}`;

    await calendar.events.import({
      calendarId,
      requestBody: {
        iCalUID: session.uid,
        summary: session.title,
        location: VENUE_NAME,
        description,
        start: { dateTime: session.start.toISOString() },
        end: { dateTime: end.toISOString() },
        source: { title: "Fitxa de la sessió", url: session.url },
        extendedProperties: { private: { source: SOURCE_TAG } },
      },
    });
    console.log(`Synced: ${session.title}`);
    managed.delete(session.uid);
  }

  for (const [uid, ev] of managed) {
    await calendar.events.delete({ calendarId, eventId: ev.id });
    console.log(`Removed: ${ev.summary ?? uid}`);
  }

  console.log("Calendar sync complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
