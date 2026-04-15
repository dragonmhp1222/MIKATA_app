// beforeInteractive で読み込み、初回描画前に localStorage と html[data-theme] を同期する（チラつき防止）。
export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("mikata-theme");document.documentElement.setAttribute("data-theme",s==="light"?"light":"dark");}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;
