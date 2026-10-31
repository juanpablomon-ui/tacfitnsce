/* #NSCE — Datos de la nube (Supabase, proyecto «NSCE» en São Paulo, activado el 27-oct-2026). Van la dirección del proyecto y la clave
   PÚBLICA (publishable): están hechas para ir dentro de la app. Nunca poner aquí la clave secreta («secret» / «service_role») ni la contraseña
   de la base de datos. Vacíos = la app funciona sin nube. En las pruebas automáticas (navigator.webdriver) queda apagada para no tocar la
   nube real; t25 sirve su propia configuración con una nube simulada. */
window.NUBE_URL = 'https://atzouzknipupugzwbaov.supabase.co';
window.NUBE_CLAVE = 'sb_publishable_XG8hSgAOp1dX92mWNJX24Q_yKHWZhdo';
/* Avisos al teléfono (Web Push): clave PÚBLICA. La privada vive solo en Supabase (secreto VAPID_PRIVADA) y en nube/.vapid_privada.txt (no se sube). */
window.NUBE_VAPID = 'BJyU6fB9ai4H_NNTFlSJ3BbpNSVilIzGrEGKjVWDY47RSF3D0fjYd1jFkvjJIxSf53KCVogmpb2tsbXbA1-QuT8';
if(typeof navigator!=='undefined' && navigator.webdriver){ window.NUBE_URL = ''; window.NUBE_CLAVE = ''; }
