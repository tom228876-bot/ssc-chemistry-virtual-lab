/** Gas passing from the reaction flask through the delivery tube into the limewater. */
export const gasLink = { flow: 0, rate: 0 } // flow: mmol this frame, rate: mmol per second

/** Limewater holds this many mmol of Ca(OH)2: it turns milky up to here, then clears with more CO2. */
export const LIME_K = 4
export const limeMilk = (x: number) => (x <= LIME_K ? x / LIME_K : Math.max(0, 1 - (x - LIME_K) / LIME_K))
