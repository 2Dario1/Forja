# FORJA 3D

Tienda estática con un backend Node.js mínimo para servir la página y conectar FORJA AI PRO con la API de Gemini.

## Requisitos

- Node.js 20 o superior.
- Una clave nueva de Gemini API, obtenida de Google AI Studio.

La clave compartida anteriormente no se incluye en el proyecto: parece corresponder a otro proveedor y debe revocarse. No reutilices una clave que se haya publicado en un chat.

## Configuración local

1. Copia `.env.example` como `.env`.
2. Reemplaza `GEMINI_API_KEY` por una clave nueva de Gemini. El modelo predeterminado es `gemini-3.1-flash-lite`.
3. Ejecuta `npm start`.
4. Abre `http://127.0.0.1:8000`.
5. Ejecuta `npm test` para las pruebas del backend.

La clave se lee solo en el servidor y no se envía al navegador. También se puede configurar `GEMINI_API_KEY`, `GEMINI_MODEL`, `PORT` y `HOST` como variables del entorno en lugar de usar `.env`.

## Publicar en Render

El archivo `render.yaml` configura un servicio web de Node.js con el plan gratuito y define `GEMINI_API_KEY` como variable privada para introducirla en Render, no en el repositorio.

1. Sube el proyecto a un repositorio privado de GitHub. `.gitignore` excluye `.env`; nunca subas claves de API.
2. En Render, crea un **Blueprint** y conecta ese repositorio.
3. En la configuración del servicio, introduce una clave Gemini nueva para `GEMINI_API_KEY` y confirma el despliegue.
4. Cuando Render termine, comparte la URL `onrender.com` que aparece en el servicio.

El plan gratuito puede tardar un poco en responder al primer acceso después de un periodo sin actividad. La tienda funciona sin la clave Gemini, pero el chat FORJA AI no estará disponible hasta configurarla.

## Alcance actual de FORJA AI PRO

El chat consulta Gemini desde `/api/chat`, conserva la conversación solo en la pestaña actual y recibe como contexto el catálogo público de la página. El servidor aplica validación de entradas, límites de tamaño y frecuencia, y no expone secretos en respuestas ni registros.

La tienda actual no tiene inventario, autenticación, pedidos ni base de datos. Por eso el asistente no confirma existencias, consulta pedidos, agrega productos al BOM ni ejecuta compras. La calculadora existente da una estimación y no analiza archivos STL. Estas integraciones requieren servicios y datos reales antes de poder presentarse como funcionales.
