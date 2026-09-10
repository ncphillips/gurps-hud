# Changelog

All notable changes to GURPS HUD are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). A version is shipped by
publishing a GitHub Release tagged `v<MAJOR>.<MINOR>.<PATCH>`; the manifest version is stamped
from that tag.

## [0.3.0] - Unreleased

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

[0.3.0]: https://github.com/ncphillips/gurps-hud/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/ncphillips/gurps-hud/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/ncphillips/gurps-hud/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/ncphillips/gurps-hud/releases/tag/v0.1.0
