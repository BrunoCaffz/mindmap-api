const STORAGE_KEY = "theme";

// Roda antes da hidratação (ver layout.tsx): aplica a preferência salva ou a do sistema.
export const THEME_INIT_SCRIPT = `(function(){var m=matchMedia('(prefers-color-scheme: dark)');function apply(){var s=null;try{s=localStorage.getItem('${STORAGE_KEY}')}catch(e){}document.documentElement.dataset.theme=s||(m.matches?'dark':'light')}apply();m.addEventListener('change',apply)})()`;
