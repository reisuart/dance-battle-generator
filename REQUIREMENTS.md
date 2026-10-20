# Requirements

## Confirmed requirements

### Registration

- Store each dancer's name, nickname, birth year, and one or more registered styles.
- Calculate age as event year minus birth year; exact birth dates are unnecessary.
- A dancer registered for multiple styles appears in each corresponding style's participant list.

### Bracket editor

- Show a participant list on the left for the selected style/page.
- Show printable A4 pages alongside the list.
- Drag dancers into bracket slots and freely swap assigned dancers.
- Derive bracket structure from registration count instead of requiring a fixed power-of-two size.
- Support two-person and three-person battles, each producing one advancing dancer.
- In three-person battles, all three dance at the same time.
- Let the organiser choose the location of three-person battles.
- Connect every battle to a winner slot, with later rounds continuing to one champion.

### Printed pages

- Generate separate brackets for each style.
- Allow judges' names above the bracket.
- Use the supplied visual reference as layout inspiration: readable name boxes, connecting lines, style heading, judges, and empty winner boxes.
- Print at actual A4 dimensions without editor controls or participant sidebar.
- Allow multiple pages when a bracket cannot remain legible on one page.

## Proposed first-version choices

These are implementation defaults, not additional confirmed user requirements:

- Landscape A4 with a clean monochrome print layout.
- Editable event year, initially the current year.
- Optional automatic placement and shuffle, followed by manual adjustments.
- Local autosave plus event file export/import.
- Select full name, nickname, or both for bracket labels.
- Warn before regenerating a bracket that already contains manual placements.
- Allow a layout preview before printing all style pages.

## Bracket integrity

- Every registered dancer must appear exactly once in the opening round of their style.
- Each battle has two or three inputs and one output.
- For a round with n entrants, choose nonnegative counts a and b satisfying 2a + 3b = n. The next round has a + b winners.
- Expose valid arrangements to the organiser rather than silently deciding where groups of three go.
- Apply the same rules to later rounds, ending when one winner remains.
- With nine entrants, one valid opening round has three two-person battles and one three-person battle; its four winners form two semifinals.
- Zero entrants should show an empty state; one entrant should require no battle.
- Keep bracket assignments separate per style, so editing one style does not alter another.
- Changing registration or battle structure must never silently drop or duplicate dancers.

## Decisions to refine during implementation

- How much control to offer over the number of three-person battles, in addition to their locations.
- How to split larger brackets across pages while clearly labelling continuation slots.
- Whether judging/winner entry in the app is useful beyond printing blank advancement slots.
