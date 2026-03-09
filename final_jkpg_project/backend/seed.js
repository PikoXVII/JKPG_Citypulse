require('dotenv').config();
const { bootstrap } = require('./bootstrap');

bootstrap()
  .then((result) => {
    console.log('Seed complete', result);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
