# Changelog

Aqui estaremos informando todas las actualizacions/fixes/features/refactors que se vayan haciendo en el backend de TaskManager

### 2024-07-25
### Added
- Endpoint para obtener perfil del usuario a raiz del token o id.
- Definicion de campos privados y publicos para el modelo de usuarios.
- Endpoint para actualizar el perfil del usuario.
- Endpoint para cancelacion de la tarea.
- Endpoint para listado de solicitudes de tareas (supervisor).
- Endpooint para cargar imagenes.

### Changed
- Redefinicion del modelo de usuarios.
- Garantizar que un usuario deshabiltiado no puede acceder a ningun endpoint y recibe 403.
- Endpoint para crear tareas, se quito las imagenes. Desde ahora es necesario primero guardar la imagen y luego enviarla en una lista de strings.

### Fixed
- Paginacion para el endpoint de tareas.
- Update status para solicitud de tareas.