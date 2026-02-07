console.log('admin.js loaded');

const logEl = document.getElementById('log');
const log = (msg) => {
  logEl.textContent += msg + '\n';
};

document.getElementById('generate').addEventListener('click', () => {
  log('Kliknuo si na generate (još ništa ne radimo).');
});
