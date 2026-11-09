import { and, eq } from "drizzle-orm";
import { PLATS } from "@/features/applications/domain/platforms";
import { CommandFailure, requireMatch, type CommandHandlers } from "@/features/sync/infrastructure/command-handler";
import { insertRows, nextPosition, type DbTransaction } from "@/shared/db/rows";
import { platforms, searchChecks } from "./schema";

const platformIds = async (tx: DbTransaction, userId: string): Promise<Set<string>> =>
  new Set((await tx.select({ id: platforms.id }).from(platforms).where(eq(platforms.userId, userId))).map((p) => p.id));

/** Search pages and their daily checks. Checks go with their platform (ON DELETE CASCADE). */
export const dailySearchHandlers = {
  "platform.add": async (tx, userId, { platform }) => {
    if ((await platformIds(tx, userId)).has(platform.id)) throw new CommandFailure("conflict");
    await tx.insert(platforms).values({
      userId,
      id: platform.id,
      name: platform.name,
      url: platform.url,
      custom: platform.custom === true,
      position: await nextPosition(tx, platforms, eq(platforms.userId, userId)),
    });
  },
  "platform.update": async (tx, userId, { id, name, url }) => {
    requireMatch(
      await tx
        .update(platforms)
        .set({ name, url })
        .where(and(eq(platforms.userId, userId), eq(platforms.id, id))),
    );
  },
  "platform.remove": async (tx, userId, { id }) => {
    requireMatch(await tx.delete(platforms).where(and(eq(platforms.userId, userId), eq(platforms.id, id))));
  },
  "platform.restoreDefaults": async (tx, userId) => {
    const have = await platformIds(tx, userId);
    const start = await nextPosition(tx, platforms, eq(platforms.userId, userId));
    await insertRows(
      tx,
      platforms,
      PLATS.filter((p) => !have.has(p.id)).map((p, i) => ({
        userId,
        id: p.id,
        name: p.name,
        url: p.url,
        custom: p.custom === true,
        position: start + i,
      })),
    );
  },
  "check.set": async (tx, userId, { month, platformId, day, checked }) => {
    if (!(await platformIds(tx, userId)).has(platformId)) throw new CommandFailure("not_found");
    if (checked) {
      await tx.insert(searchChecks).ignore().values({ userId, month, platformId, day });
    } else {
      await tx
        .delete(searchChecks)
        .where(
          and(
            eq(searchChecks.userId, userId),
            eq(searchChecks.month, month),
            eq(searchChecks.platformId, platformId),
            eq(searchChecks.day, day),
          ),
        );
    }
  },
  "check.markDay": async (tx, userId, { month, day }) => {
    const ids = [...(await platformIds(tx, userId))];
    if (ids.length) {
      await tx.insert(searchChecks).ignore().values(ids.map((platformId) => ({ userId, month, platformId, day })));
    }
  },
} satisfies CommandHandlers;
