import { t } from "@/i18n";

type Entry = foundry.applications.ux.ContextMenu.Entry<HTMLElement>;

export interface AttackMenuActions {
  hasNotes: (key: string) => boolean;
  notesShown: (key: string) => boolean;
  toggleNotes: (key: string) => void;
  remove: (key: string) => void;
}

/** The row the menu opened on carries its attack's key, the same key every other gesture uses. */
function keyOf(row: HTMLElement): string {
  return row.dataset.hudAttack ?? "";
}

/** The right-click menu on an attack row. An attack with no notes has nothing to show or hide. */
export function attackMenuEntries(actions: AttackMenuActions): Entry[] {
  return [
    {
      label: t("weapons.showNotes"),
      icon: "fa-solid fa-eye",
      visible: (row) => actions.hasNotes(keyOf(row)) && !actions.notesShown(keyOf(row)),
      onClick: (_event, row) => actions.toggleNotes(keyOf(row)),
    },
    {
      label: t("weapons.hideNotes"),
      icon: "fa-solid fa-eye-slash",
      visible: (row) => actions.hasNotes(keyOf(row)) && actions.notesShown(keyOf(row)),
      onClick: (_event, row) => actions.toggleNotes(keyOf(row)),
    },
    {
      label: t("weapons.remove"),
      icon: "fa-solid fa-trash",
      onClick: (_event, row) => actions.remove(keyOf(row)),
    },
  ];
}
