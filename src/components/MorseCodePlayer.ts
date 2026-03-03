// Morse Code Player - Based on morsenode.com implementation
// Uses Web Audio API for authentic telegraph sound

class Sounder {
  private context: AudioContext;
  private oscillator: OscillatorNode;
  private gainNode: GainNode;
  private rampTime = 0.003;

  constructor() {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.context = new AudioContextClass();
    this.oscillator = this.context.createOscillator();
    this.gainNode = this.context.createGain();

    this.gainNode.gain.setValueAtTime(0, this.context.currentTime);
    this.oscillator.frequency.setValueAtTime(600, this.context.currentTime);
    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.context.destination);
    this.oscillator.start(0);
  }

  setFrequency(freq: number): void {
    this.oscillator.frequency.setValueAtTime(freq, this.context.currentTime);
  }

  getTime(): number {
    return this.context.currentTime;
  }

  beginTone(atTime?: number, frequency?: number): void {
    if (frequency) {
      this.oscillator.frequency.setValueAtTime(frequency, 0);
    }
    this.gainNode.gain.setTargetAtTime(1.0, atTime || this.context.currentTime, this.rampTime);
  }

  endTone(atTime?: number): void {
    this.gainNode.gain.setTargetAtTime(0.0, atTime || this.context.currentTime, this.rampTime);
  }

  playTone(start: number, length: number, frequency?: number): number {
    const end = start + length;
    this.beginTone(start, frequency);
    this.endTone(end);
    return end;
  }
}

class Keyer {
  wpm: number;
  dot: number;
  dash: number;
  wordBoundary: number;
  ta: number;
  tc: number;
  tw: number;

  constructor(wpm: number, effectiveWpm?: number, farnsworth?: boolean) {
    this.wpm = wpm;
    this.dot = 0;
    this.dash = 0;
    this.ta = 0;
    this.tc = 0;
    this.tw = 0;
    this.wordBoundary = 0;
    this.setRate(wpm, effectiveWpm || wpm, farnsworth || false);
  }

  setRate(wpm: number, effectiveWpm: number, farnsworth: boolean): void {
    this.wpm = wpm;
    this.dot = 1.2 / this.wpm;
    this.dash = this.dot * 3.0;
    this.wordBoundary = this.dot * 7.0;

    if (farnsworth && wpm > effectiveWpm) {
      this.ta = this.getTaSeconds(wpm, effectiveWpm);
      this.tc = this.getTcSeconds(this.ta);
      this.tw = this.getTwSeconds(this.ta);
    } else {
      this.ta = 0;
      this.tc = 0;
      this.tw = 0;
    }
  }

  private getTaSeconds(wpm: number, effectiveWpm: number): number {
    return (60.0 * wpm - 37.2 * effectiveWpm) / (wpm * effectiveWpm);
  }

  private getTcSeconds(ta: number): number {
    return (3.0 * ta) / 19.0;
  }

  private getTwSeconds(ta: number): number {
    return (7.0 * ta) / 19.0;
  }

  getDot(): number {
    return this.dot;
  }

  getDash(): number {
    return this.dash;
  }

  getWordSpace(): number {
    return this.wordBoundary;
  }

  getSequence(str: string): KeyEvent[] {
    return str.split('').map(char => {
      if (char === " ") {
        return new KeyEvent(this.getWordSpace() + this.tw, false);
      }
      return new KeyEvent(char === "." ? this.getDot() : this.getDash(), true);
    });
  }
}

class KeyEvent {
  length: number;
  isOn: boolean;

  constructor(length: number, isOn: boolean) {
    this.length = length;
    this.isOn = isOn;
  }
}

class Encoder {
  private mapping: Record<string, string> = {
    "A": ".-",
    "B": "-...",
    "C": "-.-.",
    "D": "-..",
    "E": ".",
    "F": "..-.",
    "G": "--.",
    "H": "....",
    "I": "..",
    "J": ".---",
    "K": "-.-",
    "L": ".-..",
    "M": "--",
    "N": "-.",
    "O": "---",
    "P": ".--.",
    "Q": "--.-",
    "R": ".-.",
    "S": "...",
    "T": "-",
    "U": "..-",
    "V": "...-",
    "W": ".--",
    "X": "-..-",
    "Y": "-.--",
    "Z": "--..",
    "1": ".----",
    "2": "..---",
    "3": "...--",
    "4": "....-",
    "5": ".....",
    "6": "-....",
    "7": "--...",
    "8": "---..",
    "9": "----.",
    "0": "-----",
    "-": "-...-",
    " ": " ",
  };

  encode(word: string): string {
    if (word.indexOf("<") !== -1) {
      return word.toUpperCase() in this.mapping ? this.mapping[word.toUpperCase()] : "";
    }
    return word.split("").map(x =>
      x.toUpperCase() in this.mapping ? this.mapping[x.toUpperCase()] : ""
    ).join(" ");
  }
}

export interface QueueItem {
  word: string;
  frequency: number;
}

export class MorseCodePlayer {
  private keyer: Keyer;
  private encoder: Encoder;
  private sounder: Sounder;
  private queue: QueueItem[];
  private nextTime: number;
  private lookahead = 0.05;
  private running = false;
  private interval: ReturnType<typeof setInterval> | null = null;
  private freq = 600;
  private onPlayed?: (item: QueueItem, endTime: number) => void;
  private onDone?: () => void;

  constructor(wpm = 30, effectiveWpm?: number, farnsworth = false) {
    this.keyer = new Keyer(wpm, effectiveWpm, farnsworth);
    this.encoder = new Encoder();
    this.sounder = new Sounder();
    this.queue = [];
    this.nextTime = 0;
  }

  getTime(): number {
    return this.sounder.getTime();
  }

  setWpm(wpm: number, effectiveWpm?: number, farnsworth?: boolean): void {
    this.keyer = new Keyer(wpm, effectiveWpm || wpm, farnsworth || false);
  }

  setFrequency(freq: number): void {
    this.freq = freq;
  }

  stop(): void {
    this.running = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private run(): void {
    const currentTime = this.sounder.getTime();
    while (this.queue.length && (!this.nextTime || this.nextTime <= currentTime + this.lookahead)) {
      const times = this.playNow(this.queue[0], this.nextTime);
      this.nextTime = times[1];
      if (this.onPlayed) {
        this.onPlayed(this.queue[0], times[1]);
      }
      this.queue.shift();
    }
    if (!this.queue.length && this.sounder.getTime() > this.nextTime) {
      this.stop();
      if (this.onDone) {
        this.onDone();
      }
    }
  }

  start(onPlayed?: (item: QueueItem, endTime: number) => void, onDone?: () => void): void {
    this.sounder.setFrequency(600);
    this.running = true;
    this.onPlayed = onPlayed;
    this.onDone = onDone;
    this.nextTime = this.sounder.getTime();
    this.run();
    this.interval = setInterval(() => this.run(), 10);
  }

  queueSentence(str: string): void {
    str.split(' ').forEach(word => {
      this.queueWord(word);
    });
  }

  queueWord(str: string, frequency?: number): void {
    const f = frequency || this.freq;
    str.split('').forEach(char => {
      this.queue.push({
        word: char,
        frequency: f
      });
    });
    this.queue.push({
      word: ' ',
      frequency: f
    });
  }

  queueLetter(str: string, frequency?: number): void {
    this.queue.push({
      word: str,
      frequency: frequency || this.freq
    });
  }

  clearQueue(): void {
    this.queue = [];
  }

  isRunning(): boolean {
    return this.running;
  }

  private playNow(item: QueueItem, time: number): [number, number] {
    const encodedWord = this.encoder.encode(item.word);
    const sequence = this.keyer.getSequence(encodedWord);
    let next = time;

    if (!sequence || !sequence.length) {
      return [next, next];
    }

    for (let i = 0; i < sequence.length; i++) {
      if (sequence[i].isOn) {
        next = this.sounder.playTone(next, sequence[i].length, item.frequency);
      }
      next += this.keyer.getDot();
    }

    const doneAt = next - this.keyer.getDot();
    return [doneAt, next + this.keyer.getDot() * 2 + this.keyer.tc];
  }
}

export default MorseCodePlayer;
