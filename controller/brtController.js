const axios = require('axios');
const Q = require('q');

const { response } = require('express');
var luxon = require('luxon');
const DateTime = luxon.DateTime;
const key = 'AIzaSyAquGtc--3ffXJEB9UykQs65YcPWhouz1Q';

var sendJsonResponse = function (res, status, content) {
    res.status(status);
    res.json(content);
}

const GOOGLE = async (urls, latOrigem, lngOrigem, latDestino, lngDestino) => {
    var deferred = Q.defer();
    const tamanho = urls.length;
    var arr = [];
    count = 1;

    for (const url of urls) {
        const todo = await axios.get(url.url);
        var e = todo.data.rows[0].elements;
        var distance = parseInt(e[0].distance.text.replace('km', ''));
        var duration = parseInt(e[0].duration.text.replace('mins', ''));
        var obj = {
            distancia: distance,
            tempo: duration,
            latOrigem: parseFloat(url.latOrigem),
            lngOrigem: parseFloat(url.lngOrigem),
            latDestino: url.latitude,
            lngDestino: url.longitude
        }
        arr.push(obj);

        if (count === tamanho) {
            var minTempo = [];

            arr.forEach(x => {
                minTempo.push(x.tempo);
            })

            var minValTempo = Math.min(...minTempo);

            arr = arr.filter(x => x.tempo === minValTempo);

            var minDistancia = [];

            arr.forEach(x => {
                minDistancia.push(x.distancia);
            })

            var minValDistancia = Math.min(...minDistancia);

            arr.filter(x => x.distancia === minValDistancia);
            deferred.resolve(arr);
        }
        count++;
    }

    return deferred.promise;
}

const compara = (a, b) => {
    if (a.trajeto < b.trajeto) {
        return -1;
    }

    if (a.trajeto > b.trajeto) {
        return 1;
    }

    return 0
}


module.exports.buscar = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    axios.get('http://webapibrt.rio.rj.gov.br/api/v1/brt')
        .then(data => {
            const DateTime = luxon.DateTime;
            const now = DateTime.local().toMillis();
            if (data.status === 200) {
                var data = data.data.veiculos;

                ida = []
                volta = []

                data.forEach(e => {
                    var x = now - e.dataHora;
                    if (x < 600000) {
                        e.trajeto = e.trajeto.replace(e.linha, "")
                            .replace("-", "")
                            .replace("–", "")
                            .replace(e.sentido, "")
                            .trim();

                        if (e.trajeto !== '31 de Outubro') {
                            e.trajeto = e.trajeto.replace(/[0-9]/g, "").trim();
                        }

                        if (e.sentido === 'ida') {
                            ida.push(e.trajeto);
                        } else {
                            volta.push(e.trajeto)
                        }
                    }
                });

                var auxIda = []

                ida.forEach(x => {
                    index = auxIda.indexOf(x);
                    if (index === -1) {
                        auxIda.push(x);
                    }
                })

                var auxVolta = []

                volta.forEach(x => {
                    index = auxVolta.indexOf(x);
                    if (index === -1) {
                        auxVolta.push(x);
                    }
                })

                var response = [];

                auxIda.forEach(x => {
                    if (x.length > 0) {
                        response.push({ trajeto: x, sentido: 'ida' })
                    }

                })

                auxVolta.forEach(x => {
                    if (x.length > 0) {
                        response.push({ trajeto: x, sentido: 'volta' })
                    }
                })

                sendJsonResponse(res, 200, response.sort(compara));

            } else {
                sendJsonResponse(res, 401, { Erro: "vazio" })
            }

        });
}

module.exports.pegaVeiculo = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    console.log(req.body);

    axios.get('http://webapibrt.rio.rj.gov.br/api/v1/brt')
        .then(data => {
            const DateTime = luxon.DateTime;
            const now = DateTime.local().toMillis();

            if (data.status === 200) {
                var data = data.data.veiculos;

                var aux = [];

                var str = req.body.linha;
                var sentido = req.body.sentido;

                data.forEach(t => {
                    var index = t.trajeto.indexOf(str);
                    var time = now - t.dataHora;
                    if (time < 60000) {
                        if (index !== -1) {
                            aux.push(t);
                        }
                    }
                })

                aux = aux.filter(x => x.sentido = sentido);

                var urls = [];

                aux.forEach(x => {
                    x.latOrigem = req.body.latOrigem;
                    x.lngOrigem = req.body.lngOrigem;
                    x.url = 'https://maps.googleapis.com/maps/api/distancematrix/json?origins=' + x.latOrigem + ',' + x.lngOrigem + '&destinations=' + x.latitude + ',' + x.longitude + '&key=' + key
                    urls.push(x);
                })

                const resp = GOOGLE(urls);
                resp.then(d => {
                    sendJsonResponse(res, 200, d);
                })
               

            } else {
                sendJsonResponse(res, 401, { Erro: "vazio" })
            }

        });
}