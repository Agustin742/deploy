import { and, eq } from "drizzle-orm";
import type { CommandHandlers } from "@/features/sync/infrastructure/command-handler";
import { CommandFailure, requireMatch } from "@/features/sync/infrastructure/command-handler";
import { coerceFields } from "@/features/sync/infrastructure/coerce-fields";
import { REGISTRY_FIELDS } from "@/features/sync/domain/field-specs";
import { shiftPositions } from "@/shared/db/rows";
import { REGISTRY_TABLES, type RegistryTable } from "./registry-tables";

/** Both lookups are allow-list keyed: the kind was validated against `REGISTRY_FIELDS`. */
const tableOf = (kind: keyof typeof REGISTRY_TABLES): RegistryTable => REGISTRY_TABLES[kind];

/** Add, edit and remove for the nine registries (objectives included); the kind selects the table. */
export const registryHandlers = {
  "registry.add": async (tx, userId, { kind, item }) => {
    const table = tableOf(kind);
    const [existing] = await tx
      .select({ id: table.id })
      .from(table)
      .where(and(eq(table.userId, userId), eq(table.id, item.id)));
    if (existing) throw new CommandFailure("conflict");
    // New items go first, like `addItem` on the client.
    await shiftPositions(tx, table, eq(table.userId, userId));
    await tx.insert(table).values({ ...coerceFields(REGISTRY_FIELDS[kind], item), userId, id: item.id, position: 0 } as never);
  },
  "registry.setFields": async (tx, userId, { kind, id, fields }) => {
    const table = tableOf(kind);
    requireMatch(await tx.update(table).set(fields as never).where(and(eq(table.userId, userId), eq(table.id, id))));
  },
  "registry.remove": async (tx, userId, { kind, id }) => {
    const table = tableOf(kind);
    requireMatch(await tx.delete(table).where(and(eq(table.userId, userId), eq(table.id, id))));
  },
} satisfies CommandHandlers;
