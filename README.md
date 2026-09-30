# Café de Barrio

Mini e-commerce de la actividad Fullstack: Spring Boot + PostgreSQL + Angular + Tailwind CSS. Incluye catálogo, filtros por categoría, detalle, carrito persistente, checkout sin pasarela de pago y administración de productos y pedidos.

## Requisitos

- Java 17 o superior. El proyecto compila para Java 17; también se verificó con Java 21.
- PostgreSQL y una base llamada `cafe_barrio_db`.
- Node **22.22.3+ en la rama 22**, **24.15.0+ en la rama 24**, o **26+**, según Angular 22. El Node 24.14.1 instalado originalmente es anterior al mínimo. El script `scripts/frontend.ps1` utiliza un Node compatible incluido en Codex si está disponible, sin modificar la instalación del sistema.
- Maven Wrapper incluido; no es necesario instalar Maven globalmente.

## Instalación desde cero

### 1. Instalar las herramientas

Instala un JDK 17 o superior, Node.js en una de las versiones compatibles indicadas arriba y PostgreSQL. npm viene incluido con Node.js. Abre una terminal nueva después de instalar las herramientas y comprueba:

```powershell
java -version
node --version
npm --version
```

Configura `JAVA_HOME` con la carpeta del JDK si Maven no encuentra Java. Para trabajar en otro equipo, instala Node.js directamente; no necesitas tener Codex instalado.

### 2. Instalar las dependencias de Angular y Tailwind

Abre PowerShell en la carpeta raíz del proyecto y ejecuta:

```powershell
cd frontend
npm ci
cd ..
```

`npm ci` utiliza `package-lock.json` para instalar las versiones del proyecto. Instala Angular, Angular CLI local, Tailwind CSS, PostCSS, TypeScript y las herramientas de pruebas. No necesitas instalar Angular CLI ni Tailwind globalmente, ni ejecutar `ng new`: el frontend ya está creado y configurado.

También puedes hacerlo desde la raíz con el script incluido:

```powershell
.\scripts\frontend.ps1 -Action Install
```

Necesitas acceso a Internet para descargar las dependencias. Si eliminaste `frontend/node_modules`, repite este paso. Conserva `package.json` y `package-lock.json`.

### 3. Preparar PostgreSQL

Inicia el servicio PostgreSQL. Desde la herramienta de consultas de pgAdmin, conectado al servidor y a una base existente como `postgres`, crea la base:

```sql
CREATE DATABASE cafe_barrio_db;
```

Si la base ya existe, omite el comando. Para una instalación nueva, utiliza una base vacía: Flyway creará las tablas y los productos iniciales al arrancar el backend. No necesitas ejecutar las migraciones manualmente.

En la terminal donde ejecutarás el backend, configura la conexión con las credenciales de tu PostgreSQL:

```powershell
$env:DB_URL='jdbc:postgresql://localhost:5432/cafe_barrio_db'
$env:DB_USER='postgres'
$env:DB_PASSWORD='tu-clave-de-postgresql'
```

Estas variables duran mientras esa terminal permanezca abierta. En otro equipo debes configurar tu propia conexión, porque `application-local.properties` no se comparte por Git. Para ejecutar desde IntelliJ, coloca las mismas variables en la configuración de ejecución.

### 4. Descargar las dependencias del backend

Desde la raíz del proyecto:

```powershell
.\mvnw.cmd -B -ntp dependency:go-offline
```

Maven Wrapper descarga Maven y las dependencias declaradas en `pom.xml`, incluyendo Spring Boot, Spring Security, JPA, Flyway y el controlador PostgreSQL. Este paso es opcional: el primer arranque también las descarga automáticamente. No necesitas Python para instalar ni ejecutar el proyecto.

### 5. Iniciar la aplicación

Sigue los comandos de la siguiente sección: primero el backend en la terminal con las variables de PostgreSQL y luego el frontend en una segunda terminal. Mantén ambas abiertas mientras uses la aplicación.

## Ejecutar en Windows

Desde la raíz, en una terminal:

```powershell
.\scripts\backend.ps1 -Demo
```

En otra terminal:

```powershell
.\scripts\frontend.ps1 -Action Start
```

Abre [http://127.0.0.1:4200](http://127.0.0.1:4200). El backend escucha en el puerto 8080. El script del frontend instala dependencias con `npm ci` si falta `node_modules`.

Para iniciar Angular sin el script, ejecuta `npm start` dentro de `frontend`. El proxy incluido conecta las llamadas `/api` con el backend; comprueba que el puerto 8080 esté disponible. Para detener cada servidor, presiona `Ctrl+C` en su terminal.

**Administrador de demostración, solo con `-Demo`:** usuario `admin`, contraseña `barrio-demo-2026`. La administración está en `/admin/productos` y `/admin/pedidos`.

La conexión original se conservó en `src/main/resources/application-local.properties`, ignorado por Git. Las credenciales locales no forman parte de los archivos compartibles.

Para utilizar tus propias credenciales, configura variables de entorno y ejecuta el backend sin `-Demo`:

```powershell
$env:DB_URL='jdbc:postgresql://localhost:5432/cafe_barrio_db'
$env:DB_USER='postgres'
$env:DB_PASSWORD='tu-clave'
$env:ADMIN_USER='admin'
$env:ADMIN_PASSWORD='una-clave-propia-de-al-menos-12-caracteres'
.\scripts\backend.ps1
```

`.env.example` documenta las variables y contiene únicamente valores de ejemplo. Puedes copiarlo con `Copy-Item .env.example .env` y completar tus valores locales. Spring Boot **no carga automáticamente** un archivo `.env`: configura las variables en la terminal como se muestra arriba, en el servidor o en la configuración de ejecución de `CafeDeBarrioApplication` en IntelliJ. El perfil `demo` sirve para una prueba local.

Para subir a GitHub, incluye `.env.example` y conserva las reglas de `.gitignore`: excluyen `.env`, sus variantes locales y `src/main/resources/application-local.properties`. No reemplaces los valores de la plantilla con contraseñas reales.

En un equipo con Java y Node compatibles configurados, también puedes usar:

```powershell
.\mvnw.cmd spring-boot:run '-Dspring-boot.run.profiles=demo'
# En otra terminal, dentro de frontend:
npm ci
npm start
```

## Base de datos

Flyway administra el esquema. `V1` crea categorías, productos, pedidos y detalles con restricciones y claves foráneas. `V2` carga tres categorías y ocho productos de demostración. Las migraciones se ejecutan una sola vez; Hibernate valida el esquema con `ddl-auto=validate`.

Usa una base vacía para una instalación nueva. No se aplica un baseline automático a esquemas desconocidos. `V3` asigna fotografías ilustrativas generadas a los ocho productos, conservando las URLs personalizadas desde administración. Las imágenes están guardadas localmente en WebP; sus rutas y prompts se documentan en [docs/product-images.md](docs/product-images.md). Se pueden reemplazar desde administración con una URL HTTPS.

## Flujo y reglas

- El carrito se guarda en `localStorage`; no existe una tabla de carrito.
- El checkout recibe nombre, celular, dirección e items `{ productId, quantity }`. No recibe precios ni total.
- El backend toma los precios reales, agrupa items repetidos y verifica productos activos y stock.
- Pedido, detalles y descuento de stock se guardan en una transacción. Las filas de producto se bloquean en orden de id para evitar sobreventa.
- Cada compra requiere un UUID en `Idempotency-Key`. Repetir la misma clave y contenido devuelve el mismo pedido sin descontar de nuevo. Reutilizarla con otros datos devuelve `409`.
- Angular conserva esa clave durante reintentos y recargas en la misma pestaña, y la elimina al recibir una respuesta exitosa.
- El popup aparece después de `201 Created`, muestra el número de pedido y el importe calculado por el backend, y aclara que no hubo pago en línea.
- Los estados avanzan `PENDIENTE → EN_PREPARACION → ENTREGADO`. Cambiar el estado no modifica stock.
- Los detalles guardan nombre y precio históricos. Desactivar un producto no borra pedidos anteriores.
- Las páginas de lista incluyen paginación; los filtros se aplican en el backend.

## Seguridad

Spring Security protege `/api/admin/**`. El administrador se configura por entorno y su contraseña se almacena en memoria como hash BCrypt; no hay registro público de usuarios. La sesión usa cookie HttpOnly y SameSite=Lax. Todas las mutaciones requieren CSRF, incluso login y checkout. Angular usa `XSRF-TOKEN` y `X-XSRF-TOKEN` automáticamente en las llamadas relativas a `/api`.

No se almacenan JWT ni contraseñas en `localStorage`. El guard de Angular facilita la navegación; el backend impone los permisos. Tras login y logout se renueva el token CSRF. Datos personales de pedidos solo se exponen al administrador.

En despliegue usa HTTPS, `COOKIE_SECURE=true`, una contraseña propia y frontend/API bajo el mismo origen con proxy inverso. El perfil demo es exclusivamente local. La foto de portada se carga desde Unsplash, con una ilustración local de respaldo; el resto de las imágenes son locales. Para producción, añade límites de intentos de login/pedidos en el proxy y una gestión de usuarios persistente si necesitas varios administradores.

## Pruebas

```powershell
.\scripts\backend.ps1 -Test
.\scripts\frontend.ps1 -Action Test
.\scripts\frontend.ps1 -Action Build
```

Las pruebas del backend usan **H2 aislado**, nunca la conexión local PostgreSQL. Cubren stock, rollback, concurrencia, repetición de solicitudes, estados, validaciones, autenticación y permisos. Las pruebas de Angular cubren carrito y checkout, incluyendo conservación del carrito ante errores y confirmación solo después del éxito.

Además se verificó el flujo real en el navegador con PostgreSQL. Se conserva un pedido identificado como **Pedido de prueba**, de dos unidades de Café de origen · Cusco, en estado **EN_PREPARACION**, para demostrar la integración; el stock se descontó como corresponde. También se creó **Café edición de prueba** desde el formulario, se comprobó su aparición en el catálogo y se dejó desactivado. Otros datos existentes se conservan.

## Estructura y entregables

```text
src/main/java/.../
  config/ controller/ dto/ entity/ exception/ repository/ service/
src/main/resources/db/migration/
src/test/
frontend/src/app/
  core/ shared/ features/
docs/
  api.http
  cafe-de-barrio.postman_collection.json
scripts/
```

La colección Postman incluye obtención de CSRF, login, catálogo, creación de pedido y mantenimiento administrativo. Guarda las cookies de sesión y ejecuta primero `CSRF`; después de iniciar sesión, ejecuta `CSRF` nuevamente antes de mutaciones.

## API

Todos los importes están expresados en PEN. Ver [docs/api.http](docs/api.http) para cuerpos completos.

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/categorias` | Público |
| GET | `/api/productos?categoria=1&disponible=true&page=0&size=12` | Público |
| GET | `/api/productos/{id}` | Público, productos activos |
| POST | `/api/pedidos` | Público + CSRF + Idempotency-Key |
| GET | `/api/auth/csrf` | Público |
| POST | `/api/auth/login` | Público + CSRF, formulario URL-encoded |
| GET | `/api/auth/me` | Administrador |
| POST | `/api/auth/logout` | Sesión + CSRF |
| GET / POST | `/api/admin/productos` | Administrador |
| GET / PUT | `/api/admin/productos/{id}` | Administrador |
| PATCH | `/api/admin/productos/{id}/activo` | Administrador |
| GET | `/api/admin/pedidos?estado=PENDIENTE&page=0&size=20` | Administrador |
| GET | `/api/admin/pedidos/{id}` | Administrador |
| PATCH | `/api/admin/pedidos/{id}/estado` | Administrador |

Las respuestas de lista tienen `content`, `page`, `size`, `totalElements` y `totalPages`. Errores de validación usan `400` con `message` y `fields`; recurso inexistente `404`; conflicto de stock/estado `409`; sin sesión `401`; sin permiso o CSRF inválido `403`.
