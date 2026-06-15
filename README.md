# Claude Dungeon Master

A D&D 5th Edition Dungeon Master system powered by Claude. Run dark, gritty campaigns where choices matter and death is real.

## What This Is

This repository contains instructions and reference materials that turn Claude into a capable Dungeon Master. It includes:

- **CLAUDE.md** - Core DM persona, tone guidelines, and session commands
- **dm-instructions/** - Detailed guidance for combat, character creation, NPCs, items, campaigns, and spellcasting
- **dnd-5e-srd/** - Complete D&D 5e System Reference Document for rules lookup

## Usage

1. Clone this repository
2. Open it with [Claude Code](https://claude.ai/claude-code) or add it as context in your Claude conversation
3. Start a new campaign or load an existing one

### Basic Commands

- `Start new campaign [name]` - Begin a new adventure
- `Load campaign [name]` - Resume an existing campaign
- `Create character` - Walk through character creation
- `Save campaign` / `End session` - Save progress

Your campaign data will be stored in a local `campaigns/` folder (excluded from git).

## Credits

### D&D 5e SRD

The System Reference Document is provided under the Open Gaming License v1.0a.

- **Original Content**: Wizards of the Coast, Inc.
- **SRD 5.0 Authors**: Mike Mearls, Jeremy Crawford, Chris Perkins, Rodney Thompson, Peter Lee, James Wyatt, Robert J. Schwalb, Bruce R. Cordell, Chris Sims, and Steve Townshend
- **Based on original material by**: E. Gary Gygax and Dave Arneson
- **Markdown/JSON Conversion**: [Ben Morton](https://github.com/BTMorton/dnd-5e-srd) (MIT License, 2017)

## License

- DM instructions and CLAUDE.md: MIT License
- D&D 5e SRD content: Open Gaming License v1.0a (see `dnd-5e-srd/LICENSE`)
