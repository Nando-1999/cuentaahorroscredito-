function aplicarPermisos() {
    // 1. Obtener los permisos del localStorage (guardados al hacer login)
    const permisosStr = localStorage.getItem('permisos');
    const role = localStorage.getItem('role');

    if (!permisosStr) {
        console.warn("No se encontraron permisos. Redirigiendo al login...");
        window.location.href = 'index.html';
        return;
    }

    const permisos = JSON.parse(permisosStr);

    // Si es admin, no ocultamos nada, tiene pase libre
    if (role === 'admin') return;

    // 2. Diccionario de IDs de tu Sidebar vs Permisos de la BD
    // Asegúrate de que en tu HTML los <li> o <a> tengan estos IDs exactos
    const mapeoPermisos = {
        'nav-ventas': permisos.ventas,
        'nav-compras': permisos.compras,
        'nav-bancos': permisos.bancos,
        'nav-diario': permisos.diario,
        'nav-reportes': permisos.reportes,
        'nav-usuarios': permisos.usuarios
    };

    // 3. Ocultar los elementos que tengan valor 0
    Object.keys(mapeoPermisos).forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento && mapeoPermisos[id] === 0) {
            elemento.style.display = 'none'; // O usar elemento.remove() para más seguridad
        }
    });
}

// Se ejecuta automáticamente al cargar cualquier página
document.addEventListener('DOMContentLoaded', aplicarPermisos);