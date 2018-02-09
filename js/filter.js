class Coefficients {
  static normalize(coefficients) {
    return [
      coefficients[0] / coefficients[3],    // b0
      coefficients[1] / coefficients[3],    // b1
      coefficients[2] / coefficients[3],    // b2
      -coefficients[4] / coefficients[3],   // a1
      -coefficients[5] / coefficients[3],   // a2
    ];
  }

  static calcOmega(sampling_rate, cutoff) {
    return 2.0 * Math.PI * cutoff / sampling_rate;
  }

  static lowpass(sampling_rate, cutoff, q) {
    const omega = this.calcOmega(sampling_rate, cutoff);
    const alpha = Math.sin(omega) / (2.0 * q);
  
    return [
      (1.0 - Math.cos(omega)) / 2.0,  // b0
      1.0 - Math.cos(omega),          // b1
      (1.0 - Math.cos(omega)) / 2.0,  // b2
      1.0 + alpha,                    // a0
      -2.0 * Math.cos(omega),         // a1
      1.0 - alpha,                    // a2
    ];
  }

  static highpass(sampling_rate, cutoff, q) {
    const omega = this.calcOmega(sampling_rate, cutoff);
    const alpha = Math.sin(omega) / (2.0 * q);
  
    return [
      (1.0 + Math.cos(omega)) / 2.0,   // b0
      -(1.0 + Math.cos(omega)),        // b1
      (1.0 + Math.cos(omega)) / 2.0,   // b2
      1.0 + alpha,                     // a0
      -2.0 * Math.cos(omega),          // a1
      1.0 - alpha,                     // a2
    ];
  }

  static bandpass(sampling_rate, cutoff, bandwidth, q) {
    const omega = this.calcOmega(sampling_rate, cutoff);
    const alpha = Math.sin(omega) * Math.sinh(Math.log(2.0) / 2.0 * bandwidth * omega / Math.sin(omega));
  
    return [
      alpha * q,                       // b0
      0.0,                             // b1
      -alpha * q,                      // b2
      1.0 + alpha,                     // a0
      -2.0 * Math.cos(omega),          // a1
      1.0 - alpha,                     // a2
    ];
  }

  static bandstop(sampling_rate, cutoff, bandwidth) {
    const omega = this.calcOmega(sampling_rate, cutoff);
    const alpha = Math.sin(omega) * Math.sinh(Math.log(2.0) / 2.0 * bandwidth * omega / Math.sin(omega));
  
    return [
      1.0,                             // b0
      -2.0 * Math.cos(omega),          // b1
      1.0,                             // b2
      1.0 + alpha,                     // a0
      -2.0 * Math.cos(omega),          // a1
      1.0 - alpha,                     // a2
    ];
  }

  static lowshelf(sampling_rate, cutoff, gain, q) {
    const omega = this.calcOmega(sampling_rate, cutoff);
    const a = Math.pow(10.0, gain / 40.0);
    const beta = Math.sqrt(a) / q;
  
    return [
      a * (a + 1.0 - (a - 1.0) * Math.cos(omega) + beta * Math.sin(omega)),
      2.0 * a * (a - 1.0 - (a + 1.0) * Math.cos(omega)),
      a * (a + 1.0 - (a - 1.0) * Math.cos(omega) - beta * Math.sin(omega)),
      a + 1.0 + (a - 1.0) * Math.cos(omega) + beta * Math.sin(omega),
      -2.0 * (a - 1.0 + (a + 1.0) * Math.cos(omega)),
      a + 1.0 + (a - 1.0) * Math.cos(omega) - beta * Math.sin(omega),
    ];
  }

  static highshelf(sampling_rate, cutoff, gain, q) {
    const omega = this.calcOmega(sampling_rate, cutoff);
    const a = Math.pow(10.0, gain / 40.0);
    const beta = Math.sqrt(a) / q;
  
    return [
      a * (a + 1.0 + (a - 1.0) * Math.cos(omega) + beta * Math.sin(omega)),
      -2.0 * a * (a - 1.0 + (a + 1.0) * Math.cos(omega)),
      a * (a + 1.0 + (a - 1.0) * Math.cos(omega) - beta * Math.sin(omega)),
      a + 1.0 - (a - 1.0) * Math.cos(omega) + beta * Math.sin(omega),
      2.0 * (a - 1.0 - (a + 1.0) * Math.cos(omega)),
      a + 1.0 - (a - 1.0) * Math.cos(omega) - beta * Math.sin(omega),
    ];
  }

  static peaking(sampling_rate, cutoff, bandwidth, gain) {
    const omega = this.calcOmega(sampling_rate, cutoff);
    const alpha = Math.sin(omega) * Math.sinh(Math.log(2.0) / 2.0 * bandwidth * omega / Math.sin(omega));
    const a = Math.pow(10.0, gain / 40.0);
  
    return [
      1.0 + alpha * a,          // b0
      -2.0 * Math.cos(omega),   // b1
      1.0 - alpha * a,          // b2
      1.0 + alpha / a,          // a0
      -2.0 * Math.cos(omega),   // a1
      1.0 - alpha / a,          // a2
    ];
  }
  
  static allpass(sampling_rate, cutoff, q) {
    const omega = this.calcOmega(sampling_rate, cutoff);
    const alpha = Math.sin(omega) / (2.0 * q);
  
    return [
      1.0 - alpha,              // b0
      -2.0 * Math.cos(omega),   // b1
      1.0 + alpha,              // b2
      1.0 + alpha,              // a0
      -2.0 * Math.cos(omega),   // a1
      1.0 - alpha,              // a2
    ];
  }
}






