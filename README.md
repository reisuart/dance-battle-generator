# Dance Battle Generator

A planned browser app for organising dance battles and printing clean A4 brackets.

## Project status

A first local version is implemented in `app/`: registration, age calculation, style-specific brackets, two- and three-person battle layouts, drag or click swapping, judges, local saving, event export/import, and A4 printing.

## Run locally

From `app/`, run `npm install` once, then `npm run dev`. Open the exact Local URL printed in the terminal; Vite may choose a different port if another app is running.

Use Registration to add dancers. Separate styles with commas. In Brackets & print, select a style, drag a name onto another slot to swap, and expand Battle structure to move three-person battles or change their count in each round. Winner slots intentionally remain blank for handwriting.

Use Export event to keep a backup; local saving belongs to the current browser and address. To print, choose Print / Save PDF, select A4 landscape, and disable browser headers and footers for a clean page.

Validation: `npm run build` checks TypeScript and creates the production build. `node --experimental-strip-types bracket.test.mjs` checks bracket integrity for 0–256 entrants (Node 24 recommended).

## Current limitations

- Each style prints on one A4 page. Larger brackets shrink; multi-page continuation layouts are not implemented yet.
- No spreadsheet/CSV import yet; event JSON export/import is available.
- Style names are case-sensitive; use consistent spelling.
- Browser interaction and print appearance still need visual verification on the user's computer.

## Core workflow

1. Enter the event name, event year, dancers, and their registered styles.
2. Generate a separate bracket for each style.
3. Choose where any three-person battles appear.
4. Drag dancers from a left-hand participant list into slots; drop one occupied slot onto another to swap dancers.
5. Add judges above the bracket and print A4 pages.

Age means the age the dancer turns in the event year: event year minus birth year.
In a three-person battle, all three compete together and exactly one advances.

See [REQUIREMENTS.md](REQUIREMENTS.md) for the agreed behaviour and [ROADMAP.md](ROADMAP.md) for the implementation sequence.

## Suggested implementation

- React and TypeScript for the interface.
- SVG connections between bracket slots for sharp printing.
- Browser storage for initial local saving, with event file export/import for backups.
- A4 print styles and the browser's Print / Save as PDF dialog.
- No account or server required for the first version.

## Repository notes

Keep all application work inside this repository. The parent project's `sources/` folder is read-only reference material and must not be modified.
