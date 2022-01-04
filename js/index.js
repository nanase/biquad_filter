const diagramAssign = ['#b0', '#b1', '#b2', '#a1', '#a2'];
const filterControls = ['cutoff_freq', 'q', 'bandwidth', 'gain'];
const inputControls = ['input_freq', 'input_sweep_speed'];
const filters = [
  {
    func: p => Coefficients.lowpass(p.samplingRate, p.cutoff, p.q),
    control: ['cutoff_freq', 'q'],
  },
  {
    func: p => Coefficients.highpass(p.samplingRate, p.cutoff, p.q),
    control: ['cutoff_freq', 'q'],
  },
  {
    func: p => Coefficients.bandpass(p.samplingRate, p.cutoff, p.bandwidth, p.q),
    control: ['cutoff_freq', 'bandwidth', 'q'],
  },
  {
    func: p => Coefficients.bandstop(p.samplingRate, p.cutoff, p.bandwidth),
    control: ['cutoff_freq', 'bandwidth'],
  },
  {
    func: p => Coefficients.lowshelf(p.samplingRate, p.cutoff, p.gain, p.q),
    control: ['cutoff_freq', 'gain', 'q'],
  },
  {
    func: p => Coefficients.highshelf(p.samplingRate, p.cutoff, p.gain, p.q),
    control: ['cutoff_freq', 'gain', 'q'],
  },
  {
    func: p => Coefficients.peaking(p.samplingRate, p.cutoff, p.bandwidth, p.gain),
    control: ['cutoff_freq', 'bandwidth', 'gain'],
  },
  {
    func: p => Coefficients.allpass(p.samplingRate, p.cutoff, p.q),
    control: ['cutoff_freq', 'q'],
  }
];
const drawFunctions = [drawImpulseResponse, drawFrequencyResponse, drawPhaseResponse];
const signalFunctions = [
  {
    func: (freq, samplingRate, time, sw) => Math.random() * 2 - 1,
    control: [],
  },
  {
    func: (freq, samplingRate, time, sw) => Math.sin(2.0 * Math.PI * freq * time),
    control: ['input_freq'],
  },
  {
    func: (freq, samplingRate, time, sw) => (2.0 * Math.PI * freq * time) % (2.0 * Math.PI) < Math.PI ? 1.0 : -1.0,
    control: ['input_freq'],
  },
  {
    func: (freq, samplingRate, time, sw) => {
      const x = (2.0 * Math.PI * freq * time) % (2.0 * Math.PI);
      return x < Math.PI ? x / Math.PI : x / Math.PI - 2.0;
    },
    control: ['input_freq'],
  },
  {
    func: (freq, samplingRate, time, sw) => 1.0 - Math.abs(((4.0 * freq * time) % 4.0) - 2.0),
    control: ['input_freq'],
  },
  {
    func: (freq, samplingRate, time, sw) => Math.sin(2.0 * Math.PI * (((sw * 0.125 * samplingRate) * time) % (samplingRate)) * time),
    control: ['input_sweep_speed'],
  },
];

const filterCalc = new Calc();
let resultCoefficients = [1, 0, 0, 0, 0];
let currentDrawFunc = 1;

function updateFilterControl(filter) {
  // enable
  filterControls.filter(x => filter.control.some(y => x == y))
    .forEach(c => $(`#${c}`).removeAttr('disabled').parents('.control-row').removeClass('disabled'));

  // disable
  filterControls.filter(x => !filter.control.some(y => x == y))
    .forEach(c => $(`#${c}`).attr('disabled', 'true').parents('.control-row').addClass('disabled'));
}

function updateInputControl(inputSingnal) {
  // enable
  inputControls.filter(x => inputSingnal.control.some(y => x == y))
    .forEach(c => $(`#${c}`).removeAttr('disabled').parents('.control-row').removeClass('disabled'));

  // disable
  inputControls.filter(x => !inputSingnal.control.some(y => x == y))
    .forEach(c => $(`#${c}`).attr('disabled', 'true').parents('.control-row').addClass('disabled'));
}

function updateFilter() {
  const filterType = Number($('#filter_type').val());
  const parameters = {
    cutoff: $('#cutoff_freq').val(),
    q: Math.pow(2, $('#q').val()),
    bandwidth: $('#bandwidth').val(),
    gain: $('#gain').val(),
    samplingRate: $('#sampling_rate').val(),
  };
  updateFilterControl(filters[filterType]);
  resultCoefficients = filters[filterType].func(parameters);
  const coefficients = Coefficients.normalize(resultCoefficients);
  filterCalc.setCoefficients(coefficients);
  filterCalc.reset();

  // diagram
  const diagram = $($('.diagram')[0].contentDocument);
  diagramAssign.forEach((a, i) => $(a, diagram).text(`${coefficients[i].toFixed(9)}`));

  // impulse response
  updateResponse(coefficients, parameters);
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

$(() => {
  $('.modal-coefficients input[type=radio]').on('change', e => $('#coefficients_output').val(generateCoefficientsOutput()));

  new BootstrapMenu('.diagram-clicker', {
    actions: [{
      name: language.copyingCoefficients,
      onClick: () => {
        $('#coefficients_output').val(generateCoefficientsOutput());
        $('#coefficient_modal').modal();
      }
    }]
  });

  new BootstrapMenu('#response', {
    actions: [{
      name: language.impulseResponse,
      onClick: () => {
        currentDrawFunc = 0;
        updateFilter();
      }
    },
    {
      name: language.frequencyResponse,
      onClick: () => {
        currentDrawFunc = 1;
        updateFilter();
      }
    },
    {
      name: language.phaseResponse,
      onClick: () => {
        currentDrawFunc = 2;
        updateFilter();
      }
    }]
  });

  $('#cutoff_freq').on('input', e => $('#cutoff_freq_value').text(`${$(e.target).val().withCommas()} Hz`));
  $('#q').on('input', e => $('#q_value').text(`${Math.pow(2, $(e.target).val()).toFixed(9)}`));
  $('#bandwidth').on('input', e => $('#bandwidth_value').text(`${Number($(e.target).val()).toFixed(1)} oct`));
  $('#gain').on('input', e => $('#gain_value').text(`${Number($(e.target).val()).toFixed(1)} dB`));
  $('#sampling_rate').on('input', e => {
    const value = $(e.target).val();
    const max_value = ((value / 2) | 0) - 1;
    const cutoff = $('#cutoff_freq').attr('max', max_value).val();
    const input = $('#input_freq').attr('max', max_value).val();
    $('#sampling_rate_value').text(`${value.withCommas()} Hz`);

    if (cutoff >= max_value) {
      $('#cutoff_freq').val(max_value);
      $('#cutoff_freq_value').text(`${max_value.withCommas()} Hz`);
    }

    if (input >= max_value) {
      $('#input_freq').val(max_value);
      $('#input_freq_value').text(`${max_value.withCommas()} Hz`);
    }
  });
  $('.control-col input[type=range], .control-col select').on('input', updateFilter);

  $('#input_volume').on('input', e => $('#input_volume_value').text(`${($(e.target).val() * 100).toFixed(0)} %`));
  $('#input_freq').on('input', e => $('#input_freq_value').text(`${$(e.target).val().withCommas()} Hz`));
  $('#input_sweep_speed').on('input', e => $('#input_sweep_speed_value').text(Number($(e.target).val()).toFixed(2)));
  $('#input_waveform').on('input', e => updateInputControl(signalFunctions[Number($(e.target).val())]));
  updateInputControl(signalFunctions[Number($('#input_waveform').val())]);

  {
    let audioContext = null;
    let node = null;
    const samplingRate = Number($('#sampling_rate').val());
    let time = 0.0;

    $('#sound_playing').on('change', e => {
      if ($(e.target).is(':checked')) {
        audioContext = new AudioContext();
        node = audioContext.createScriptProcessor(4096, 1, 1);
        $('#sampling_rate').attr('disabled', 'true').attr('max', audioContext.sampleRate).val(audioContext.sampleRate).parents('.control-row').addClass('disabled');
        $('#sampling_rate_value').text(`${audioContext.sampleRate.withCommas()} Hz`);

        node.onaudioprocess = e => {
          const signal = e.outputBuffer.getChannelData(0);
          const volume = Number($('#input_volume').val()) * ($('#sound_playing').is(':checked') ? 1.0 : 0.0);
          const freq = Number($('#input_freq').val());
          const sweepSpeed = Number($('#input_sweep_speed').val());
          const func = signalFunctions[Number($('#input_waveform').val())].func;

          for (let i = 0; i < signal.length; i++) {
            signal[i] = func(freq, samplingRate, time, sweepSpeed) * volume;
            time += 1.0 / samplingRate;
          }

          filterCalc.process(signal);
        };

        node.connect(audioContext.destination);
      }
      else {
        $('#sampling_rate').removeAttr('disabled').parents('.control-row').removeClass('disabled');
        node.disconnect();
        node.onaudioprocess = null;
      }
    });
  }

  $('.diagram').on('load', updateFilter);

  $('.reference-link').on('click', e => $('#reference_modal').modal());
});
