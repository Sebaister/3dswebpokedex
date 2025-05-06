// Función para mostrar el tipo seleccionado (original)
function showType(typeId) {
    // Oculta todos los detalles primero
    var details = document.getElementsByClassName('type-detail');
    for (var i = 0; i < details.length; i++) {
        details[i].style.display = 'none';
    }
    
    // Muestra el seleccionado
    var element = document.getElementById(typeId);
    if (element) {
        element.style.display = 'block';
        element.scrollIntoView();
    }
}

// Función para capitalizar (nueva)
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Función para crear botones (adaptada)
function createTypeButtons(genId, types) {
    var container = document.getElementById(genId + '-types');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (var i = 0; i < types.length; i++) {
        var type = types[i];
        var button = document.createElement('button');
        button.className = 'type-btn ' + type;
        button.textContent = capitalizeFirstLetter(type);
        button.onclick = function(t) {
            return function() {
                showType(genId + '-' + t);
            };
        }(type);
        container.appendChild(button);
    }
}

// Función para crear detalles (adaptada)
function createTypeDetails(genId, typeData) {
    var container = document.getElementById(genId + '-details');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (var type in typeData) {
        if (typeData.hasOwnProperty(type)) {
            var data = typeData[type];
            var detailDiv = document.createElement('div');
            detailDiv.id = genId + '-' + type;
            detailDiv.className = 'type-detail';
            detailDiv.style.display = 'none';
            
            var html = '<div class="type-header ' + type + '">' + capitalizeFirstLetter(type) + '</div>';
            
            if (data.weak) {
                html += '<div class="type-section"><strong>Débil contra:</strong><div class="type-list">';
                for (var j = 0; j < data.weak.length; j++) {
                    html += '<div class="type-tag weak ' + data.weak[j] + '">' + capitalizeFirstLetter(data.weak[j]) + '</div>';
                }
                html += '</div></div>';
            }
            
            if (data.resist) {
                html += '<div class="type-section"><strong>Resistente a:</strong><div class="type-list">';
                for (var j = 0; j < data.resist.length; j++) {
                    html += '<div class="type-tag resist ' + data.resist[j] + '">' + capitalizeFirstLetter(data.resist[j]) + '</div>';
                }
                html += '</div></div>';
            }
            
            if (data.strong) {
                html += '<div class="type-section"><strong>Fuerte contra:</strong><div class="type-list">';
                for (var j = 0; j < data.strong.length; j++) {
                    html += '<div class="type-tag strong ' + data.strong[j] + '">' + capitalizeFirstLetter(data.strong[j]) + '</div>';
                }
                html += '</div></div>';
            }
            
            if (data.immune) {
                html += '<div class="type-section"><strong>Inmune a:</strong><div class="type-list">';
                for (var j = 0; j < data.immune.length; j++) {
                    html += '<div class="type-tag immune ' + data.immune[j] + '">' + capitalizeFirstLetter(data.immune[j]) + '</div>';
                }
                html += '</div></div>';
            }
            
            if (data.note) {
                html += '<div class="note">' + data.note + '</div>';
            }
            
            detailDiv.innerHTML = html;
            container.appendChild(detailDiv);
        }
    }
}

// Función para cargar datos (optimizada para 3DS)
function loadData() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'types.json', true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    
                    // Generación 1
                    var gen1Types = Object.keys(data.gen1 || {});
                    createTypeButtons('gen1', gen1Types);
                    createTypeDetails('gen1', data.gen1);
                    
                    // Generación 2-5
                    var gen2Types = Object.keys(data.gen2 || {});
                    createTypeButtons('gen2', gen2Types);
                    createTypeDetails('gen2', data.gen2);
                    
                    // Generación 6+
                    var gen6Types = Object.keys(data.gen6 || {});
                    createTypeButtons('gen6', gen6Types);
                    createTypeDetails('gen6', data.gen6);
                } catch (e) {
                    console.error('Error al procesar los datos:', e);
                    mostrarError('Error al cargar los datos');
                }
            } else {
                mostrarError('Error al cargar los datos');
            }
        }
    };
    xhr.onerror = function() {
        mostrarError('Error de conexión');
    };
    xhr.send();
}

// Función para mostrar errores de manera amigable
function mostrarError(mensaje) {
    var containers = ['gen1-types', 'gen2-types', 'gen6-types'];
    containers.forEach(function(id) {
        var container = document.getElementById(id);
        if (container) {
            container.innerHTML = '<div class="error">' + mensaje + '</div>';
        }
    });
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadData);
} else {
    loadData();
}
