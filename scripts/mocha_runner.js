require('babel-core/register');
require('babel-polyfill');

process.mocha = true;
process.on('unhandledRejection', function (error) {
  console.error('Unhandled Promise Rejection:');
  console.error(error && error.stack || error);
});
