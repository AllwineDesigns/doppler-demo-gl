// catmull rom curve with 3d points
export class Curve3 {
  constructor() {
    this.points = [];
    this.tension = .5;
    this.isLoop = false;
    this.lengthsCalculated = false;

    this.linearLength = 0;
    this.samplesPerLinearLength = 1;
  }

  calculateLengths() {
    this.lengths = [ 0 ];
    let len = 0;
    let lastPt = this.pointAt(0);
    const samples = this.samplesPerLinearLength*this.linearLength;
    for(let i = 1; i <= samples; i++) {
      const t = i/samples;
      const pt = this.pointAt(t);
      const dx = pt[0]-lastPt[0];
      const dy = pt[1]-lastPt[1];
      const dz = pt[2]-lastPt[2];
      len += Math.sqrt(dx*dx+dy*dy+dz*dz);
      this.lengths.push(len);

      lastPt = pt;
    }

    this.lengthsCalculated = true;
  }

  addPoint(pt) {
    this.points.push(pt);
    this.lengthsCalculated = false;
    if(this.points.length >= 2) {
      const p0 = this.points[this.points.length-2];
      const p1 = this.points[this.points.length-1];
      const dx = p1[0]-p0[0];
      const dy = p1[1]-p0[1];
      const dz = p1[2]-p0[2];
      this.linearLength += Math.sqrt(dx*dx+dy*dy+dz*dz);
    }
  }

  // tt is parameter from 0-1 that represents percentage through entire curve
  pointAt(tt) {
    if(this.points.length === 0) {
      return [ 0, 0, 0 ];
    }

    let t; // parameter between 0-1 of current curve segment of 4 points
    let i; // current curve index
    let curves; // number of curve segments in total curve

    if(this.isLoop) {
      curves = Math.max(this.points.length, 2);
    } else {
      curves = Math.max(this.points.length-1, 1);
    }

    if(tt === 1) {
      t = 1;
      i = curves-1;
    } else {
      t = tt;
      t *= curves;
      i = Math.trunc(t);
      t -= i;
    }

    let i0;
    let i1;
    let i2;
    let i3;

    i0 = i-1;

    if(i0 < 0) {
      if(this.isLoop) {
        i0 = this.points.length-1;
      } else {
        i0 = 0;
      }
    }

    i1 = i;
    i2 = i+1;
    if(this.isLoop) {
      i2 = i2%this.points.length;
    } else {
      i2 = Math.min(i2, this.points.length-1);
    }

    i3 = i+2;
    if(this.isLoop) {
      i3 = i3%this.points.length;
    } else {
      i3 = Math.min(i3, this.points.length-1);
    }

    const n0 = this.points[i0];
    const n1 = this.points[i1];
    const n2 = this.points[i2];
    const n3 = this.points[i3];

    const p0 = n1;
    const p1 = n2;
    const m0x = this.tension*(n2[0]-n0[0]);
    const m0y = this.tension*(n2[1]-n0[1]);
    const m0z = this.tension*(n2[2]-n0[2]);

    const m1x = this.tension*(n3[0]-n1[0]);
    const m1y = this.tension*(n3[1]-n1[1]);
    const m1z = this.tension*(n3[2]-n1[2]);

    const p0t = (1+2*t)*(1-t)*(1-t);
    const m0t = t*(1-t)*(1-t);
    const p1t = t*t*(3-2*t);
    const m1t = t*t*(t-1);

    const x = p0t*p0[0]+m0t*m0x+p1t*p1[0]+m1t*m1x;
    const y = p0t*p0[1]+m0t*m0y+p1t*p1[1]+m1t*m1y;
    const z = p0t*p0[2]+m0t*m0z+p1t*p1[2]+m1t*m1z;

    return [ x, y, z ];
  }

  lengthAt(tt) {
    if(!this.lengthsCalculated) {
      this.calculateLengths();
    }

    if(tt === 1) {
      return this.lengths[this.lengths.length-1];
    }

    const samples = this.samplesPerLinearLength*this.linearLength;

    const i = Math.trunc(tt*samples);
    const t = (tt*samples-i)

    return this.lengths[i]*(1-t)+this.lengths[i+1]*t;
  }

  resampledBuffer() {
    /*
    const samples = Math.trunc(Math.max(this.samplesPerLinearLength*this.linearLength, 4));
    const divideBy = this.isLoop ? samples : samples -1;
    const array = [];

    for(let i = 0; i < samples; i++) {
      const p = this.pointAt(i/divideBy);

      array.push(p[0], p[1], p[2]);
    }

    return Float32Array.from(array);
    */

    const samples = Math.trunc(Math.max(this.samplesPerLinearLength*this.linearLength, 4));
    const divideBy = this.isLoop ? samples : samples -1;
    const array = [];

    const totalLength = this.lengthAt(1);
    for(let i = 0; i < samples; i++) {
      const t = this.paramAtLength(totalLength*i/divideBy);
      const p = this.pointAt(t);

      array.push(p[0], p[1], p[2]);
    }

    return Float32Array.from(array);
    /*
    const array = [];
    for(let i = 0; i < this.points.length; i++) {
      array.push(this.points[i][0], this.points[i][1], this.points[i][2]);
    }
    return Float32Array.from(array);
    */
  }

  paramAtLength(len) {
    if(!this.lengthsCalculated) {
      this.calculateLengths();
    }

    if(len <= 0) {
      return 0;
    }

    if(len >= this.lengths[this.lengths.length-1]) {
      return 1;
    }

    let min = 0;
    let max = this.lengths.length-1;

    let i = Math.trunc((max+min)/2);

    while(max-min !== 1) {
      if(this.lengths[i] <= len) {
        min = i;
      } else if(this.lengths[i] > len) {
        max = i;
      }

      i = Math.trunc((max+min)/2);
    }

    const l0 = this.lengths[i];
    const l1 = this.lengths[i+1];

    const t = (len-l0)/(l1-l0);
    return (1-t)*min/this.lengths.length+t*max/this.lengths.length;
  }
};
