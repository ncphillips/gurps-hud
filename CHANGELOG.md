# Changelog

All notable changes to GURPS HUD are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). A version is shipped by
publishing a GitHub Release tagged `v<MAJOR>.<MINOR>.<PATCH>`; the manifest version is stamped
from that tag.

## v0.6.0 (unreleased)

### Added

- **Minimize the HUD.** The strip sits over the canvas, and closing it outright takes the macros
  with it whenever the HUD owns the hotbar. The button left of the character's name — or
  **Shift+H**, rebindable under Configure Controls — folds the strip down to a single Expand button,
  with the macro footer still beside it if the HUD's own bar is on screen, so the canvas comes back
  without losing your macros. The lock moves to the other side of the name to make room. Whether it
  is minimized is per-player and survives a reload.
- **Move the HUD anywhere.** The strip was bolted to the bottom-left of the canvas, which is exactly
  where the fight is on some maps. Drag the dotted rail down its left edge to put it wherever it is
  out of the way — minimized or not, with the modifier bucket coming along. It stays on screen when
  the window shrinks or the strip grows, and double-clicking the rail puts it back where it docks.
  Foundry's player list only makes room for the strip while it is docked beneath it. Where it sits
  is per-player and survives a reload.

### Changed

- **Panels open where there is room.** Every panel opened upward, which was right while the strip
  could only sit at the bottom of the screen and wrong the moment it could be moved: near the top,
  panels ran off the window. Now a panel opens just above the button that opened it, or just below
  it when there is no room above, slides sideways rather than run off either side, and a long skills
  list shrinks to fit a short window. Panels hang off their own button rather than clearing the
  whole strip, so the posture menu lies over the name row instead of floating away above it — the
  controls in that gap looked pressable but weren't.

### Fixed

- **A firearm's range fits its column.** The range column was drawn at the width a thrown spear's
  `9/13` needs, so a 9mm's `160/1,800` was painted straight over the rate of fire beside it and off
  the edge of the strip ([#24](https://github.com/ncphillips/gurps-hud/issues/24)). The column is now as wide as the ranges the character on screen
  actually carries — heading included — so a rifle reads whole and nobody who fights with a bow
  pays for it.

## v0.5.0

### Added

- **Keep Foundry's hotbar.** The strip's macro footer replaced the stock hotbar outright, which is
  the wrong deal for a table that has furnished that bar over years of play, or handed it to another
  module. **Hotbar** in the module settings draws the HUD's own bar, the default one, or both, and
  takes effect the moment you pick one. Leaving the default bar up also leaves the GURPS modifier
  bucket where the system parks it, beside that bar, rather than adopting it into the strip. It is
  per-player, like the size and the theme, and the HUD's own bar stays the default, so nothing
  changes for anyone who does not go looking.
- **Light mode.** The HUD was drawn dark and could only be read dark, which is a poor deal for
  anyone playing in a bright room or running the rest of Foundry light. **HUD theme** in the module
  settings draws it dark, light, or whatever your desktop is set to, and takes effect the moment you
  pick one — no reload, and it follows the desktop as that changes. It is per-player, like the scale,
  because which one reads well is a fact about your room rather than about the world. Dark stays the
  default, so nothing changes for anyone who does not go looking.

### Changed

- **The HUD is drawn at any scale you like, not one of three.** Small, medium and large were three
  rungs on a question that is really about your screen: at 1440p the design's own size is a shade
  small and large overshoots, with nothing in between to pick. **HUD scale** in the module settings
  is now a slider from 0.9× to 2×, a tenth at a time, and still takes effect the moment you move it.
  The floor is where the strip's smallest labels stop being readable at all, and the ceiling goes
  well past where large stopped. If you had chosen a size, you are back at 1× and will want to set
  it again.
- **The strip's quiet text is readable.** Column headings, maneuver hints and the muted half of a
  pool were drawn faint enough to fail WCAG AA — in places at 1.9:1 against a 4.5:1 requirement — and
  at 8px that is the difference between quiet and unreadable. They are now one ink held at the AA
  floor, with its own strength in each palette, since a faint ink over a light ground loses far more
  contrast than the same ink over a dark one. The hierarchy between a heading and a value is carried
  by size and weight, which it mostly already was.
- The accessibility suite measures colour contrast in both palettes rather than leaving it
  unmeasured, and both pass — so a colour that reads too faint to meet AA now fails a test instead of
  shipping.

## [0.4.0]

The strip is drawn at the size the screen wants, and a drag on the weapon tables does what the
gesture looks like it does.

### Added

- **Pick how big the HUD is.** The strip is drawn to fixed measurements taken from a design made on
  a 1280×713 canvas, so it keeps that size whatever it is shown on: room to spare on a 2560-wide
  screen, where its smallest labels are too small to read, and not enough on the 1024×768 Foundry
  allows at the least. **HUD size** in the module settings draws it small, medium or large — medium
  being the design's own size — and takes effect the moment you pick one. It is per-player, since
  the right size is a fact about the screen you are reading it on.

### Fixed

- **A drag only removes an attack if the attack actually left.** Carrying a row clear of the strip
  is how an attack is removed, but any drag that ended without a drop was being read as one — and
  `Escape` ends a drag without a drop, so backing out of a reorder took the attack with it. The row
  now has to have crossed out of the weapon tables, which is what tells a deletion from a change of
  mind.
- **The insertion marker stays put while crossing a row.** A row is mostly its own cells — the
  grip, the name, every readout — and the browser announces crossing onto one of them as leaving
  the row, so the marker flickered off and back on the way across.
- **A drop the tables cannot use passes through to what is behind them.** Foundry carries every drag
  on `text/plain`, so the tables were swallowing drops that were never attacks — including a macro
  flicked off the HUD, which is how the hotbar is told to give up the slot.
- **A short drag that ends on the row it started on leaves the order alone.** "Ahead of where you
  already are" is where the attack already is, so the drop now changes nothing instead of
  reshuffling the group.
- **Two attacks removed in quick succession both stay removed.** In a world, a write to the actor is
  not readable back until the server answers, so a second `Delete` pressed inside that gap was
  computed from the list before the first one and put the first attack back. Edits now show
  immediately and are written from what is on screen; a write the server refuses — a player
  curating a token they do not own — snaps the list back to what the character actually carries.
- **Attacks and skills whose names contain a quote or a `|` roll.** Quotes were escaped with a
  backslash, which the Game Aid's roll parser does not read as an escape: a name ending in one ran
  on past the closing quote and was parsed as roll syntax, and a `|` split a second roll off
  entirely — a skill named `Brawling|/r [1d6]` rolled the 1d6. A name is now enclosed in whichever
  quote it does not contain, and anything left over is replaced the same way the Game Aid's own
  sheet replaces it.

### Changed

- **Right-clicking an attack's grip no longer removes it.** Nothing told you it would, and an 11px
  target is too easy to hit by accident. Dragging the row clear of the strip, or `Delete` with the
  grip focused, still remove it.

## [0.3.0] - 2026-09-10

The strip stops guessing which attacks matter and stops disappearing when nothing is selected.

### Added

- **Choose which attacks appear.** A GURPS sheet lists every attack a character could conceivably
  make — every usage mode of every weapon, every innate attack, every unarmed option — which is far
  more than belongs in a strip you read at a glance. Dumping the lot in made the one region allowed
  to scroll the region that always did. The weapon tables now start empty and you say what belongs
  there: drag melee and ranged rows off the character sheet onto the strip, or take the lot with
  **Add every attack** and prune from there.
  - Each row is gripped by the character sheet's own dotted handle. Drag it to reorder the attack
    within its group, or clear off the HUD to remove it; `Alt`+`↑`/`↓` and `Delete` do the same from
    the keyboard.
  - The choice is stored on the actor, not the user, because the curation is about the character: a
    GM who picked a dragon's four useful attacks out of its forty gets them back the next time
    anybody at the table selects the dragon.
  - Attacks only move within their own group, and only the strip's own character's attacks can be
    dropped on it — the sheet stamps its actor id onto every row, so a foreign attack is refused
    rather than mis-resolved.
  - A near miss on the top bar or the macro footer does nothing, rather than counting as a drag off
    the HUD and deleting the attack.
- **The HUD stays up with nothing selected.** Previously it required a selected actor, so it
  vanished between turns and out of combat. (#16)

### Fixed

- **The HUD no longer hides Foundry's sidebar collapse button.** Tailwind's scanner treats any word
  in the source — comments included — as a class candidate, and utilities were being emitted
  unscoped, so two prose comments mentioning "collapse" were enough to ship a global
  `.collapse { visibility: collapse }` that matched Foundry's own sidebar toggle. Every utility now
  carries a `hud:` prefix, which makes the leak structurally impossible: a class can only reach
  Foundry if the source literally says `hud:`. The same scan had also leaked `.table`, `.hidden`,
  `.block` and a dozen more, which happened to lose to Foundry's own rules only by luck.

### Changed

- Macro buttons in the footer are 32px, up from their previous size.

## [0.2.1] - 2026-09-07

### Added

- **Every user-facing string is translatable.** Labels, tooltips and menu entries now come from the
  localization catalogue instead of being written inline, so the HUD can ship in languages other
  than English. (#1)

### Fixed

- **The posture menu is reachable again.** Every popover floated clear of its trigger across a gap
  where the pointer was over neither, which started the dismiss timer — so crossing slowly lost the
  panel. The posture badge's gap spans the character-name trigger, which took the hover and swapped
  the panel out, putting the posture menu out of reach entirely. A transparent bridge now fills the
  gap.
- The macro library closes on `Escape` and on an outside click, like every other panel.
- `Alt`+arrow in the macro bar keeps focus on the macro it moved, so a second press continues in the
  same direction instead of walking whatever just swapped in the other way.
- The macro footer and the number keys agree on which hotbar page is live when the page is changed
  from outside the HUD.
- The skills panel no longer renders a square scrollbar inside its rounded corners.

## [0.2.0] - 2026-09-07

### Added

- **The whole macro hotbar, not just one page.** The footer could only ever reach ten of the
  hotbar's fifty macros: it read whichever page Foundry happened to be on and offered no way to
  change it, so the other forty were unreachable from the HUD. Page arrows now step through the
  pages, and an expandable library shows all five as rows of ten. (#11, #12, #13)
- Macros can be reordered by dragging within a page or across pages. Removal is right-click,
  `Delete`, or dragging a macro clear off the HUD.
- All-Out Attack and All-Out Defense appear in the maneuver menu as their individual variants, so
  the choice the rules ask for is the choice you make.
- Feature documentation with screenshots, and an explicit license.

## [0.1.0] - 2026-09-06

Initial prototype: a persistent bottom-left combat strip for GURPS 4e, reading the GURPS 4e Game Aid
(Unofficial) actor model.

### Added

- **Portrait block** with Move and posture badges. Hovering the posture badge lists the six postures
  the Game Aid tracks and picking one calls the actor's `replacePosture`, so the status effect, token
  icon and move penalty all follow. Double-clicking the portrait opens the character sheet.
- **Vitals.** HP and FP with recognisable icons, plus shock and reeling/exhausted cells. Click either
  value to edit it; `Enter` or blur commits, `Escape` cancels, and a signed entry (`-3`) adjusts
  rather than replaces. Arrow keys step the value. Writes go through `Actor#update`, so the Game
  Aid's reeling/exhausted flags and the token bars follow.
- **Top bar** carrying ATTRS, SKILLS, Dodge and the maneuver pill in one row, all sharing one chrome.
- **Attributes panel** laid out as two sheet-style boxes at text density.
- **Skills panel** listing every skill on the actor, containers included as unrollable rows. The
  whole row is the roll button, and levels roll through the Game Aid as `Sk:"Name"` — the same string
  its sheet emits.
- **Hit-location target.** The Game Aid keeps no aimed-at location of its own; its sheet pushes a
  location's to-hit penalty into the modifier bucket per click. The TARGET control holds the choice
  in the HUD and does that push before every melee or ranged attack roll, leaving damage, parry,
  skill and attribute rolls untouched. The menu is the *target* token's own hit location table, with
  roll range, penalty and DR, and the choice resets to Torso when the strip follows a different
  actor.
- **Weapon tables** at character-sheet density, with the list scrolling under a capped strip height.
- **Macro footer** that accepts drags off the character sheet, not only Macro documents: it runs the
  `hotbarDrop` hook first — which is how the Game Aid turns an On-The-Fly drag into a macro — then
  falls through to Foundry's own Macro, RollTable and sheet-toggle behaviour.
- **Lock and character switcher.** Selecting a token you control switches the HUD to that actor;
  the lock icon pins it. Hovering the character name lists every selectable actor.
- CI on every push and pull request, and a release workflow that stamps the manifest from the tag
  and registers the version with the Foundry package listing.

[0.4.0]: https://github.com/ncphillips/gurps-hud/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/ncphillips/gurps-hud/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/ncphillips/gurps-hud/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/ncphillips/gurps-hud/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/ncphillips/gurps-hud/releases/tag/v0.1.0
