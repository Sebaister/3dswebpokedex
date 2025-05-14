var pokedata = [];
var typeData = {};

function cargarDatos() {
    try {
        var xhr1 = new XMLHttpRequest();
        xhr1.open("GET", "pokedata.json", false); // Síncrono para 3DS
        xhr1.send(null);
        
        if (xhr1.status === 200) {
            try {
                // Usar eval en lugar de JSON.parse para mejor compatibilidad
                pokedata = eval('(' + xhr1.responseText + ')');
            } catch(e) {
                alert("Error al procesar datos de Pokémon");
                return;
            }
        } else {
            alert("Error al cargar pokedata.json");
            return;
        }
        
        var xhr2 = new XMLHttpRequest();
        xhr2.open("GET", "types.json", false);
        xhr2.send(null);
        
        if (xhr2.status === 200) {
            try {
                typeData = eval('(' + xhr2.responseText + ')');
            } catch(e) {
                alert("Error al procesar datos de tipos");
                return;
            }
        } else {
            alert("Error al cargar types.json");
            return;
        }
    } catch(e) {
        alert("Error de conexión");
        return;
    }
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
    if (!typeData.gen1 || !tipos || tipos.length === 0) return null;
    
    var gen = 'gen6';
    
    // Reemplazar includes y every por bucles for tradicionales
    var tieneHada = false;
    var tieneAceroOSiniestro = false;
    var todosTiposGen1 = true;
    
    for (var i = 0; i < tipos.length; i++) {
        if (tipos[i] === 'hada') {
            tieneHada = true;
        }
        if (tipos[i] === 'acero' || tipos[i] === 'siniestro') {
            tieneAceroOSiniestro = true;
        }
        if (tipos[i] === 'acero' || tipos[i] === 'siniestro' || tipos[i] === 'hada') {
            todosTiposGen1 = false;
        }
    }
    
    if (tieneHada) {
        gen = 'gen6';
    } else if (tieneAceroOSiniestro) {
        gen = 'gen2';
    } else if (todosTiposGen1) {
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
        
        // Normalizar tipos con acento para la búsqueda en typeData
        if (tipo === 'dragón') tipo = 'dragon';
        if (tipo === 'eléctrico') tipo = 'electrico';
        if (tipo === 'psíquico') tipo = 'psiquico';
        
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
            html.push('<div class="type-tag weak ' + type + '">' + formatearNombresTipos(capitalizeFirstLetter(type)) + multiplier + '</div>');
        }
        html.push('</div></div>');
    }
    
    if (Object.keys(interacciones.resist).length > 0) {
        html.push('<div class="type-section"><strong>Resistente a:</strong><div class="type-list">');
        for (var type in interacciones.resist) {
            var multiplier = interacciones.resist[type] > 1 ? ' (x1/4)' : ' (x1/2)';
            html.push('<div class="type-tag resist ' + type + '">' + formatearNombresTipos(capitalizeFirstLetter(type)) + multiplier + '</div>');
        }
        html.push('</div></div>');
    }
    
    if (interacciones.immune.length > 0) {
        html.push('<div class="type-section"><strong>Inmune a:</strong><div class="type-list">');
        for (var i = 0; i < interacciones.immune.length; i++) {
            var immuneType = interacciones.immune[i];
            html.push('<div class="type-tag immune ' + immuneType + '">' + formatearNombresTipos(capitalizeFirstLetter(immuneType)) + '</div>');
        }
        html.push('</div></div>');
    }
    
    if (Object.keys(interacciones.strong).length > 0) {
        html.push('<div class="type-section"><strong>Fuerte contra:</strong><div class="type-list">');
        for (var type in interacciones.strong) {
            html.push('<div class="type-tag strong ' + type + '">' + formatearNombresTipos(capitalizeFirstLetter(type)) + '</div>');
        }
        html.push('</div></div>');
    }
    
    detailsContainer.innerHTML = html.join('');
    detailsContainer.style.display = 'block';
}

function formatearNombresTipos(type) {
    // Primero normalizamos el tipo a minúsculas
    var typeLower = type.toLowerCase();
    
    // Casos especiales para tipos sin acento
    if(typeLower === "electrico") {
        return "Eléctrico";
    } 
    if(typeLower === "psiquico") {
        return "Psíquico";
    }
    if(typeLower === "dragon") {
        return "Dragón";
    }
    
    // Casos especiales para tipos que ya vienen con acento
    if(typeLower === "dragón") {
        return "Dragón";
    }
    if(typeLower === "eléctrico") {
        return "Eléctrico";
    }
    if(typeLower === "psíquico") {
        return "Psíquico";
    }
    
    // Para cualquier otro tipo, capitalizamos la primera letra
    return type.charAt(0).toUpperCase() + type.slice(1);
}

function buscar() {
    try {
        if (!pokedata || !pokedata.length) {
            alert("No hay datos cargados");
            return;
        }

        var inputElement = document.getElementById("pokeInput");
        if (!inputElement) {
            alert("Error: No se encuentra el campo de búsqueda");
            return;
        }

        var searchValue = inputElement.value;
        if (!searchValue) {
            alert("Por favor ingrese un nombre o número");
            return;
        }
        searchValue = searchValue.toLowerCase().replace(/^\s+|\s+$/g, '');

        var pokemon = null;
        for (var i = 0; i < pokedata.length; i++) {
            if (!isNaN(searchValue) && pokedata[i].id === parseInt(searchValue, 10)) {
                pokemon = pokedata[i];
                break;
            } else if (pokedata[i].nombre.toLowerCase() === searchValue) {
                pokemon = pokedata[i];
                break;
            }
        }

        if (!pokemon) {
            alert("Pokémon no encontrado");
            return;
        }

        // Ocultar el logo cuando se encuentra un Pokémon
        var logoContainer = document.getElementById("logoContainer");
        if (logoContainer) {
            logoContainer.style.display = "none";
        }

        var resultadoElement = document.getElementById("resultado");
        var pokeImgElement = document.getElementById("pokeImg");
        var pokeNameElement = document.getElementById("pokeName");
        var pokeInfoElement = document.getElementById("pokeInfo");

        if (!resultadoElement || !pokeImgElement || !pokeNameElement || !pokeInfoElement) {
            alert("Error: Elementos no encontrados");
            return;
        }

        resultadoElement.style.display = "block";
        pokeImgElement.src = "sprites/" + determinarGeneracion(pokemon.id) + "/" + pokemon.id + ".png";
        pokeImgElement.onerror = function() {
            this.src = "sprites/MissingNo.png";
        };
        pokeNameElement.innerHTML = pokemon.id + ". " + pokemon.nombre;

        var infoHtml = "<b>Tipos:</b> ";
        var tipos = [];
        for (var i = 0; i < pokemon.tipos.length; i++) {
            var tipo = pokemon.tipos[i].toLowerCase();
            tipos.push(tipo);
            
            // Normalizar el tipo para la clase CSS
            var tipoClase = tipo;
            if (tipo === 'dragón') tipoClase = 'dragon';
            if (tipo === 'eléctrico') tipoClase = 'electrico';
            if (tipo === 'psíquico') tipoClase = 'psiquico';
            
            infoHtml += '<span class="type-btn ' + tipoClase + '">' + formatearNombresTipos(tipo) + '</span> ';
        }

        infoHtml += "<br><a href='index.html' class='table-button'>Revisar tabla de tipos</a><br>";
        infoHtml += "<b>Estadísticas:</b><br>";
        
        for (var stat in pokemon.stats) {
            infoHtml += traducirEstadisticas(stat) + ": " + pokemon.stats[stat] + "<br>";
        }

        if (pokemon.evolucion && pokemon.evolucion.length > 0) {
            var evo = pokemon.evolucion[0];
            infoHtml += "<br><b>Evoluciona a:</b> " + evo.b + "<br>";
            infoHtml += "<b>Condiciones:</b><br>";
            for (var i = 0; i < evo.condiciones.length; i++) {
                infoHtml += "- " + evo.condiciones[i] + "<br>";
            }
        } else {
            infoHtml += "<br><b>Sin evoluciones.</b>";
        }

        document.getElementById("pokeInfo").innerHTML = infoHtml;
        mostrarDetallesTipos(tipos);
    } catch(e) {
        alert("Error en la búsqueda");
    }
}

function navegarPokemon(direccion) {
    try {
        // Obtener el Pokémon actual
        var pokemonActual = null;
        var nombreElement = document.getElementById("pokeName");
        
        if (nombreElement && nombreElement.innerHTML) {
            // Extraer el número del Pokémon actual
            var idActual = parseInt(nombreElement.innerHTML.split(".")[0]);
            
            if (!isNaN(idActual)) {
                // Calcular el nuevo ID
                var nuevoId = idActual + direccion;
                
                // Asegurarse de que el ID esté dentro del rango válido
                if (nuevoId > 0 && nuevoId <= pokedata.length) {
                    // Buscar el Pokémon con el nuevo ID
                    document.getElementById("pokeInput").value = nuevoId;
                    buscar();
                }
            }
        } else {
            // Si no hay Pokémon mostrado, mostrar el primero o el último
            if (direccion > 0) {
                document.getElementById("pokeInput").value = "1";
            } else {
                document.getElementById("pokeInput").value = pokedata.length.toString();
            }
            buscar();
        }
    } catch(e) {
        alert("Error al navegar: " + e.message);
    }
}

// Código extraído del script en el HTML
// Asegurarnos de que los datos se carguen al inicio
window.onload = cargarDatos;

// Añadir manejo de teclas para navegación
document.addEventListener('keydown', function(event) {
    // Tecla izquierda
    if (event.keyCode === 37) {
        document.getElementById('prevPokemon').focus();
    }
    // Tecla derecha
    else if (event.keyCode === 39) {
        document.getElementById('nextPokemon').focus();
    }
    // Tecla A (generalmente es Enter en navegadores)
    else if (event.keyCode === 13 && document.activeElement.tagName === 'BUTTON') {
        document.activeElement.click();
    }
});