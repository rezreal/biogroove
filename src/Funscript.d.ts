

export type Timestamp = number
export interface FunscriptAction {
    /**
     * position in percent (0-100)
     */
    "pos": number,
    /**
     * time to be at position in milliseconds
     */
    "at": Timestamp
}
export interface Funscript {
    "version": "1.0",
    "inverted": boolean,
    /**
     * Implementations may override the range value specified in the script.

     Define min (bottom) and max (top) positions for the strokes. Defaults are: min=5 and max=95. The values for min and max must:
     */
    "range": number,
    "actions": readonly FunscriptAction[],
}