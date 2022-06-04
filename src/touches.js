import { Curve3 } from './curve3';
import { LineBasicMaterial, Line, BufferGeometry, BufferAttribute } from 'three';
import { useTouchLines } from './Rings';

const noteLookup = {};
const names = [ "C", "D", "E", "F", "G", "A", "B" ]
const A4 = 440;
const computeFrequency = (frequency, halfSteps) => {
  return frequency*(2**(halfSteps/12))
};
const notes = [ computeFrequency(A4, -9),
                computeFrequency(A4, -7),
                computeFrequency(A4, -5),
                computeFrequency(A4, -4),
                computeFrequency(A4, -2),
                A4,
                computeFrequency(A4, 2) ]

for(let octave = 0; octave <= 9; octave++) {
  for(let i = 0; i < names.length; i++) {
    const n = names[i] + octave;
    const ns = names[i] + "s" + octave;
    const nb = names[i] + "b" + octave;

    noteLookup[n] = computeFrequency(notes[i], (octave-4)*12);
    noteLookup[ns] = computeFrequency(noteLookup[n], 1);
    noteLookup[nb] = computeFrequency(noteLookup[n], -1);
  }
}

const majorChord = (frequency) => {
  return [ frequency, computeFrequency(frequency, 4),
                      computeFrequency(frequency, 7),
                      computeFrequency(frequency, 12),
                      computeFrequency(frequency, 16),
                      computeFrequency(frequency, 19),
                      computeFrequency(frequency, 24) ];
};

const minorChord = (frequency) => {
  return [ frequency, computeFrequency(frequency, 3),
                      computeFrequency(frequency, 7),
                      computeFrequency(frequency, 12),
                      computeFrequency(frequency, 15),
                      computeFrequency(frequency, 19),
                      computeFrequency(frequency, 24) ];
};

const diminishedChord = (frequency) => {
  return [ frequency, computeFrequency(frequency, 3),
                      computeFrequency(frequency, 6),
                      computeFrequency(frequency, 12),
                      computeFrequency(frequency, 15),
                      computeFrequency(frequency, 18),
                      computeFrequency(frequency, 24) ];
};

// Circle of fifths progression
const progression = [
  majorChord(noteLookup["C3"]),
  majorChord(noteLookup["F3"]),
  diminishedChord(noteLookup["B3"]),
  minorChord(noteLookup["E3"]),
  minorChord(noteLookup["A3"]),
  minorChord(noteLookup["D3"]),
  majorChord(noteLookup["G3"]),
];

const calcVolume = (dist) => {
  return Math.min(1, 50000/(dist*dist));
};

const MAX_PLAYERS = 11;
const audio = {
  chordIndex: 0,
  context: null,
  players: [],
  lastPlayer: -1,
  lastChange: performance.now()
};

const progressChord = () => { 
  const now = performance.now();
  if(now - audio.lastChange > 10000) {
    audio.chordIndex = (audio.chordIndex + 1) % progression.length;
    audio.lastChange = now;
  }
}

const initAudio = () => {
  audio.context = new AudioContext({ latencyHint: 'interactive', sampleRate: audio.sampleRate });

  for(let i = 0; i < MAX_PLAYERS; i++) {
    const oscillator = audio.context.createOscillator();
    const volume = audio.context.createGain();
    const playerGain = audio.context.createGain();

    oscillator.connect(playerGain);
    playerGain.connect(volume);
    volume.connect(audio.context.destination);

    playerGain.gain.value = 1./MAX_PLAYERS * .99;

    volume.gain.value = 0.000001;

    oscillator.type = 'sine';
    oscillator.frequency.value = 440;

    oscillator.start();

    audio.players.push({
      volume,
      oscillator,
      noteIndex: 1
    });
  }
};

const createTouch = (e) => {
  progressChord();
  const now = performance.now();
  const curve = new Curve3();
  curve.addPoint([ e.clientX, e.clientY, 0 ]);

  audio.lastPlayer = (audio.lastPlayer+1)%audio.players.length;
  const player = audio.players[audio.lastPlayer];

  const notes = [ 130.81, 164.81, 196, 261.63, 329.63, 392, 523.25 ] ;

  const randomNote = notes[Math.floor(Math.random()*notes.length)];

  const receiverX = window.innerWidth*.5;
  const receiverY = window.innerHeight*.5;

  const rdx = e.clientX-receiverX;
  const rdy = e.clientY-receiverY;
  const rmag = Math.sqrt(rdx*rdx+rdy*rdy);

  const volume = calcVolume(rmag);

  player.volume.gain.cancelScheduledValues(audio.context.currentTime)
  player.volume.gain.setValueAtTime(player.volume.gain.value, audio.context.currentTime);
  player.volume.gain.exponentialRampToValueAtTime(volume, audio.context.currentTime+.01);

  player.noteIndex = Math.floor(Math.random()*progression[0].length);
  player.oscillator.frequency.cancelScheduledValues(audio.context.currentTime)
  player.oscillator.frequency.setValueAtTime(player.oscillator.frequency.value, audio.context.currentTime);
  player.oscillator.frequency.exponentialRampToValueAtTime(randomNote, audio.context.currentTime+.01);

  const cleanup = () => {
    player.volume.gain.cancelScheduledValues(audio.context.currentTime)
    player.volume.gain.setValueAtTime(player.volume.gain.value, audio.context.currentTime);
    player.volume.gain.exponentialRampToValueAtTime(0.00000001, audio.context.currentTime+.01);
  };

  const touch = {
    cleanup,
    clientX: e.clientX,
    clientY: e.clientY,
    currentX: e.clientX,
    currentY: e.clientY,
    filteredX: e.clientX,
    filteredY: e.clientY,
    lengthAlongCurve: 0,
    player,
    vx: 0,
    vy: 0,
    lastTime: now,
    curve
  };

  return touch;
};


const MOUSE_ID = "mouse";
export default class Touches {
  constructor() {
    this.touches = {};
    this.isMouseDown = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.mouseVX = 0;
    this.mouseVY = 0;
  }

  step(dt) {
    Object.values(this.touches).forEach((touch) => {
      const f = .3;
      touch.filteredX = f*touch.clientX+(1-f)*touch.filteredX;
      touch.filteredY = f*touch.clientY+(1-f)*touch.filteredY;

      const lastCurvePt = touch.curve.points[touch.curve.points.length-1];
      const dx = lastCurvePt[0]-touch.filteredX;
      const dy = lastCurvePt[1]-touch.filteredY;
      const mag = Math.sqrt(dx*dx+dy*dy);

      if(mag > .1) {
        touch.curve.addPoint([ touch.filteredX, touch.filteredY, 0 ])
      }
      touch.lineBuffer = touch.curve.resampledBufferBetweenLengths(touch.lengthAlongCurve, touch.curve.lengthAt(1));

      touch.lengthAlongCurve += 400/1000*dt;

      const t = touch.curve.paramAtLength(touch.lengthAlongCurve);
      if(t === 1) {
        touch.lengthAlongCurve = touch.curve.lengthAt(1);
      }

      const p = touch.curve.pointAt(t);

      const lastX = touch.currentX;
      const lastY = touch.currentY;

      touch.currentX = p[0];
      touch.currentY = p[1];
      touch.vx = 1000*(touch.currentX-lastX)/dt;
      touch.vy = 1000*(touch.currentY-lastY)/dt;

      const receiverX = window.innerWidth*.5;
      const receiverY = window.innerHeight*.5;

      const rdx = touch.currentX-receiverX;
      const rdy = touch.currentY-receiverY;
      const rmag = Math.sqrt(rdx*rdx+rdy*rdy);

      const dirx = rdx/rmag;
      const diry = rdy/rmag;

      const dot = touch.vx*dirx + touch.vy*diry;

      const frequency = (2**((-dot/400)/12))*progression[audio.chordIndex][touch.player.noteIndex];
      touch.player.oscillator.frequency.cancelScheduledValues(audio.context.currentTime)
      touch.player.oscillator.frequency.setValueAtTime(touch.player.oscillator.frequency.value, audio.context.currentTime);
      touch.player.oscillator.frequency.exponentialRampToValueAtTime(frequency, audio.context.currentTime+.01);

      const volume = calcVolume(rmag);
      touch.player.volume.gain.cancelScheduledValues(audio.context.currentTime)
      touch.player.volume.gain.setValueAtTime(touch.player.volume.gain.value, audio.context.currentTime);
      touch.player.volume.gain.exponentialRampToValueAtTime(volume, audio.context.currentTime+.01);
    });

    const lineObjects = [];
    const material = new LineBasicMaterial({ color: 0xffffff });
    Object.values(this.touches).forEach((touch) => {
      if(touch.lineBuffer) {
        const positionAttribute = new BufferAttribute(touch.lineBuffer, 3);
        const geometry = new BufferGeometry();
        geometry.setAttribute('position', positionAttribute);
        const lineObject = new Line(geometry, material);
        lineObjects.push(lineObject);
      }
    });
    useTouchLines.getState().setLines(lineObjects);

  }

  touch(e) {
    let seen = {};
    const now = performance.now();
    for(let i = 0; i < e.touches.length; i++) {
      const eTouch = e.touches[i];
      const id = eTouch.identifier;
      seen[id] = true;
      if(this.touches[id]) {
        const touch = this.touches[id];
        if(now-this.touches[id].lastTime > 0) {
          touch.clientX = eTouch.clientX;
          touch.clientY = eTouch.clientY;
          touch.lastTime = now;
        }
      } else if(Object.keys(this.touches).length < MAX_PLAYERS) {
        if(audio.players.length === 0) {
          initAudio();
        }

        const touch = createTouch(eTouch);;
        this.touches[id] = touch;
      }
    }
    const keys = Object.keys(this.touches);
    for(let id of keys) {
      if(!seen[id]) {
        this.touches[id].cleanup();
        delete this.touches[id];
      }
    }
    e.preventDefault();
  }

  getTouches() {
    return Object.keys(this.touches).map((touchID, idx) => {
      const touch = this.touches[touchID];
      return { id: touchID, ...touch };
    });
  }

  mouseDown(e) {
    if(audio.players.length === 0) {
      initAudio();
    }

    const touch = createTouch(e);
    this.touches[MOUSE_ID] = touch;
    this.isMouseDown = true;
    e.preventDefault();
  }
  mouseMove(e) {
    if(this.isMouseDown) {
      const now = performance.now();
      const touch = this.touches[MOUSE_ID];
      if(now-touch.lastTime > 0) {
        touch.vx = 1000*(e.clientX-touch.clientX)/(now-touch.lastTime);
        touch.vy = 1000*(e.clientY-touch.clientY)/(now-touch.lastTime);

        touch.clientX = e.clientX;
        touch.clientY = e.clientY;
        touch.lastTime = now;

//        touch.curve.addPoint([ e.clientX, e.clientY, 0 ])
//        touch.lineBuffer = touch.curve.resampledBuffer();
      }
    }
    e.preventDefault();
  }
  mouseUp(e) {
    this.isMouseDown = false;
    if(this.touches[MOUSE_ID]) {
      this.touches[MOUSE_ID].cleanup();
      delete this.touches[MOUSE_ID];
    }
    e.preventDefault();
  }
};
