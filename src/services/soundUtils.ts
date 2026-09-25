/**
 * Plays a pleasant supermarket barcode scanner beep using Web Audio API.
 * Does not require external audio files and works fully offline.
 */
export function playBarcodeBeep(): void {
  try {
    const AudioContextClass =
      window.AudioContext ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitAudioContext;

    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // 1760 Hz (A6 note) - classic retail scanner tone
    osc.frequency.setValueAtTime(1760, ctx.currentTime);

    // Smooth envelope to avoid clicks
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.09);

    // Clean up audio context
    setTimeout(() => {
      try {
        ctx.close();
      } catch {
        // Ignore
      }
    }, 200);
  } catch (e) {
    console.warn('Could not play scan sound:', e);
  }
}
