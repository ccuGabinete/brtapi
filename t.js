var luxon = require('luxon');
const c = console.log;


const DateTime = luxon.DateTime;
const now = DateTime.local().toMillis()

// var dt = DateTime.fromMillis(1610766178000);
c(now);