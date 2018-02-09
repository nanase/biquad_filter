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

function update_control(filter) {
  // enable
  filter_controls.filter(x => filter.control.some(y => x == y))
    .forEach(c => $(`#${c}`).removeAttr('disabled').parents('.control-row').removeClass('disabled'));

  // disable
  filter_controls.filter(x => !filter.control.some(y => x == y))
    .forEach(c => $(`#${c}`).attr('disabled', 'true').parents('.control-row').addClass('disabled'));
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
  const result = Coefficients.normalize(filters[filter_type].func(parameters));
  const diagram = $($('.diagram')[0].contentDocument);
  diagram_assign.forEach((a, i) => $(a, diagram).text(`${result[i].toFixed(9)}`));
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
