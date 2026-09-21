/**
 * Configuración de PostCSS
 * Procesa Tailwind CSS y añade prefijos de vendor automáticamente
 * Documentación: https://postcss.org/
 */
module.exports = {
  plugins: {
    // Tailwind CSS: procesa @tailwind directives y genera utilidades
    tailwindcss: {},
    
    // Autoprefixer: añade prefijos -webkit-, -moz-, etc. automáticamente.
    // Como no hay "browserslist" definido, usa la lista de navegadores por defecto.
    autoprefixer: {},
  },
}
