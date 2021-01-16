var axios = require('axios');
const { response } = require('express');
var luxon = require('luxon');
const DateTime = luxon.DateTime;

var sendJsonResponse = function (res, status, content) {
    res.status(status);
    res.json(content);
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
            console.log(now);
            if (data.status === 200) {
                var data = data.data.veiculos;

                ida = []
                volta = []

                data.forEach(e => {
                   var x = now - e.dataHora;
                   if(x < 90000){
                       e.trajeto = e.trajeto.replace(e.linha, "")
                       .replace("-", "")
                       .replace("–", "")
                       .replace(e.sentido, "")
                       .trim();

                       if(e.trajeto !== '31 de Outubro'){
                           e.trajeto =  e.trajeto.replace(/[0-9]/g, "").trim();
                       }

                       if(e.sentido === 'ida'){
                           ida.push(e.trajeto);
                       }else{
                           volta.push(e.trajeto)
                       }
                   }
                });

                var auxIda = []

                ida.forEach(x =>{
                    index = auxIda.indexOf(x);
                    if(index === -1){
                        auxIda.push(x);
                    }
                })

                var auxVolta = []

                volta.forEach(x =>{
                    index = auxVolta.indexOf(x);
                    if(index === -1){
                        auxVolta.push(x);
                    }
                })

                var response = [];

                auxIda.forEach(x => {
                    if(x.length > 0){
                        response.push({trajeto: x, sentido: 'ida'})
                    }
                    
                })

                auxVolta.forEach(x => {
                    if(x.length > 0){
                        response.push({trajeto: x, sentido: 'volta'})
                    }
                })

                sendJsonResponse(res, 200, response.sort(compara));

            } else {
                sendJsonResponse(res, 401, { Erro: "vazio" })
            }

        });
}