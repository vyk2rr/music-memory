import React, { useEffect, useImperativeHandle, forwardRef } from "react";
import { generateNotes, getAlternativeNotation, getBlackKeyLeft, getBlackKeyWidth } from "./PianoBase.utils";
import type { tChord, tOctaveRange, tNoteWithOctave, tSequenceToPlayProps, iChordEvent, tMelodySequence } from "./PianoBase.types";
import type { PianoObserver } from "../PianoObserver/PianoObserver";
import useHighlight from "./../hooks/useHighlights/useHighlights";
import useToneJs from "../hooks/useToneJs/useToneJs";
import type { SupportedSynthType } from "../hooks/useToneJs/useToneJs";
import './PianoBase.css';

export interface PianoBaseProps {
  octave?: tOctaveRange;
  octaves?: tOctaveRange;
  highlightOnThePiano?: tChord;
  sequenceToPlay?: tSequenceToPlayProps;
  pianoObservable?: PianoObserver;
  className?: string;
  renderUI?: (params: any) => React.ReactNode;
  createSynth?: () => SupportedSynthType;
}

export type PianoBaseHandle = {
  handleMelodyEvent: (event: iChordEvent) => void;
  scheduleMelody: (
    sequence: tMelodySequence,
    onEventCallback: (event: iChordEvent) => void,
    onComplete?: () => void
  ) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  isReady: boolean;
  startTone: () => Promise<void>;
  playArpeggio: (chord: tChord, duration?: string, interval?: string, velocity?: number) => Promise<void>;
  playChord: (chord: tChord, duration?: string, time?: string, velocity?: number) => Promise<void>;
};

const PianoBase = forwardRef<PianoBaseHandle, PianoBaseProps>(({
  octave = 4,
  octaves = 3,
  highlightOnThePiano,
  pianoObservable,
  className,
  renderUI,
  createSynth,
}, ref) => {
  const { white, black } = generateNotes(octaves, octave);

  const {
    highlightNoteInGroup,
    highlightClickedNote,
    clearGroupHighlights,
    isNoteClicked,
    isNoteInGroup,
  } = useHighlight();


  // Aquí vive la instancia única de useToneJs
  const {
    isReady,
    start: startTone,
    play,
    pause,
    stop,
    scheduleMelody,
    playNote,
    durationToMs,
    playArpeggio,
    playChord,
  } = useToneJs({ bpm: 200, createSynth });

  useEffect(() => {
    // Limpia el grupo 0 antes de resaltar el nuevo acorde
    clearGroupHighlights(0);
    if (highlightOnThePiano) {
      (Array.isArray(highlightOnThePiano) ? highlightOnThePiano : [highlightOnThePiano])
        .forEach(note => {
          playNote(note, "4n", undefined, 0.7);
          highlightNoteInGroup(note, Infinity, 0)
        });
    }
  }, [highlightOnThePiano, highlightNoteInGroup, clearGroupHighlights]);


  const handleMelodyEvent = (event: iChordEvent) => {
    const { pitches, duration, highlightGroup } = event;
    if (!pitches || pitches.length === 0 || !durationToMs) return;

    console.log('Resaltando acorde:', pitches, 'con duración:', duration);

    // El sonido no se reproduce aquí, solo se gestiona la UI.

    // Notifica el observable
    pianoObservable?.notify({ type: "chordPlayed", chord: pitches });

    // Calcula la duración visual y resalta todas las notas del acorde
    if (highlightGroup !== undefined) {
      const visualDurationMs = durationToMs(duration) + 80;
      pitches.forEach(note => {
        highlightNoteInGroup(note, visualDurationMs, highlightGroup - 1);
      });
    }
  };

  const handlePianoKeyClick = (note: tNoteWithOctave) => {
    // 1. resalta la tecla
    highlightClickedNote(note, 180);

    // 2. Reproduce la tecla usando la función del padre
    playNote(note);

    // 3. Notifica el observable
    pianoObservable?.notify({ type: "notePlayed", note });
  };

  useImperativeHandle(ref, () => ({
    handleMelodyEvent,
    scheduleMelody,
    play,
    pause,
    stop,
    isReady,
    startTone,
    playArpeggio,
    playChord
  }));

  return (
    <div className={`piano-base ${className || ''}`} data-testid="piano-base">
      {renderUI ? renderUI({
        white,
        black,
        octaves,
        octave,
        handlePianoKeyClick,
        isNoteActive: (note: tNoteWithOctave) => ({
          clicked: isNoteClicked(note),
          group1: isNoteInGroup(note, 0),
          group2: isNoteInGroup(note, 1)
        }),
        getBlackKeyLeft: (note: tNoteWithOctave, whiteKeys: tChord) => getBlackKeyLeft(note, whiteKeys),
        getBlackKeyWidth: (octaves: tOctaveRange) => getBlackKeyWidth(octaves),
        getAlternativeNotation,
      }) : (
        // UI por defecto
        <div className="piano">
          <div className="white-keys">
            {white.map(note => {
              const clicked = isNoteClicked(note);
              const group1 = isNoteInGroup(note, 0);
              const group2 = isNoteInGroup(note, 1);
              return (
                <div
                  key={note}
                  className={`
                    white-key
                    ${(clicked) ? "active-key" : ""}
                    ${group1 ? "highlight-group-1" : ""}
                    ${group2 ? "highlight-group-2" : ""}
                  `}
                  data-note={note}
                  onClick={() => handlePianoKeyClick(note)}
                >
                  {(group1 || group2 || note.startsWith('C')) && <span className="note-name">{note}</span>}
                </div>
              );
            })}
          </div>
          <div className="black-keys">
            {black.map(noteString => {
              const clicked = isNoteClicked(noteString);
              const group1 = isNoteInGroup(noteString, 0);
              const group2 = isNoteInGroup(noteString, 1);
              return (
                <div
                  key={noteString}
                  className={`
                    black-key
                    ${clicked ? "active-key" : ""}
                    ${group1 ? "highlight-group-1" : ""}
                    ${group2 ? "highlight-group-2" : ""}
                  `}
                  style={{
                    pointerEvents: "all",
                    left: getBlackKeyLeft(noteString, white),
                    width: getBlackKeyWidth(octaves)
                  }}
                  data-note={noteString}
                  onClick={() => handlePianoKeyClick(noteString)}
                >
                  {(group1 || group2) && (
                    <span className="note-name">
                      <span className="flat-notation">{getAlternativeNotation(noteString)}</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

export default PianoBase;