# Dance Battle Generator

A planned browser app for organising dance battles and printing clean A4 brackets.

## Project status

A first local version is implemented in `app/`: registration, age calculation, style-specific brackets, two- and three-person battle layouts, drag or click swapping, judges, local saving, event export/import, and A4 printing.

## Run locally

From `app/`, run `npm install` once, then `npm run dev`. Open the exact Local URL printed in the terminal; Vite may choose a different port if another app is running.

Use Styles & divisions to define styles (Hip Hop, Modern, and Contemporary are provided). In Registration, use each dancer's dropdown to select one or more styles. In Brackets & print, select a category, drag a name onto another slot to swap, and use Arrange battles to see round summaries, choose between valid battle formats, and reposition highlighted three-person battles. Winner slots intentionally remain blank for handwriting.

Optionally enable Under / Over for any style and set its age cutoff. Under means strictly below that age; Over includes the cutoff age and above. Categories appear in registration filters and as separate brackets. Missing or invalid birth years are flagged and block printing the affected style until corrected. Other styles can remain undivided. Event year controls ages, but neither event name nor year prints on the bracket; the page contains judges, style/division heading, and larger participant names.

Existing version-1 saved events and event files migrate automatically to the style list. Registrations, saved placements, and judges are retained. Renaming a style keeps its registrations and brackets. Changing the cutoff or registrations flags stored brackets that need rebuilding rather than silently dropping dancers. Keep an exported backup before changing divisions extensively.

The entire paper uses locally bundled Montserrat. Participant labels are larger and uppercase in preview and print; registration spelling is preserved. Long names fit inside their boxes. The Print button waits for the font to load.

The paper uses a fixed 297 × 210 mm A4 canvas with 13 mm internal margins. The preview scales the entire canvas uniformly to fit its panel, so resizing the window cannot reflow the judges, change heading proportions, or resize the bracket separately. Print uses the same canvas and typography, with no additional page margins.

Each judge has an individual input in the bracket sidebar; add or remove inputs as needed. The paper shows `JUDGES` followed by one outlined box per judge, in uppercase Montserrat at a matching 12px size. Existing comma-separated judge names are automatically separated when loading saved events or importing backups.

Use Export event to keep a backup; local saving belongs to the current browser and address. To print, choose Print / Save PDF, select A4 landscape, and disable browser headers and footers for a clean page.

Validation: `npm run build` checks TypeScript and creates the production build. `node --experimental-strip-types bracket.test.mjs` checks bracket integrity for 0–256 entrants; `node --experimental-strip-types event.test.mjs` checks migration, style registration, division boundaries, missing ages, and import validation (Node 24 recommended).

## Sticker sheets

The Stickers page creates portrait A4 sheets with four labels: two columns of 105 mm and two rows of 148.5 mm. Each label uses locally stored Archivo Black and shows the style, optional Under/Over category, a large number, and the preferred nickname or full name. Choose the category, start number, and name preference before printing. These sticker controls apply to the current visit to the page.

Numbers follow registration order and restart within each category. Table sorting and bracket moves do not affect them. Changing registrations can change numbering; print the final registration list. Every category begins a new sheet and unused quarters stay blank. Preview cut guides never print. Missing ages must be resolved before printing affected age divisions.

Print with A4 portrait, 100% / Actual size, no extra margins, and browser headers/footers off. Named print pages keep sticker printing portrait and bracket printing landscape. Check alignment on the actual sticker stock before a full run; physical printing has not been visually verified here.

Run `node --experimental-strip-types stickers.test.mjs` from `app/` to check pagination, numbering, division assignment, and name fallback.

## Current limitations

- Each style prints on one A4 page. Larger brackets shrink; multi-page continuation layouts are not implemented yet.
- No spreadsheet/CSV import yet; event JSON export/import is available.
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
