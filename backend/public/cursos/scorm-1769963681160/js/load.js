//Pruebas
var folder = 'https://cloud.qurseo.com/datos/0000comunes/comunes_v11/';
//Publico
//var folder = 'https://cloud.qurseo.com/datos/0000comunes/comunes_v11/';
var version = "11";

/* --------------------------------------------------------------------------- 
    REDIRECCIÓN DE LAS RUTAS PARA LA PLANTILLA Y LAS ACTIVIDADES
--------------------------------------------------------------------------- */
var url_dinamic = folder + 'js/loadDinamic.js';
var url_load = folder + 'js/carga.js';

function loadScripts(array, callback) {
    var loader = function(src, handler) {
        var script = document.createElement("script");
        script.src = src;
        script.onload = script.onreadystatechange = function() {
            script.onreadystatechange = script.onload = null;
            handler();
        };
        var head = document.getElementsByTagName("head")[0];
        (head || document.body).appendChild(script);
    };
    (function() {
        if (array.length !== 0) {
            loader(array.shift(), arguments.callee);
        } else {
            callback && callback();
        }
    })();
}

loadScripts([url_dinamic], function() {
    loadScripts([url_load]);
});
