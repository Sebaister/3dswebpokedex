var pokedata = [];
var typeData = {};

// Cargar los datos de los Pokémon y los tipos
function cargarDatos() {
    // Modificar la carga de datos para ser más compatible
    var xhr1 = new XMLHttpRequest();
    xhr1.open("GET", "pokedata.json", false); // Cambiar a síncrono para mejor compatibilidad
    xhr1.onreadystatechange = function() {
        if (xhr1.readyState == 4) {
            if (xhr1.status == 200) {
                try {
                    pokedata = eval('(' + xhr1.responseText + ')'); // Usar eval para mejor compatibilidad
                } catch(e) {
                    alert("Error al cargar datos de Pokémon");
                }
            }
        }
    };
    xhr1.send(null);
    
    var xhr2 = new XMLHttpRequest();
    xhr2.open("GET", "types.json", false); // Cambiar a síncrono
    xhr2.onreadystatechange = function() {
        if (xhr2.readyState == 4) {
            if (xhr2.status == 200) {
                try {
                    typeData = eval('(' + xhr2.responseText + ')'); // Usar eval para mejor compatibilidad
                } catch(e) {
                    alert("Error al cargar datos de tipos");
                }
            }
        }
    };
    xhr2.send(null);
}

function traducirEstadisticas(stat) {
    var traducciones = {
        "hp": "PS",
        "attack": "Ataque",
        "defense": "Defensa",
        "special-attack": "Ataque Especial",
        "special-defense": "Defensa Especial",
        "speed": "Velocidad"
    };
    return traducciones[stat] || stat;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function determinarGeneracion(id) {
    if (id >= 1 && id <= 151) return "1gen";
    else if (id >= 152 && id <= 251) return "2gen";
    else if (id >= 252 && id <= 386) return "3gen";
    else if (id >= 387 && id <= 493) return "4gen";
    else if (id >= 494 && id <= 649) return "5gen";
    else if (id >= 650 && id <= 721) return "6gen";
    else if (id >= 722 && id <= 809) return "7gen";
    else if (id >= 810 && id <= 898) return "8gen";
    else if (id >= 899 && id <= 1025) return "9gen";
    else return "unknown";
}

function calcularInteracciones(tipos) {
    if (!typeData.gen1 || tipos.length === 0) return null;
    
    // Determinar la generación basada en los tipos
    var gen = 'gen6'; // Por defecto usamos la última gen para cálculos más precisos
    
    // Si es tipo Hada o tiene Hada como segundo tipo, usamos gen6
    if (tipos.includes('hada')) {
        gen = 'gen6';
    }
    // Si tiene Acero o Siniestro y no tiene Hada, usamos gen2
    else if (tipos.includes('acero') || tipos.includes('siniestro')) {
        gen = 'gen2';
    }
    // Si solo tiene tipos de gen1, usamos gen1
    else if (tipos.every(tipo => !['acero', 'siniestro', 'hada'].includes(tipo))) {
        gen = 'gen1';
    }
    
    if (tipos.length > 1) {
        gen = 'gen2';
    } else {
        if (tipos[0] === 'hada') gen = 'gen6';
        else if (tipos[0] === 'acero' || tipos[0] === 'siniestro') gen = 'gen2';
    }
    
    var resultado = {
        weak: {},
        resist: {},
        strong: {},
        immune: []
    };
    
    for (var i = 0; i < tipos.length; i++) {
        var tipo = tipos[i].toLowerCase();
        if (!typeData[gen] || !typeData[gen][tipo]) continue;
        var data = typeData[gen][tipo];
        
        if (data.weak) {
            for (var j = 0; j < data.weak.length; j++) {
                var weakType = data.weak[j];
                resultado.weak[weakType] = (resultado.weak[weakType] || 0) + 1;
            }
        }
        
        if (data.resist) {
            for (var j = 0; j < data.resist.length; j++) {
                var resistType = data.resist[j];
                resultado.resist[resistType] = (resultado.resist[resistType] || 0) + 1;
            }
        }
        
        if (data.strong) {
            for (var j = 0; j < data.strong.length; j++) {
                var strongType = data.strong[j];
                resultado.strong[strongType] = (resultado.strong[strongType] || 0) + 1;
            }
        }
        
        if (data.immune) {
            for (var j = 0; j < data.immune.length; j++) {
                var immuneType = data.immune[j];
                if (resultado.immune.indexOf(immuneType) === -1) {
                    resultado.immune.push(immuneType);
                }
            }
        }
    }
    
    for (var type in resultado.weak) {
        if (resultado.resist[type]) {
            if (resultado.weak[type] === resultado.resist[type]) {
                delete resultado.weak[type];
                delete resultado.resist[type];
            }
        }
    }
    
    return resultado;
}

function mostrarDetallesTipos(tipos) {
    var detailsContainer = document.getElementById('typeDetails');
    if (!tipos || tipos.length === 0 || !typeData.gen1) {
        detailsContainer.style.display = 'none';
        return;
    }
    
    var interacciones = calcularInteracciones(tipos);
    if (!interacciones) {
        detailsContainer.style.display = 'none';
        return;
    }
    
    var html = [];
    html.push('<div class="type-header">Interacciones de Tipo</div>');
    
    if (Object.keys(interacciones.weak).length > 0) {
        html.push('<div class="type-section"><strong>Débil contra:</strong><div class="type-list">');
        for (var type in interacciones.weak) {
            var multiplier = interacciones.weak[type] > 1 ? ' (x4)' : ' (x2)';
            html.push('<div class="type-tag weak ' + type + '">' + resolveElectricAndPsychicTypes(capitalizeFirstLetter(type)) + multiplier + '</div>');
        }
        html.push('</div></div>');
    }
    
    if (Object.keys(interacciones.resist).length > 0) {
        html.push('<div class="type-section"><strong>Resistente a:</strong><div class="type-list">');
        for (var type in interacciones.resist) {
            var multiplier = interacciones.resist[type] > 1 ? ' (x1/4)' : ' (x1/2)';
            html.push('<div class="type-tag resist ' + type + '">' + resolveElectricAndPsychicTypes(capitalizeFirstLetter(type)) + multiplier + '</div>');
        }
        html.push('</div></div>');
    }
    
    if (interacciones.immune.length > 0) {
        html.push('<div class="type-section"><strong>Inmune a:</strong><div class="type-list">');
        for (var i = 0; i < interacciones.immune.length; i++) {
            var immuneType = interacciones.immune[i];
            html.push('<div class="type-tag immune ' + immuneType + '">' + resolveElectricAndPsychicTypes(capitalizeFirstLetter(immuneType)) + '</div>');
        }
        html.push('</div></div>');
    }
    
    if (Object.keys(interacciones.strong).length > 0) {
        html.push('<div class="type-section"><strong>Fuerte contra:</strong><div class="type-list">');
        for (var type in interacciones.strong) {
            html.push('<div class="type-tag strong ' + type + '">' + resolveElectricAndPsychicTypes(capitalizeFirstLetter(type)) + '</div>');
        }
        html.push('</div></div>');
    }
    
    detailsContainer.innerHTML = html.join('');
    detailsContainer.style.display = 'block';
}

function resolveElectricAndPsychicTypes(type) {
    if(type === "Electrico") {
        return "Eléctrico";
    } 
    if(type === "Psiquico") {
        return "Psíquico";
    }
    return type; // Simplificado el else
}

// Modificar la función buscar para ser más compatible
function buscar() {
    if (!pokedata || pokedata.length === 0) {
        alert("Datos no cargados. Por favor, espere.");
        return;
    }

    var input = document.getElementById("pokeInput");
    if (!input) return;
    
    input = input.value;
    if (!input) {
        alert("Por favor ingrese un nombre o número");
        return;
    }
    
    input = input.toString().trim().toLowerCase();
    
    // Optimizar la manipulación del DOM agrupando las referencias
    var elementos = {
        img: document.getElementById("pokeImg"),
        info: document.getElementById("pokeInfo"),
        resultado: document.getElementById("resultado"),
        pokeName: document.getElementById("pokeName")
    };
    
    if (!elementos.img || !elementos.info || !elementos.resultado || !elementos.pokeName) return;
    
    var pokemon = null;
    
    // Optimizar la búsqueda
    if (!isNaN(input)) {
        pokemon = pokedata.find(function(p) { return p.id === parseInt(input); });
    } else {
        pokemon = pokedata.find(function(p) { return p.nombre.toLowerCase() === input; });
    }
    
    if (pokemon) {
        var genFolder = determinarGeneracion(pokemon.id);
        elementos.img.src = "sprites/" + genFolder + "/" + pokemon.id + ".png";
        
        elementos.img.onerror = function() {
            this.src = "sprites/MissingNo.png";
        };
    
        elementos.pokeName.innerHTML = pokemon.id + ". " + pokemon.nombre;
    
        // Construir HTML en un solo string para mejor rendimiento
        var html = ["<b>Tipos:</b> "];
        var tipos = pokemon.tipos.map(function(tipo) {
            tipo = tipo.toLowerCase();
            html.push('<span class="type-btn ' + tipo + '">' + resolveElectricAndPsychicTypes(tipo) + '</span> ');
            return tipo;
        });
    
        html.push("<br><a id='tablaTiposBtn' href='index.html'>Revisar tabla de tipos</a><br><br>");
        html.push("<b>Estadísticas:</b><br>");
        
        for (var stat in pokemon.stats) {
            html.push(traducirEstadisticas(stat) + ": " + pokemon.stats[stat] + "<br>");
        }
    
        if (pokemon.evolucion.length > 0) {
            var evo = pokemon.evolucion[0];
            html.push("<br><b>Evoluciona a:</b> " + evo.b + "<br>");
            html.push("<b>Condiciones:</b><br>");
            evo.condiciones.forEach(function(condicion) {
                html.push("- " + condicion + "<br>");
            });
        } else {
            html.push("<br><b>Sin evoluciones.</b>");
        }
    
        elementos.info.innerHTML = html.join("");
        elementos.resultado.style.display = "block";
        
        mostrarDetallesTipos(tipos);
    } else {
        alert("Pokémon no encontrado.");
    }
}

// Modificar el evento de carga
if (window.addEventListener) {
    window.addEventListener('load', cargarDatos, false);
} else if (window.attachEvent) {
    window.attachEvent('onload', cargarDatos);
} else {
    window.onload = cargarDatos;
}