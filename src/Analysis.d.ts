/** 0..1 */
import {Key} from "react";

type Factor = number

/** unit seconds*/
type Duration = number

/** unit seconds*/
type Offset = number

/** seconds since epoch */
type Timestamp = number

/** beats per minute */
type Tempo = number

/**
 *  The key identifies the tonic triad, the chord, major or minor, which represents the final point of rest of a piece.
 *  The key is a track-level attribute ranging from 0 to 11 and corresponding to one of the 12 keys: C, C#, D, etc. up to B
 *  If no key was detected, the value is -1.
 */
type Key = -1 | 0 | 1 | 2 |3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

/** Loudness is the quality of a sound that is the primary psychological correlate of physical strength (amplitude). */
type Loudness = number

/**
 * The mode is equal to 0 or 1 for “minor” or “major” and may be -1 in case of no
 * result.
 */
type Mode = -1 | 0 | 1


/**
 * A bar (or measure) is a segment of time defined as a given number of beats.
 *  Bar offsets also indicate downbeats, the first beat of the measure.
 */
export interface Bar {
    "start": Offset,
    "duration": Duration,
    "confidence": Factor
}

/**
 *  A beat is the basic time unit of a piece of music;
 *  for example, each tick of a metronome. Beats are typically multiples of tatums.
 */
export interface Beat {
    "start": Offset,
    "duration": Duration,
    "confidence": Factor
}

export interface Meta {
    "analyzer_version": "4.0.0" | string,
    "platform": "Linux" | string,
    "detailed_status": "OK" | string,
    "status_code": number,
    "timestamp": Timestamp,
    "analysis_time": Duration,
    "input_process": string
}

/**
 * Sections are defined by large variations in rhythm or timbre, e.g.
 * chorus, verse, bridge, guitar solo, etc. Each section contains its own descriptions of tempo, key, mode,
 * time_signature, and loudness
 */
export interface Section {
    "start": Offset,
    "duration": Duration,
    "confidence": Factor,
    "loudness": Loudness,
    "tempo": Tempo,
    "tempo_confidence": Factor,
    "key": Key,
    "key_confidence": Factor,
    "mode": Mode,
    "mode_confidence": Factor,
    "time_signature": number,
    "time_signature_confidence": Factor
}

export interface Segment {
    "start": Offset,
    "duration": Duration,
    "confidence": Factor,
    "loudness_start": Loudness,
    "loudness_max_time": Loudness,
    /** peak loudness value within the segment */
    "loudness_max": Loudness,
    "loudness_end": Loudness,


    /**
     * pitch content is given by a “chroma” vector, corresponding to the 12 pitch classes C, C#, D to B, with values ranging
     * from 0 to 1 that describe the relative dominance of every pitch in the chromatic scale. For example a C Major chord
     * would likely be represented by large values of C, E and G (i.e. classes 0, 4, and 7). Vectors are normalized to 1 by their
     * strongest dimension, therefore noisy sounds are likely represented by values that are all close to 1, while pure tones are
     * described by one value at 1 (the pitch) and others near 0.
     */
    "pitches": readonly [Factor, Factor, Factor, Factor, Factor, Factor, Factor, Factor, Factor, Factor, Factor, Factor]


    /**
     * timbre is the quality of a musical note or sound that distinguishes different types of musical instruments, or voices. It is
     a complex notion also referred to as sound color, texture, or tone quality, and is derived from the shape of a segment’s
     spectro-temporal surface, independently of pitch and loudness. The Echo Nest Analyzer’s timbre feature is a vector
     that includes 12 unbounded values roughly centered around 0. Those values are high level abstractions of the spectral
     surface, ordered by degree of importance. For completeness however, the first dimension represents the average
     loudness of the segment; second emphasizes brightness; third is more closely correlated to the flatness of a sound;
     fourth to sounds with a stronger attack; etc. See an image below representing the 12 basis functions (i.e. template
     segments). The actual timbre of the segment is best described as a linear combination of these 12 basis functions
     weighted by the coefficient values: timbre = c1 x b1 + c2 x b2 + ... + c12 x b12, where c1 to c12 represent the 12
     coefficients and b1 to b12 the 12 basis functions as displayed below. Timbre vectors are best used in comparison with
     each other
     */
    "timbre": readonly [number,number,number,number,number,number,number,number,number,number,number,number]
}


/**
 * Tatums represent the lowest regular pulse train that a listener
 * intuitively infers from the timing of perceived musical events (segments).
 */
export interface Tatum {
    "start": Offset,
    "duration": Duration,
    "confidence": Factor
}

export interface AudioAnalysis {

    /**
     *  list of bar markers, in seconds.
     */
    bars: readonly Bar[]

    /**
     *  list of beat markers, in seconds.
     */
    beats: readonly Beat[]

    meta: Meta

    /**
     * A set of section markers, in seconds.
     */
    sections: readonly Section[];

    /**
     *  a set of sound entities (typically under a second) each relatively uniform in timbre and harmony.
     *  Segments are characterized by their perceptual onsets and duration in seconds, loudness (dB), pitch and timbral
     *  content.
     */
    segments: readonly Segment[]

    /**
     * list of tatum markers, in seconds.
     */
    tatums: readonly Tatum[]


    track: {
        "duration": Duration,
        "sample_md5": string,
        "offset_seconds": Offset,
        "window_seconds": Offset,
        "analysis_sample_rate": number,
        "analysis_channels": number,

        /** the end of the fade-in introduction to a track in seconds. */
        "end_of_fade_in": Offset,
        "start_of_fade_out": Offset,
        /**
         * the overall loudness of a track in decibels (dB). Loudness values in the Analyzer are averaged across an
         * entire track and are useful for comparing relative loudness of segments and tracks.
         * Loudness is the quality of a sound that is the primary psychological correlate of physical strength (amplitude).
         */
        "loudness": Loudness,
        /**
         * the overall estimated tempo of a track in beats per minute (BPM). In musical terminology,
         * tempo is the speed or pace of a given piece and derives directly from the average beat duration
         */
        "tempo": Tempo,
        "tempo_confidence": Factor,
        /**
         * an estimated overall time signature of a track. The time signature (meter) is a notational
         * convention to specify how many beats are in each bar (or measure)
         */
        "time_signature": number,
        "time_signature_confidence": Factor,
        /**
         * the estimated overall key of a track
         */
        "key": Key,
        "key_confidence": Factor,
        /**
         * indicates the modality (major or minor) of a track, the type of scale from which its melodic content
         * is derived.
         */
        "mode": Mode,
        "mode_confidence": Factor,
        "codestring": string,
        "code_version": number,
        "echoprintstring": string,
        "echoprint_version": number,
        "synchstring": string,
        "synch_version": number,
        "rhythmstring": string,
        "rhythm_version": number
    }

}


interface StructuredAudioAnalysis extends AudioAnalysis {
    sections: readonly (Section & { bars: readonly (Bar & { beats: readonly Beat[] }) [] }) [];
}