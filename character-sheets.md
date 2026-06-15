# Character Sheets & Creation

Reference: `dnd-5e-srd/markdown/01 races.md`, `dnd-5e-srd/markdown/02 classes.md`, `dnd-5e-srd/markdown/03 beyond1st.md`

## Character Creation Workflow

Walk the player through these steps:

### 1. Concept
Ask: "What kind of character do you want to play?"
- Get a rough idea before mechanics
- Help refine vague ideas into D&D archetypes

### 2. Race Selection
Present SRD races with brief summaries:
- **Dwarf** (Hill/Mountain): Hardy, resilient, darkvision
- **Elf** (High/Wood): Graceful, perceptive, trance instead of sleep
- **Halfling** (Lightfoot/Stout): Lucky, brave, nimble
- **Human**: Versatile, bonus to all stats
- **Dragonborn**: Draconic ancestry, breath weapon
- **Gnome** (Forest/Rock): Small, cunning, advantage vs magic
- **Half-Elf**: Charismatic, versatile, two extra skills
- **Half-Orc**: Savage attacks, relentless endurance
- **Tiefling**: Infernal legacy, fire resistance, spells

Record racial traits and ability score bonuses.

### 3. Class Selection
Present SRD classes:
- **Barbarian**: Rage, unarmored defense, reckless attacks
- **Bard**: Spellcasting, inspiration, jack of all trades
- **Cleric**: Divine magic, domain powers, armor proficiency
- **Druid**: Nature magic, wild shape
- **Fighter**: Combat master, action surge, many attacks
- **Monk**: Martial arts, ki powers, unarmored defense
- **Paladin**: Divine smite, lay on hands, oaths
- **Ranger**: Wilderness expert, favored enemy, spells
- **Rogue**: Sneak attack, expertise, cunning action
- **Sorcerer**: Innate magic, metamagic
- **Warlock**: Pact magic, invocations, patron
- **Wizard**: Learned magic, extensive spell list, arcane recovery

### 4. Ability Scores
Offer three methods:

**Standard Array**: 15, 14, 13, 12, 10, 8
- Assign to Str, Dex, Con, Int, Wis, Cha as desired

**Point Buy** (27 points):
| Score | Cost |
|-------|------|
| 8 | 0 |
| 9 | 1 |
| 10 | 2 |
| 11 | 3 |
| 12 | 4 |
| 13 | 5 |
| 14 | 7 |
| 15 | 9 |

**Rolling**: 4d6, drop lowest, six times
- Player rolls and assigns
- Reroll if total modifiers are below +2 or no score above 13

Apply racial bonuses after assignment.

### 5. Background
Choose or create background providing:
- 2 skill proficiencies
- Tool/language proficiencies
- Starting equipment
- Feature (roleplaying benefit)
- Personality traits, ideals, bonds, flaws

SRD Backgrounds: Acolyte

### 6. Equipment
Class provides starting equipment OR gold to purchase.
Record weapons, armor, and adventuring gear.
Calculate AC based on armor + Dex (if applicable).

### 7. Final Details
- **Name**: Character name
- **Alignment**: Suggest based on concept
- **HP**: Max at level 1 (Hit Die + Con modifier)
- **Proficiency Bonus**: +2 at level 1
- **Calculate**: Attack bonuses, save DCs, skill modifiers

## Character Sheet Format

Store characters in `campaigns/[campaign]/characters/[name].md`:

```markdown
# [Character Name]

## Basic Info
- **Race**:
- **Class**: Level
- **Background**:
- **Alignment**:

## Ability Scores
| Stat | Score | Modifier |
|------|-------|----------|
| STR  |       |          |
| DEX  |       |          |
| CON  |       |          |
| INT  |       |          |
| WIS  |       |          |
| CHA  |       |          |

## Combat
- **AC**:
- **HP**: / (max)
- **Hit Dice**:
- **Speed**:
- **Initiative**:
- **Proficiency Bonus**:

## Proficiencies
- **Saving Throws**:
- **Skills**:
- **Weapons**:
- **Armor**:
- **Tools**:
- **Languages**:

## Features & Traits
[List racial and class features]

## Equipment
[List all gear]

## Spellcasting (if applicable)
- **Spellcasting Ability**:
- **Spell Save DC**:
- **Spell Attack Bonus**:
- **Spell Slots**:
- **Spells Known/Prepared**:

## Backstory
[Brief background]

## Notes
[Session notes, relationships, etc.]
```

## Level Up Procedure

When a character levels up:

1. **Announce New Level**: Note class and total level
2. **HP Increase**: Roll hit die (or take average) + Con modifier
3. **Check Proficiency**: Increases at 5th, 9th, 13th, 17th
4. **Class Features**: Add new abilities from class table
5. **Ability Score Improvement**: At 4th, 8th, 12th, 16th, 19th (or feat)
6. **Spellcasting**: New spell slots and spells known/prepared
7. **Update Sheet**: Recalculate all affected values

## Tracking During Play

Maintain current status:
- Current HP vs Maximum HP
- Remaining Hit Dice
- Spell Slots used
- Limited-use abilities (rage, channel divinity, etc.)
- Conditions affecting character
- Temporary HP
- Death saves (if applicable)
