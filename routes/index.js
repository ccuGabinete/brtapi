var express = require('express');
var router = express.Router();
var brt = require('../controller/brtController');




/* GET home page. */
router.get('/', brt.buscar);
router.post('/veiculos', brt.pegaVeiculo)

module.exports = router;
