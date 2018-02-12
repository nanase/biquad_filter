class Calc {
  constructor() {
    this.coefficients = [1.0, 0.0, 0.0, 0.0, 0.0];
    this.reset();
  }

  reset() {
    this.i1 = 0.0;
    this.i2 = 0.0;
    this.o1 = 0.0;
    this.o2 = 0.0;
  }

  setCoefficients(coefficients) {
    if (coefficients.length == 6)
      coefficients = Coefficients.normalize(coefficients);

    this.coefficients = coefficients;
  }

  process(buffer) {
    let i0;
    for (let i = 0; i < buffer.length; i++) {
      i0 = buffer[i];
      buffer[i] =
        this.coefficients[0] * i0 +
        this.coefficients[1] * this.i1 +
        this.coefficients[2] * this.i2 +
        this.coefficients[3] * this.o1 +
        this.coefficients[4] * this.o2;

      this.i2 = this.i1;
      this.i1 = i0;
      this.o2 = this.o1;
      this.o1 = buffer[i];
    }
  }

  static getImpulseResponse(coefficients, length) {
    if (coefficients.length == 6)
      coefficients = Coefficients.normalize(coefficients);

    const impulses = new Float64Array(length);
    let o1 = 0.0, o2 = 0.0, i0, i1 = 0.0, i2 = 0.0;

    for (let i = 0; i < length; i++) {
      i0 = (i == 0) ? 1.0 : 0.0;
      impulses[i] = coefficients[0] * i0 + coefficients[1] * i1 + coefficients[2] * i2 + coefficients[3] * o1 + coefficients[4] * o2;
      i2 = i1;
      i1 = i0;
      o2 = o1;
      o1 = impulses[i];
    }

    return impulses;
  }
}
