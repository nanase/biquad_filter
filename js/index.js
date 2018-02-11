const diagram_assign = ['#b0', '#b1', '#b2', '#a1', '#a2'];
const filter_controls = ['cutoff_freq', 'q', 'bandwidth', 'gain', 'sampling_rate'];
const filters = [
  {
    func: p => Coefficients.lowpass(p.sampling_rate, p.cutoff, p.q),
    control: ['sampling_rate', 'cutoff_freq', 'q'],
  },
  {
    func: p => Coefficients.highpass(p.sampling_rate, p.cutoff, p.q),
    control: ['sampling_rate', 'cutoff_freq', 'q'],
  },
  {
    func: p => Coefficients.bandpass(p.sampling_rate, p.cutoff, p.bandwidth, p.q),
    control: ['sampling_rate', 'cutoff_freq', 'bandwidth', 'q'],
  },
  {
    func: p => Coefficients.bandstop(p.sampling_rate, p.cutoff, p.bandwidth),
    control: ['sampling_rate', 'cutoff_freq', 'bandwidth'],
  },
  {
    func: p => Coefficients.lowshelf(p.sampling_rate, p.cutoff, p.gain, p.q),
    control: ['sampling_rate', 'cutoff_freq', 'gain', 'q'],
  },
  {
    func: p => Coefficients.highshelf(p.sampling_rate, p.cutoff, p.gain, p.q),
    control: ['sampling_rate', 'cutoff_freq', 'gain', 'q'],
  },
  {
    func: p => Coefficients.peaking(p.sampling_rate, p.cutoff, p.bandwidth, p.gain),
    control: ['sampling_rate', 'cutoff_freq', 'bandwidth', 'gain'],
  },
  {
    func: p => Coefficients.allpass(p.sampling_rate, p.cutoff, p.q),
    control: ['sampling_rate', 'cutoff_freq', 'q'],
  }
];
const impulse_size = 1024;
const frequency_amplitude_auxiliary_line = [24, 12, 6, 3, -3, -6, -12, -24];

const settings = {
  impulseResponse: {
    connected: false,
    margin: 30,
    magnitude: { x: 8.0, y: 0.8 },
    font: '12px san-serif',
    stroke: '#fff',
    fill: '#fff',
    dotSize: 4,
    auxiliaryLine: {
      stroke: '#444',
      values: [1.0, 0.5, -0.5, -1.0],
    },
    baseLine: {
      stroke: '#666',
    },
    axis: {
      stroke: '#aaa',
    }
  },
  frequencyResponse: {
    margin: { x: 30, y: 20 },
    magnitude: 8.0,
    font: '10px san-serif',
    stroke: '#fff',
    fill: '#fff',
    cutoffLine: {
      stroke: '#666',
    },
    auxiliaryLine: {
      stroke: '#444',
      x: {
      },
      y: {
        values: [24, 12, 6, 3, -3, -6, -12, -24],
        texts: [24, 12, 6, -6, -12, -24],
      },
    },
    baseLine: {
      stroke: '#666',
    },
    axis: {
      stroke: '#aaa',
    }
  },
  phaseResponse: {
    margin: { x: 30, y: 20 },
    magnitude: 0.9,
    font: '10px san-serif',
    stroke: '#fff',
    fill: '#fff',
    cutoffLine: {
      stroke: '#666',
    },
    auxiliaryLine: {
      stroke: '#444',
      x: {
      },
      y: {
        values: [Math.PI, -Math.PI],
        texts: ['π', '-π'],
      },
    },
    baseLine: {
      stroke: '#666',
    },
    axis: {
      stroke: '#aaa',
    }
  }
};

let resultCoefficients = [1, 0, 0, 0, 0];

function frequencyFormat(frequency) {
  if (frequency >= 1000)
    return `${(frequency / 1000).toFixed(1)}k`;
  else if (frequency < 100)
    return frequency.toFixed(1);
  else
    return frequency.toFixed(0);
}

function generateFrequencyAuxiliary(samplingRate) {
  samplingRate *= 0.5;
  const interval = Math.pow(5, (Math.log(samplingRate) / Math.log(5)) | 0) / 2.5;
  const auxiliary = [];

  for (let i = 0, j = interval; j < samplingRate; i++ , j += interval)
    auxiliary[i] = j;

  return auxiliary;
}

function update_control(filter) {
  // enable
  filter_controls.filter(x => filter.control.some(y => x == y))
    .forEach(c => $(`#${c}`).removeAttr('disabled').parents('.control-row').removeClass('disabled'));

  // disable
  filter_controls.filter(x => !filter.control.some(y => x == y))
    .forEach(c => $(`#${c}`).attr('disabled', 'true').parents('.control-row').addClass('disabled'));
}

function drawPhaseResponse(impulseResponse, canvas, width, height, parameters) {
  const real = impulseResponse;
  const imag = new Float64Array(real.length);
  transform(real, imag);
  const phaseResponse = new Float64Array(real.length / 2).map((_, i) => Math.atan2(imag[i], real[i]))
  const margin = settings.phaseResponse.margin;

  const graphHeight = height - margin.y;
  const graphCenter = graphHeight / 2;
  const magnitude = settings.phaseResponse.magnitude * graphCenter / Math.PI;
  const cutoff = parameters.cutoff / (parameters.sampling_rate * 0.5);

  // auxiliary line - y
  {
    canvas.font = settings.phaseResponse.font;
    canvas.textAlign = 'right';
    canvas.textBaseline = 'middle';
    canvas.fillStyle = settings.phaseResponse.fill;

    canvas.strokeStyle = settings.phaseResponse.auxiliaryLine.stroke;
    settings.phaseResponse.auxiliaryLine.y.values.forEach(phase => {
      canvas.beginPath();
      canvas.moveTo(margin.x, graphCenter - phase * magnitude);
      canvas.lineTo(width, graphCenter - phase * magnitude);
      canvas.stroke();
    });

    // base line
    canvas.strokeStyle = settings.phaseResponse.baseLine.stroke;
    canvas.beginPath();
    canvas.moveTo(margin.x, graphCenter);
    canvas.lineTo(width, graphCenter);
    canvas.stroke();

    canvas.fillText('0', margin.x - 4, graphCenter);
    settings.phaseResponse.auxiliaryLine.y.texts.forEach((t, i) => canvas.fillText(t, margin.x - 4, graphCenter - settings.phaseResponse.auxiliaryLine.y.values[i] * magnitude));
  }

  // cutoff line
  {
    canvas.strokeStyle = settings.phaseResponse.cutoffLine.stroke;
    canvas.setLineDash([5, 5]);
    canvas.beginPath();
    canvas.moveTo(margin.x + cutoff * (width - margin.x), 0);
    canvas.lineTo(margin.x + cutoff * (width - margin.x), graphHeight);
    canvas.stroke();
    canvas.setLineDash([]);
  }

  // auxiliary line - x
  {
    canvas.strokeStyle = settings.phaseResponse.auxiliaryLine.stroke;
    generateFrequencyAuxiliary(parameters.sampling_rate).forEach(f => {
      const freq = f / (parameters.sampling_rate * 0.5);
      canvas.beginPath();
      canvas.moveTo(margin.x + freq * (width - margin.x), 0);
      canvas.lineTo(margin.x + freq * (width - margin.x), graphHeight);
      canvas.stroke();
    });
  }

  // phase response
  {
    canvas.strokeStyle = settings.phaseResponse.stroke;
    canvas.beginPath();
    canvas.moveTo(margin.x, graphCenter - phaseResponse[0] * magnitude);
    phaseResponse.forEach((p, i, a) => canvas.lineTo(margin.x + (i / a.length) * (width - margin.x), graphCenter - p * magnitude));
    canvas.stroke();

    // trim
    canvas.clearRect(0, graphHeight, width, height);
  }

  // axis
  {
    canvas.strokeStyle = settings.phaseResponse.axis.stroke;
    canvas.beginPath();
    canvas.moveTo(margin.x, 0);
    canvas.lineTo(margin.x, graphHeight);
    canvas.lineTo(width, graphHeight);
    canvas.stroke();
  }

  // auxiliary line - x
  {
    canvas.font = settings.phaseResponse.font;
    canvas.textAlign = 'center';
    canvas.textBaseline = 'top';
    canvas.fillStyle = settings.phaseResponse.fill;
    generateFrequencyAuxiliary(parameters.sampling_rate).forEach(f => {
      const freq = f / (parameters.sampling_rate * 0.5);
      canvas.fillText(`${frequencyFormat(f)}`, margin.x + freq * (width - margin.x), graphHeight);
    });
  }

  // cutoff text
  {
    canvas.font = settings.phaseResponse.font;
    canvas.textAlign = cutoff > 0.5 ? 'right' : 'left';
    canvas.textBaseline = 'top';
    canvas.fillStyle = settings.phaseResponse.fill;
    canvas.fillText(` ${parameters.cutoff.withCommas()} Hz `, margin.x + cutoff * (width - margin.x), 0);
  }
}

function drawFrequencyResponse(impulseResponse, canvas, width, height, parameters) {
  const real = impulseResponse;
  const imag = new Float64Array(real.length);
  transform(real, imag);
  const frequencyResponse = new Float64Array(real.length / 2).map((_, i) => Math.log10(Math.sqrt(real[i] * real[i] + imag[i] * imag[i])) * 20)
  const magnitude = settings.frequencyResponse.magnitude;
  const margin = settings.frequencyResponse.margin;
  const cutoff = parameters.cutoff / (parameters.sampling_rate * 0.5);

  const graphHeight = height - margin.y;
  const graphCenter = graphHeight / 2;

  // auxiliary line - y
  {
    canvas.font = settings.frequencyResponse.font;
    canvas.textAlign = 'right';
    canvas.textBaseline = 'middle';
    canvas.fillStyle = settings.frequencyResponse.fill;

    canvas.strokeStyle = settings.frequencyResponse.auxiliaryLine.stroke;
    settings.frequencyResponse.auxiliaryLine.y.values.forEach(db => {
      canvas.beginPath();
      canvas.moveTo(margin.x, graphCenter - db * magnitude);
      canvas.lineTo(width, graphCenter - db * magnitude);
      canvas.stroke();
    });

    // 0 dB
    canvas.strokeStyle = '#666';
    canvas.beginPath();
    canvas.moveTo(margin.x, graphCenter);
    canvas.lineTo(width, graphCenter);
    canvas.stroke();

    settings.frequencyResponse.auxiliaryLine.y.texts.forEach(db => canvas.fillText(`${db.toFixed(0)}`, margin.x - 4, graphCenter - db * magnitude));
    canvas.fillText('0', margin.x - 4, graphCenter);
  }

  // cutoff line
  {
    canvas.strokeStyle = settings.frequencyResponse.cutoffLine.stroke;
    canvas.setLineDash([5, 5]);
    canvas.beginPath();
    canvas.moveTo(margin.x + cutoff * (width - margin.x), 0);
    canvas.lineTo(margin.x + cutoff * (width - margin.x), graphHeight);
    canvas.stroke();
    canvas.setLineDash([]);
  }

  // auxiliary line - x
  {
    canvas.strokeStyle = settings.frequencyResponse.auxiliaryLine.stroke;
    generateFrequencyAuxiliary(parameters.sampling_rate).forEach(f => {
      const freq = f / (parameters.sampling_rate * 0.5);
      canvas.beginPath();
      canvas.moveTo(margin.x + freq * (width - margin.x), 0);
      canvas.lineTo(margin.x + freq * (width - margin.x), graphHeight);
      canvas.stroke();
    });
  }

  // frequency response
  {
    canvas.strokeStyle = settings.frequencyResponse.stroke;
    canvas.beginPath();
    canvas.moveTo(margin.x, graphCenter - frequencyResponse[0] * magnitude);
    frequencyResponse.forEach((f, i, a) => canvas.lineTo(margin.x + (i / a.length) * (width - margin.x), graphCenter - f * magnitude));
    canvas.stroke();

    // trim
    canvas.clearRect(0, graphHeight, width, height);
  }

  // axis
  {
    canvas.strokeStyle = settings.frequencyResponse.axis.stroke;
    canvas.beginPath();
    canvas.moveTo(margin.x, 0);
    canvas.lineTo(margin.x, graphHeight);
    canvas.lineTo(width, graphHeight);
    canvas.stroke();
  }

  // auxiliary line - x
  {
    canvas.font = settings.frequencyResponse.font;
    canvas.textAlign = 'center';
    canvas.textBaseline = 'top';
    canvas.fillStyle = settings.frequencyResponse.fill;
    generateFrequencyAuxiliary(parameters.sampling_rate).forEach(f => {
      const freq = f / (parameters.sampling_rate * 0.5);
      canvas.fillText(`${frequencyFormat(f)}`, margin.x + freq * (width - margin.x), graphHeight);
    });
  }

  // cutoff text
  {
    canvas.font = settings.frequencyResponse.font;
    canvas.textAlign = cutoff > 0.5 ? 'right' : 'left';
    canvas.textBaseline = 'top';
    canvas.fillStyle = settings.frequencyResponse.fill;
    canvas.fillText(` ${parameters.cutoff.withCommas()} Hz `, margin.x + cutoff * (width - margin.x), 0);
  }
}

function drawImpulseResponse(impulseResponse, canvas, width, height) {
  const magnitude = settings.impulseResponse.magnitude;
  const margin = settings.impulseResponse.margin;

  // auxiliary line
  {
    canvas.font = settings.impulseResponse.font;
    canvas.textAlign = 'right';
    canvas.textBaseline = 'middle';
    canvas.fillStyle = settings.impulseResponse.fill;
    canvas.strokeStyle = settings.impulseResponse.auxiliaryLine.stroke;

    settings.impulseResponse.auxiliaryLine.values.forEach(value => {
      canvas.beginPath();
      canvas.moveTo(margin, height / 2 - height * 0.5 * magnitude.y * value);
      canvas.lineTo(width, height / 2 - height * 0.5 * magnitude.y * value);
      canvas.stroke();
      canvas.fillText(value.toFixed(1), margin - 4, height / 2 - height * 0.5 * magnitude.y * value);
    });

    canvas.strokeStyle = settings.impulseResponse.baseLine.stroke;
    canvas.beginPath();
    canvas.moveTo(margin, height / 2);
    canvas.lineTo(width, height / 2);
    canvas.stroke();
    canvas.fillText('0.0', margin - 4, height / 2);
  }

  // axis
  {
    canvas.strokeStyle = settings.impulseResponse.axis.stroke;
    canvas.beginPath();
    canvas.moveTo(margin, 0);
    canvas.lineTo(margin, height);
    canvas.stroke();
  }

  // impulse response
  {
    canvas.strokeStyle = settings.impulseResponse.stroke;
    canvas.fillStyle = settings.impulseResponse.fill;

    if (settings.impulseResponse.connected) {
      canvas.beginPath();
      canvas.moveTo(margin, height / 2);

      for (let i = 0; i < impulseResponse.length && margin + i * magnitude.x < width; i++)
        canvas.lineTo(margin + i * magnitude.x, height / 2 + impulse_response[i] * height * 0.5 * magnitude.y);

      canvas.stroke();
    } else {
      const dot = settings.impulseResponse.dotSize;

      for (let i = 0; i < impulseResponse.length && margin + i * magnitude.x < width; i++) {
        const x = margin + i * magnitude.x;
        const y = height / 2 + impulseResponse[i] * height * 0.5 * magnitude.y;

        canvas.beginPath();
        canvas.moveTo(x, height / 2);
        canvas.lineTo(x, y);
        canvas.stroke();

        canvas.fillRect(x - dot / 2, y - dot / 2, dot, dot);
      }
    }
  }
}

function update_response(coefficients, parameters) {
  const width = $('#response').width();
  const height = $('#response').height();
  const impulseRenponse = Calc.getImpulseResponse(coefficients, impulse_size);
  const canvas = $('#response')[0].getContext('2d');

  $('#response').attr('height', height).attr('width', width);
  canvas.clearRect(0, 0, width, height);
  drawFrequencyResponse(impulseRenponse, canvas, width, height, parameters);
  //drawImpulseResponse(impulseRenponse, canvas, width, height);
}

function update_filter() {
  const filter_type = Number($('#filter_type').val());
  const parameters = {
    cutoff: $('#cutoff_freq').val(),
    q: Math.pow(2, $('#q').val()),
    bandwidth: $('#bandwidth').val(),
    gain: $('#gain').val(),
    sampling_rate: $('#sampling_rate').val(),
  };
  update_control(filters[filter_type]);
  resultCoefficients = filters[filter_type].func(parameters);
  const coefficients = Coefficients.normalize(resultCoefficients);

  // diagram
  const diagram = $($('.diagram')[0].contentDocument);
  diagram_assign.forEach((a, i) => $(a, diagram).text(`${coefficients[i].toFixed(9)}`));

  // impulse response
  update_response(coefficients, parameters);
}

function generateCoefficientsOutput() {
  const five_coefficients = $('input[name=output_n_coefficients]:eq(0)').is(':checked');
  const coefficient = five_coefficients ? Coefficients.normalize(resultCoefficients) : resultCoefficients;

  if ($('input[name=output_format]:eq(0)').is(':checked')) {
    if (five_coefficients)
      return `b0 = ${coefficient[0]};
b1 = ${coefficient[1]};
b2 = ${coefficient[2]};
a1 = ${coefficient[3]};
a2 = ${coefficient[4]};`;
    else
      return `b0 = ${coefficient[0]};
b1 = ${coefficient[1]};
b2 = ${coefficient[2]};
a0 = ${coefficient[3]};
a1 = ${coefficient[4]};
a2 = ${coefficient[5]};`;
  } else {
    return `[
  ${coefficient.join(',\n  ')}
]`;
  }
}

String.prototype.withCommas = Number.prototype.withCommas = function () { return String(this).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

new BootstrapMenu('.diagram-clicker', {
  actions: [{
    name: '係数のコピー',
    onClick: function () {
      $('#coefficients_output').val(generateCoefficientsOutput());
      $('#coefficient_modal').modal();
    }
  }]
});


$(() => {
  $('.modal-coefficients input[type=radio]').on('change', e => $('#coefficients_output').val(generateCoefficientsOutput()));

  $('#cutoff_freq').on('input', e => $('#cutoff_freq_value').text(`${$(e.target).val().withCommas()} Hz`));
  $('#q').on('input', e => $('#q_value').text(`${Math.pow(2, $(e.target).val()).toFixed(9)}`));
  $('#bandwidth').on('input', e => $('#bandwidth_value').text(`${Number($(e.target).val()).toFixed(1)} oct`));
  $('#gain').on('input', e => $('#gain_value').text(`${Number($(e.target).val()).toFixed(1)} dB`));
  $('#sampling_rate').on('input', e => {
    const value = $(e.target).val();
    const max_value = ((value / 2) | 0) - 1;
    const cutoff = $('#cutoff_freq').attr('max', max_value).val();
    $('#sampling_rate_value').text(`${value.withCommas()} Hz`);

    if (cutoff >= max_value) {
      $('#cutoff_freq').val(max_value);
      $('#cutoff_freq_value').text(`${max_value.withCommas()} Hz`);
    }
  });
  $('.control-col input[type=range], .control-col select').on('input', update_filter);
  $('.diagram').on('load', update_filter);
});
