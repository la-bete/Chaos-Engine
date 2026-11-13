// Prints Jest's coverage totals as a Markdown table, for the CI job summary.
// Run after `npm test` (which writes coverage/coverage-summary.json).
const { total } = require('../coverage/coverage-summary.json');

const rows = ['statements', 'branches', 'functions', 'lines'].map(key => {
	const { pct, covered, total: count } = total[key];
	return `| ${key[0].toUpperCase() + key.slice(1)} | ${pct}% | ${covered} of ${count} |`;
});

console.log(['### Coverage', '', '| | Covered | |', '| --- | --- | --- |', ...rows].join('\n'));
