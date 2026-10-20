# Dance Battle Generator

A planned browser app for organising dance battles and printing clean A4 brackets.

## Project status

This repository currently contains the agreed requirements and development roadmap. The application has not been implemented yet.

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
