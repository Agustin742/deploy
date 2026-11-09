import { and, eq } from "drizzle-orm";
import { APP_FIELDS, INTERVIEW_FIELDS } from "@/features/sync/domain/field-specs";
import { coerceFields } from "@/features/sync/infrastructure/coerce-fields";
import { CommandFailure, requireMatch, type CommandHandlers } from "@/features/sync/infrastructure/command-handler";
import type { Application, Interview } from "@/features/state/domain/types";
import { flag, insertRows, shiftPositions, str, type DbTransaction } from "@/shared/db/rows";
import { applicationChecklist, applications, interviews } from "./schema";

const ownsApp = (userId: string, id: string) => and(eq(applications.userId, userId), eq(applications.id, id));

async function requireApp(tx: DbTransaction, userId: string, id: string): Promise<void> {
  const [found] = await tx.select({ id: applications.id }).from(applications).where(ownsApp(userId, id));
  if (!found) throw new CommandFailure("not_found");
}

const interviewRow = (userId: string, applicationId: string, i: Interview, position: number) => ({
  ...coerceFields(INTERVIEW_FIELDS, i),
  userId,
  applicationId,
  id: i.id,
  position,
});

/** Company-profile key (`industria`) -> column key (`fichaIndustria`). Keys come from the allow-list. */
const fichaColumn = (key: string) => `ficha${key[0].toUpperCase()}${key.slice(1)}`;

function applicationRow(userId: string, a: Application, position: number) {
  const ficha = Object.fromEntries(Object.entries(a.ficha ?? {}).map(([k, v]) => [fichaColumn(k), str(v)]));
  return { ...coerceFields(APP_FIELDS, a), ...ficha, userId, id: a.id, match: a.match ?? null, position };
}

/** Applications with their interviews and preparation checklist. Interviews and checklist rows cascade from the application. */
export const applicationsHandlers = {
  "app.create": async (tx, userId, { app }) => {
    const [existing] = await tx.select({ id: applications.id }).from(applications).where(ownsApp(userId, app.id));
    if (existing) throw new CommandFailure("conflict");
    // New applications go first, like `saveDraft` on the client.
    await shiftPositions(tx, applications, eq(applications.userId, userId));
    await tx.insert(applications).values(applicationRow(userId, app, 0) as never);
    const unique = [...new Map((app.entrevistas ?? []).map((i) => [i.id, i])).values()];
    await insertRows(
      tx,
      interviews,
      unique.map((i, position) => interviewRow(userId, app.id, i, position) as never),
    );
    await insertRows(
      tx,
      applicationChecklist,
      Object.entries(app.pre ?? {}).map(([itemKey, item]) => ({
        userId,
        applicationId: app.id,
        itemKey,
        ok: flag(item?.ok),
        txt: str(item?.txt),
      })),
    );
  },

  "app.setFields": async (tx, userId, { id, fields, ficha, match }) => {
    const set: Record<string, unknown> = { ...fields };
    for (const [key, value] of Object.entries(ficha ?? {})) set[fichaColumn(key)] = value;
    if (match !== undefined) set.match = match;
    requireMatch(await tx.update(applications).set(set as never).where(ownsApp(userId, id)));
  },

  "app.remove": async (tx, userId, { id }) => {
    requireMatch(await tx.delete(applications).where(ownsApp(userId, id)));
  },

  "interview.add": async (tx, userId, { appId, interview }) => {
    await requireApp(tx, userId, appId);
    const ofApp = and(eq(interviews.userId, userId), eq(interviews.applicationId, appId));
    const [existing] = await tx
      .select({ id: interviews.id })
      .from(interviews)
      .where(and(ofApp, eq(interviews.id, interview.id)));
    if (existing) throw new CommandFailure("conflict");
    // New interviews go first, like `addInterview` on the client.
    await shiftPositions(tx, interviews, ofApp);
    await tx.insert(interviews).values(interviewRow(userId, appId, interview, 0) as never);
  },

  "interview.setFields": async (tx, userId, { appId, id, fields }) => {
    requireMatch(
      await tx
        .update(interviews)
        .set(fields)
        .where(and(eq(interviews.userId, userId), eq(interviews.applicationId, appId), eq(interviews.id, id))),
    );
  },

  "interview.remove": async (tx, userId, { appId, id }) => {
    requireMatch(
      await tx
        .delete(interviews)
        .where(and(eq(interviews.userId, userId), eq(interviews.applicationId, appId), eq(interviews.id, id))),
    );
  },

  "checklist.set": async (tx, userId, { appId, key, ok, txt }) => {
    await requireApp(tx, userId, appId);
    // Only the given part changes, like `{ ...pre[key], [field]: value }` on the client.
    const given = { ...(ok === undefined ? {} : { ok }), ...(txt === undefined ? {} : { txt }) };
    await tx
      .insert(applicationChecklist)
      .values({ userId, applicationId: appId, itemKey: key, ...given })
      .onDuplicateKeyUpdate({ set: given });
  },
} satisfies CommandHandlers;
