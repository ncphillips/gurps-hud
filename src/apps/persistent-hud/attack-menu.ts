import { t } from "@/i18n";

type Entry = foundry.applications.ux.ContextMenu.Entry<HTMLElement>;

export interface AttackMenuActions {
  remove: (key: string) => void;
}

/** The row the menu opened on carries its attack's key, the same key every other gesture uses. */
function keyOf(row: HTMLElement): string {
  return row.dataset.hudAttack ?? "";
}

/** The right-click menu on an attack row. */
export function attackMenuEntries(actions: AttackMenuActions): Entry[] {
  return [
    {
      label: t("weapons.remove"),
      icon: "fa-solid fa-trash",
      onClick: (_event, row) => actions.remove(keyOf(row)),
    },
  ];
}
