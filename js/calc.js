class Calc {
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
