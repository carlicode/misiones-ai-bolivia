const app = require('./app');

const puerto = process.env.PORT || 3002;

app.listen(puerto, () => {
  console.log(`API local en http://localhost:${puerto}`);
});
