import { StreamDrawUsage, BufferGeometry, Float32BufferAttribute } from 'three';

export class TouchLinesGeometry extends BufferGeometry {
  constructor(maxLines=10000) {
    super();

    this.positionAttribute = new Float32BufferAttribute(maxLines*4, 2);
    this.positionAttribute.usage = StreamDrawUsage;

    this.setAttribute('position', this.positionAttribute);
    this.setDrawRange(0, 0);
    this.numLines = 0;
    this.maxLines = maxLines;
  }

  clearLines() {
    this.numLines = 0;
  }

  addLine(x1,y1,x2,y2) {
    if(this.numLines < this.maxLines) {
      this.positionAttribute.array[4*this.numLines] = x1;
      this.positionAttribute.array[4*this.numLines+1] = y1;

      this.positionAttribute.array[4*this.numLines+2] = x2;
      this.positionAttribute.array[4*this.numLines+3] = y2;

      this.numLines += 1;
    }
  }

  update() {
    this.setDrawRange(0, 2*this.numLines);
    this.positionAttribute.updateRange.offset = 0;
    this.positionAttribute.updateRange.count = this.numLines*4;
    this.positionAttribute.needsUpdate = true;
  }
};
