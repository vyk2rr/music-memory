import * as Tone from "tone";
import { CHORD_INTERVALS, CHORD_QUALITIES as ALL_CHORD_QUALITIES_ARRAY } from "../../PianoBase/PianoBase.types";
import type {
  tChord, tNoteWithOctave, tChordQualities,
  tChordWithName, tOctaveRange, tNoteName
} from "../../PianoBase/PianoBase.types";

// --- Color Configuration ---
const NOTE_NAME_TO_HUE: Partial<Record<tNoteName, number>> = {
  'C':  0,   // Red
  'C#': 15,  // Red-Orange
  'Db': 15,  // Red-Orange
  'D':  30,  // Orange
  'D#': 45,  // Orange-Yellow
  'Eb': 45,  // Orange-Yellow
  'E':  60,  // Yellow
  'Fb': 55,  // Yellow (slightly towards orange for Fb)
  'F':  120, // Green
  'F#': 150, // Green-Cyan (was 150)
  'Gb': 150, // Green-Cyan (was 150)
  'G':  210, // Sky Blue (was 240)
  'G#': 225, // Sky Blue - Indigo transition (was 255)
  'Ab': 225, // Sky Blue - Indigo transition (was 255)
  'A':  260, // Indigo (was 270)
  'A#': 270, // Indigo-Violet (was 285)
  'Bb': 270, // Indigo-Violet (was 285)
  'B':  280, // Violet/Purplish (was 300)
  'Cb': 275, // Violet (slightly towards indigo for Cb)
  'B#': 5,   // Red (like C, was 5)
};
const DEFAULT_HUE = 0; // Default to Red if note not found

interface ColorAdjustmentConfig {
  lightnessAdjustment: number;
  saturationAdjustment: number;
  inherentNoteCount: number;
}

const CHORD_QUALITY_COLOR_ADJUSTMENTS: Record<tChordQualities, ColorAdjustmentConfig> = {
  maj:    { lightnessAdjustment: 0,   saturationAdjustment: 0,    inherentNoteCount: 3 },
  min:    { lightnessAdjustment: -15, saturationAdjustment: -10,  inherentNoteCount: 3 },
  dim:    { lightnessAdjustment: -25, saturationAdjustment: -20,  inherentNoteCount: 3 },
  aug:    { lightnessAdjustment: +5,  saturationAdjustment: +15,  inherentNoteCount: 3 },
  sus2:   { lightnessAdjustment: -10, saturationAdjustment: -5,   inherentNoteCount: 3 },
  sus4:   { lightnessAdjustment: 0,   saturationAdjustment: +5,   inherentNoteCount: 3 },
  maj7:   { lightnessAdjustment: 0,   saturationAdjustment: +2,   inherentNoteCount: 4 },
  m7:     { lightnessAdjustment: -15, saturationAdjustment: -8,   inherentNoteCount: 4 },
  dom7:   { lightnessAdjustment: -5,  saturationAdjustment: +5,   inherentNoteCount: 4 },
  maj9:   { lightnessAdjustment: 0,   saturationAdjustment: +4,   inherentNoteCount: 5 },
  m9:     { lightnessAdjustment: -15, saturationAdjustment: -6,   inherentNoteCount: 5 },
  dom9:   { lightnessAdjustment: -5,  saturationAdjustment: +7,   inherentNoteCount: 5 },
  maj11:  { lightnessAdjustment: 0,   saturationAdjustment: +6,   inherentNoteCount: 6 },
  m11:    { lightnessAdjustment: -15, saturationAdjustment: -4,   inherentNoteCount: 6 },
  dom11:  { lightnessAdjustment: -5,  saturationAdjustment: +9,   inherentNoteCount: 6 },
  maj13:  { lightnessAdjustment: 0,   saturationAdjustment: +8,   inherentNoteCount: 7 },
  m13:    { lightnessAdjustment: -15, saturationAdjustment: -2,   inherentNoteCount: 7 },
  dom13:  { lightnessAdjustment: -5,  saturationAdjustment: +11,  inherentNoteCount: 7 },
};
const DEFAULT_COLOR_ADJUSTMENT_CONFIG: ColorAdjustmentConfig = { lightnessAdjustment: 0, saturationAdjustment: 0, inherentNoteCount: 3 };

const BASE_LIGHTNESS = 50;
const BASE_SATURATION = 70;
const LIGHTNESS_BONUS_PER_EXTRA_NOTE = 7;
const MAX_LIGHTNESS = 90;
const MIN_LIGHTNESS = 15;
const MAX_SATURATION = 95;
const MIN_SATURATION = 20;


function calculateChordNotes(note: tNoteWithOctave, type: tChordQualities): tChord {
  const rootFrequency = Tone.Frequency(note);
  return CHORD_INTERVALS[type].map(i => rootFrequency.transpose(i).toNote() as tNoteWithOctave);
}

function invertChord(notes: tChord, inversion: number): tChord {
  const result: tChord = [...notes];
  for (let i = 0; i < inversion; i++) {
    const note = result.shift();
    if (note) {
      const octaveUp: tNoteWithOctave = Tone.Frequency(note).transpose(12).toNote() as tNoteWithOctave;
      result.push(octaveUp);
    }
  }
  return result;
}

export function simplifyNoteName(note: tNoteWithOctave): tNoteName { // Return tNoteName
  return note.replace(/\d+$/, '') as tNoteName;
}

export function getChordColor(
  baseNote: tNoteName,
  quality: tChordQualities,
  chordNotesForGradient?: tNoteWithOctave[]
): string {
  const rootHue = NOTE_NAME_TO_HUE[baseNote] ?? DEFAULT_HUE;
  const qualityConfig = CHORD_QUALITY_COLOR_ADJUSTMENTS[quality] || DEFAULT_COLOR_ADJUSTMENT_CONFIG;

  let overallChordLightness = BASE_LIGHTNESS + qualityConfig.lightnessAdjustment;
  let overallChordSaturation = BASE_SATURATION + qualityConfig.saturationAdjustment;

  const numNotes = chordNotesForGradient
    ? chordNotesForGradient.length
    : qualityConfig.inherentNoteCount;

  if (numNotes > 3) { // Assuming 3 is the baseline (triads)
    overallChordLightness += (numNotes - 3) * LIGHTNESS_BONUS_PER_EXTRA_NOTE;
  }

  overallChordLightness = Math.max(MIN_LIGHTNESS, Math.min(MAX_LIGHTNESS, overallChordLightness));
  overallChordSaturation = Math.max(MIN_SATURATION, Math.min(MAX_SATURATION, overallChordSaturation));

  if (chordNotesForGradient && chordNotesForGradient.length > 0) {
    const gradientColorsHsl: string[] = chordNotesForGradient.map(noteWithOctave => {
      const noteNameForBand = simplifyNoteName(noteWithOctave);
      const bandHue = NOTE_NAME_TO_HUE[noteNameForBand] ?? DEFAULT_HUE;
      return `hsl(${bandHue.toFixed(0)}, ${overallChordSaturation.toFixed(0)}%, ${overallChordLightness.toFixed(0)}%)`;
    });

    if (gradientColorsHsl.length === 1) {
      return gradientColorsHsl[0];
    }

    // Using a simple gradient structure for multiple notes
    // Example: "linear-gradient(to right, color1, color2, color3)"
    // For more distinct bands like before:
    let gradientString = "";
    const numColors = gradientColorsHsl.length;
    const bandWidthPercentage = 100 / numColors;

    gradientColorsHsl.forEach((color, index) => {
        const startPercentage = index * bandWidthPercentage;
        const endPercentage = (index + 1) * bandWidthPercentage;
        if (index > 0) gradientString += ", ";
        // Make each band distinct
        gradientString += `${color} ${startPercentage.toFixed(2)}%, ${color} ${endPercentage.toFixed(2)}%`;
    });
    return `linear-gradient(to right, ${gradientString})`;

  }

  // Solid color
  return `hsl(${rootHue.toFixed(0)}, ${overallChordSaturation.toFixed(0)}%, ${overallChordLightness.toFixed(0)}%)`;
}

export function buildBaseChord(note: tNoteWithOctave, type: tChordQualities): tChordWithName {
  const rootFrequency = calculateChordNotes(note, type);
  const baseNoteNameValue: tNoteName = simplifyNoteName(note);
  const simplifiedNotesDisplay: tNoteName[] = rootFrequency.map(simplifyNoteName);

  return {
    id: `${note}_${type}`,
    quality: type,
    rootNote: baseNoteNameValue,
    name: `${baseNoteNameValue}${type}`,
    displayNotes: simplifiedNotesDisplay.join(" "),
    chord: rootFrequency
  };
}

export function buildChordInversions(baseChord: ReturnType<typeof buildBaseChord>, inversions: number) {
  const result = [];
  const chord: tChord = baseChord.chord;

  for (let i = 1; i <= inversions; i++) {
    const inverted = invertChord(chord, i);
    const simplifiedInvertedDisplay = inverted.map(simplifyNoteName);
    result.push({
      id: `${baseChord.id}_inv${i}`,
      rootNote: baseChord.rootNote,
      quality: baseChord.quality,
      name: `${baseChord.name} (${i}ª)`,
      displayNotes: simplifiedInvertedDisplay.join(" "),
      chord: inverted
    });
  }
  return result;
}

export const generateChordsForNote = (note: tNoteName, selectedOctave: tOctaveRange): tChordWithName[] => {
  const noteWithOctave: tNoteWithOctave = note + selectedOctave as tNoteWithOctave;
  const allChords: tChordWithName[] = [];

  ALL_CHORD_QUALITIES_ARRAY.forEach(quality => {
    const base = buildBaseChord(noteWithOctave, quality);
    allChords.push(base);
    
    const qualityConfig = CHORD_QUALITY_COLOR_ADJUSTMENTS[quality] || DEFAULT_COLOR_ADJUSTMENT_CONFIG;
    const noteCount = qualityConfig.inherentNoteCount;
    let numInversions = 0;
    if (noteCount >=3) numInversions = noteCount -1; // Max inversions is n-1

    if (numInversions > 0) {
        allChords.push(...buildChordInversions(base, Math.min(numInversions, 3))); // Cap practical inversions at 3
    }
  });

  return allChords;
};
