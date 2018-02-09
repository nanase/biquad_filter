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

function update_control(filter) {
  // enable
  filter_controls.filter(x => filter.control.some(y => x == y))
    .forEach(c => $(`#${c}`).removeAttr('disabled').parents('.control-row').removeClass('disabled'));

  // disable
  filter_controls.filter(x => !filter.control.some(y => x == y))
    .forEach(c => $(`#${c}`).attr('disabled', 'true').parents('.control-row').addClass('disabled'));
}

function draw_frequency_response(impulse_response, canvas, width, height) {
  const imag = new Float64Array(impulse_response.length);
  const frequencyResponse = new Float64Array(impulse_response.length / 2);
  transform(impulse_response, imag);

  for (var i = 0; i < frequencyResponse.length; i++)
    frequencyResponse[i] = Math.log10(Math.sqrt(impulse_response[i] * impulse_response[i] + imag[i] * imag[i])) * 20;

  //console.info(frequencyResponse);

  const magnitude = 4.0;

  // sub axis
  {
    canvas.strokeStyle = '#444';
    [24, 12, 6, 3, -3, -6, -12, -24].forEach(db => {
      canvas.beginPath();
      canvas.moveTo(0, height / 2 - db * magnitude);
      canvas.lineTo(width, height / 2 - db * magnitude);
      canvas.stroke();
    });

    // 0 dB
    canvas.strokeStyle = '#666';
    canvas.beginPath();
    canvas.moveTo(0, height / 2);
    canvas.lineTo(width, height / 2);
    canvas.stroke();
  }

  // frequency response
  {
    canvas.strokeStyle = '#fff';
    canvas.beginPath();
    canvas.moveTo(0, height / 2 - frequencyResponse[0] * magnitude);

    for (var i = 0; i < frequencyResponse.length; i++)
      canvas.lineTo((i / frequencyResponse.length) * width, height / 2 - frequencyResponse[i] * magnitude);

    canvas.stroke();
  }

  // axis
  {
    canvas.strokeStyle = '#aaa';
    canvas.beginPath();
    canvas.moveTo(0, 0);
    canvas.lineTo(0, height);
    canvas.lineTo(width, height);
    canvas.stroke();
  }
}

function draw_impulse_response(impulse_response, canvas, width, height) {
  const magnitude = 0.8;

  // sub axis
  {
    canvas.strokeStyle = '#444';
    canvas.beginPath();
    canvas.moveTo(0, height / 2 - height * 0.5 * magnitude);
    canvas.lineTo(width, height / 2 - height * 0.5 * magnitude);
    canvas.stroke();

    canvas.beginPath();
    canvas.moveTo(0, height / 2);
    canvas.lineTo(width, height / 2);
    canvas.stroke();

    canvas.beginPath();
    canvas.moveTo(0, height / 2 + height * 0.5 * magnitude);
    canvas.lineTo(width, height / 2 + height * 0.5 * magnitude);
    canvas.stroke();
  }

  // impulse response
  {
    canvas.strokeStyle = '#fff';
    canvas.beginPath();
    canvas.moveTo(0, height / 2);

    for (var i = 0; i < width; i++)
      canvas.lineTo(i, height / 2 + impulse_response[i] * height * 0.5 * magnitude);

    canvas.stroke();
  }

  // axis
  {
    canvas.strokeStyle = '#aaa';
    canvas.beginPath();
    canvas.moveTo(0, 0);
    canvas.lineTo(0, height);
    canvas.stroke();
  }
}

function update_response(coefficients) {
  const width = $('#response').width();
  const height = $('#response').height();
  const impulseRenponse = Calc.getImpulseResponse(coefficients, impulse_size);
  const canvas = $('#response')[0].getContext('2d');

  $('#response').attr('height', height).attr('width', width);
  canvas.clearRect(0, 0, width, height);
  draw_frequency_response(impulseRenponse, canvas, width, height);
  //draw_impulse_response(impulseRenponse, canvas, width, height);
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
  const coefficients = Coefficients.normalize(filters[filter_type].func(parameters));

  // diagram
  const diagram = $($('.diagram')[0].contentDocument);
  diagram_assign.forEach((a, i) => $(a, diagram).text(`${coefficients[i].toFixed(9)}`));

  // impulse response
  update_response(coefficients);
}

String.prototype.withCommas = Number.prototype.withCommas = function () { return String(this).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

$(() => {
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
