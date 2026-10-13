"use strict";

class BlockaGame {
    constructor() {
        this.canvas = document.getElementById("canvas");
        this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
        this.canvasFuente = document.createElement("canvas");
        this.canvasFuente.width = this.canvas.width;
        this.canvasFuente.height = this.canvas.height;
        this.ctxFuente = this.canvasFuente.getContext("2d");
        this.bancoImgenes = [
            "../assets/blocka/blocka1.png",
            "../assets/blocka/blocka2.png",
            "../assets/blocka/blocka3.png",
            "../assets/blocka/blocka4.png",
            "../assets/blocka/blocka5.png",
            "../assets/blocka/blocka6.png"
        ];
        this.nivelActual = 1;
        this.tiempoInicio = null;
        this.temporizadorInterval = null;
        this.imagenSeleccionada = null;
        this.imagenElegidaSrc = null;
        this.piezas = [];
        this.juegoIniciado = false;
        this.nivelCompletado = false;
        this.perdido = false;
        this.cantidadPiezas = 4;
        this.filas = 2;
        this.columnas = 2;
        this.anchoPieza = this.canvas.width / this.columnas;
        this.altoPieza = this.canvas.height / this.filas;
        this.ayuditaUsada = false;
        this.tiempoMaxPorNivel = 180;
        this.mensajeVictoria = document.getElementById("blocka-mensaje");
        this.pantallaSeleccion = document.getElementById("pantallaSeleccion");
        this.galeriaThumbs = document.getElementById("galeriaThumbs");
        this.selCantidadPiezas = document.getElementById("selCantidadPiezas");
        this.btnSortear = document.getElementById("btnSortear");
        this.btnConfirmarSeleccion = document.getElementById("btnConfirmarSeleccion");
        this.btnVolverMenuSeleccion = document.getElementById("btnVolverMenuSeleccion");
        this.infoSorteo = document.getElementById("infoSorteo");
        this.btnAyudita = document.getElementById("btnAyudita");
        this.btnVolverMenuJuego = document.getElementById("btnVolverMenuJuego");
        this.sorteoInterval = null;
        this.mostrarImagenInicial();
        this.configurarEventosSeleccion();
    }
    // Muestra la imagen inicial en el canvas
    mostrarImagenInicial() {
        const imagenInicial = new Image();
        imagenInicial.onload = () => {
            if (!this.juegoIniciado) {
                this.ctx.drawImage(imagenInicial, 0, 0, this.canvas.width, this.canvas.height);
            }
        };
        imagenInicial.onerror = () => {
            console.error("No se pudo cargar la imagen inicial de Blocka.");
        };
        imagenInicial.src = "../assets/blocka/cardBlocka2.png";
    }
    // Configura eventos de la pantalla de selección
    configurarEventosSeleccion() {
        if (this.btnSortear) this.btnSortear.addEventListener("click", () => this.iniciarSorteo());
        if (this.btnConfirmarSeleccion) this.btnConfirmarSeleccion.addEventListener("click", () => this.confirmarSeleccion());
        if (this.btnVolverMenuSeleccion) this.btnVolverMenuSeleccion.addEventListener("click", () => this.volverAlMenu());
        if (this.selCantidadPiezas) this.selCantidadPiezas.addEventListener("change", () => {
            this.cantidadPiezas = parseInt(this.selCantidadPiezas.value, 10);
            this.calcularGrilla(this.cantidadPiezas);
        });
        if (this.btnAyudita) { this.btnAyudita.addEventListener("click", () => this.usarAyudita()); this.btnAyudita.disabled = true; }
        if (this.btnVolverMenuJuego) this.btnVolverMenuJuego.addEventListener("click", () => this.volverAlMenu());
    }
    // Muestra la pantalla de selección de imagen
    mostrarPantallaSeleccion() {
        this.imagenElegidaSrc = null;
        if (this.btnConfirmarSeleccion) this.btnConfirmarSeleccion.disabled = true;
        if (this.infoSorteo) { this.infoSorteo.hidden = true; this.infoSorteo.textContent = ""; }
        this.renderizarThumbnails();
        this.limpiarEstadoSorteo();
        if (this.pantallaSeleccion) this.pantallaSeleccion.style.display = "flex";
        const seccionJuego = document.getElementById("blocka-juego");
        if (seccionJuego) seccionJuego.style.display = "none";
        const menuPrincipal = document.getElementById("menuPrincipal");
        if (menuPrincipal) menuPrincipal.style.display = "none";
    }
    // Renderiza las miniaturas en la galería
    renderizarThumbnails() {
        if (!this.galeriaThumbs) return;
        this.galeriaThumbs.replaceChildren();   
        this.bancoImgenes.forEach((src) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "thumb-btn";
            btn.dataset.src = src;
            const img = document.createElement("img");
            img.src = src;
            img.alt = "Miniatura";
            img.className = "thumb-img";
            img.loading = "lazy";
            btn.appendChild(img);
            btn.addEventListener("click", () => this.seleccionarThumbnail(src, btn));
            this.galeriaThumbs.appendChild(btn);
        });
    }
    // Selecciona una miniatura manualmente
    seleccionarThumbnail(src, btnSeleccionado) {
        this.limpiarEstadoSorteo();
        this.imagenElegidaSrc = src;
        if (this.btnConfirmarSeleccion) this.btnConfirmarSeleccion.disabled = false;
        if (this.infoSorteo) { this.infoSorteo.hidden = false; this.infoSorteo.textContent = "Imagen seleccionada. Listo para jugar."; }
        const botones = this.galeriaThumbs.querySelectorAll(".thumb-btn");
        botones.forEach((b) => b.classList.remove("seleccionada", "destacada"));
        if (btnSeleccionado) btnSeleccionado.classList.add("seleccionada");
    }
    // Realiza animación de sorteo para elegir imagen
    iniciarSorteo() {
        this.limpiarEstadoSorteo();
        const botones = this.galeriaThumbs.querySelectorAll(".thumb-btn");
        if (botones.length === 0) return;
        this.imagenElegidaSrc = null;
        if (this.btnConfirmarSeleccion) this.btnConfirmarSeleccion.disabled = true;
        if (this.infoSorteo) { this.infoSorteo.hidden = false; this.infoSorteo.textContent = "Sorteando imagen..."; }
        let iteraciones = 0;
        const maxIteraciones = 16;
        this.sorteoInterval = setInterval(() => {
            botones.forEach((b) => b.classList.remove("destacada"));
            const idx = Math.floor(Math.random() * botones.length);
            const btnDest = botones[idx];
            if (btnDest) { btnDest.classList.add("destacada"); this.imagenElegidaSrc = btnDest.dataset.src || null; }
            iteraciones++;
            if (iteraciones >= maxIteraciones) {
                clearInterval(this.sorteoInterval);
                this.sorteoInterval = null;
                botones.forEach((b) => b.classList.remove("destacada"));
                const btnFinal = botones[Math.floor(Math.random() * botones.length)];
                if (btnFinal) { this.imagenElegidaSrc = btnFinal.dataset.src || null; btnFinal.classList.add("seleccionada"); }
                if (this.btnConfirmarSeleccion) this.btnConfirmarSeleccion.disabled = !this.imagenElegidaSrc;
                if (this.infoSorteo) this.infoSorteo.textContent = this.imagenElegidaSrc ? "Se jugara con esta imagen." : "Intenta nuevamente.";
            }
        }, 180);
    }
    // Limpia el estado de la animación de sorteo
    limpiarEstadoSorteo() {
        if (this.sorteoInterval) { clearInterval(this.sorteoInterval); this.sorteoInterval = null; }
        const botones = this.galeriaThumbs.querySelectorAll(".thumb-btn");
        botones.forEach((b) => b.classList.remove("destacada"));
    }
    // Confirma la imagen y cantidad de piezas
    confirmarSeleccion() {
        if (!this.imagenElegidaSrc) return;
        this.cantidadPiezas = parseInt(this.selCantidadPiezas?.value || "4", 10);
        this.calcularGrilla(this.cantidadPiezas);
        if (this.pantallaSeleccion) this.pantallaSeleccion.style.display = "none";
        const seccionJuego = document.getElementById("blocka-juego");
        if (seccionJuego) seccionJuego.style.display = "flex";
        this.iniciarNivel(1, this.imagenElegidaSrc);
    }
    // Calcula filas y columnas según cantidad
    calcularGrilla(cant) {
        const total = parseInt(cant, 10) || 4;
        this.cantidadPiezas = total;
        if (total === 6) { this.columnas = 3; this.filas = 2; }
        else if (total === 8) { this.columnas = 4; this.filas = 2; }
        else { this.columnas = 2; this.filas = 2; this.cantidadPiezas = 4; }
        this.anchoPieza = this.canvas.width / this.columnas;
        this.altoPieza = this.canvas.height / this.filas;
    }
    // Inicia un nivel con imagen y filtros
    iniciarNivel(nivel, srcForzado = null) {
        this.juegoIniciado = true; this.nivelCompletado = false; this.perdido = false; this.ayuditaUsada = false;
        if (this.btnAyudita) this.btnAyudita.disabled = false;
        if (this.mensajeVictoria) { this.mensajeVictoria.hidden = true; this.mensajeVictoria.replaceChildren(); }
        this.nivelActual = nivel;
        const lblNivel = document.getElementById("val-nivel");
        if (lblNivel) lblNivel.innerText = this.nivelActual;
        this.actualizarVistaRecord();
        this.elegirImagenAleatoria(srcForzado);
        this.iniciarTemporizador();
    }
    // Actualiza la vista del récord desde localStorage
    actualizarVistaRecord() {
        const lblRecord = document.getElementById("val-record");
        if (lblRecord) {
            let r = localStorage.getItem(`record_nivel_${this.nivelActual}`);
            lblRecord.innerText = r ? `${r}s` : "--:--";
        }
    }
    // Carga una imagen aleatoria o forzada
    elegirImagenAleatoria(srcForzado = null) {
        const ruta = srcForzado || this.bancoImgenes[Math.floor(Math.random() * this.bancoImgenes.length)];
        this.imagenElegidaSrc = ruta;
        this.imagenSeleccionada = new Image();
        this.imagenSeleccionada.src = ruta;
        this.imagenSeleccionada.onload = () => this.configurarCanvasYFiltros();
    }
    // Aplica filtro según nivel y copia a canvas fuente
    configurarCanvasYFiltros() {
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        this.ctx.drawImage(this.imagenSeleccionada,0,0,this.canvas.width,this.canvas.height);
        let imageData = this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height);
        if (this.nivelActual === 1) this.filtroGrises(imageData);
        else if (this.nivelActual === 2) this.filtroBrillo(imageData,30);
        else if (this.nivelActual === 3) this.filtroNegativo(imageData);
        else this.filtroGrises(imageData);
        this.ctxFuente.drawImage(this.canvas,0,0);
        this.inicializarPiezas();
    }
    // Crea piezas mezcladas con ángulos aleatorios
    inicializarPiezas() {
        this.calcularGrilla(this.cantidadPiezas);
        this.piezas = [];
        for (let f=0;f<this.filas;f++) {
            for (let c=0;c<this.columnas;c++) {
                const ang = [90,180,270][Math.floor(Math.random()*3)];
                this.piezas.push({xOriginal:c*this.anchoPieza,yOriginal:f*this.altoPieza,posX:c*this.anchoPieza,posY:f*this.altoPieza,ancho:this.anchoPieza,alto:this.altoPieza,angulo:ang,fija:false});
            }
        }
        this.dibujarTablero();
        this.registrarEventosClick();
    }
    // Dibuja piezas rotadas en el canvas
    dibujarTablero() {
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        this.piezas.forEach(p => {
            this.ctx.save();
            let cx = p.posX+p.ancho/2, cy = p.posY+p.alto/2;
            this.ctx.translate(cx,cy);
            this.ctx.rotate(p.angulo*Math.PI/180);
            this.ctx.drawImage(this.canvasFuente,p.xOriginal,p.yOriginal,p.ancho,p.alto,-p.ancho/2,-p.alto/2,p.ancho,p.alto);
            this.ctx.restore();
            if (p.fija) {
                this.ctx.save();
                this.ctx.strokeStyle="#00E5FF"; this.ctx.lineWidth=3; this.ctx.setLineDash([6,4]);
                this.ctx.strokeRect(p.posX+4,p.posY+4,p.ancho-8,p.alto-8);
                this.ctx.restore();
            }
        });
    }
    // Registra eventos de click izquierdo/derecho
    registrarEventosClick() {
        this.canvas.onclick = (e)=>this.manejarClick(e,'izquierdo');
        this.canvas.oncontextmenu = (e)=>{e.preventDefault(); this.manejarClick(e,'derecho');};
    }
    // Maneja giro de piezas al hacer click
    manejarClick(e,tipo) {
        if (this.nivelCompletado||this.perdido) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX-rect.left, y = e.clientY-rect.top;
        this.piezas.forEach(p => {
            if (p.fija) return;
            if (x>=p.posX&&x<=p.posX+p.ancho&&y>=p.posY&&y<=p.posY+p.alto) {
                if (tipo==='izquierdo') p.angulo=(p.angulo-90+360)%360;
                else p.angulo=(p.angulo+90)%360;
            }
        });
        this.dibujarTablero(); this.verificarVictoria();
    }
    // Inicia contador con límite por nivel
    iniciarTemporizador() {
        clearInterval(this.temporizadorInterval);
        this.tiempoInicio = Date.now();
        const m={1:180,2:120,3:90};
        this.tiempoMaxPorNivel = m[this.nivelActual]||120;
        this.temporizadorInterval = setInterval(()=>{
            if (this.nivelCompletado||this.perdido) return;
            let t = Math.floor((Date.now()-this.tiempoInicio)/1000);
            let min=String(Math.floor(t/60)).padStart(2,'0'), seg=String(t%60).padStart(2,'0');
            const lbl=document.getElementById("val-tiempo"); if (lbl) lbl.innerText=`${min}:${seg}`;
            if (t>=this.tiempoMaxPorNivel) this.perderNivel("Tiempo agotado!");
        },1000);
    }
    // Detiene temporizador y devuelve segundos
    detenerTemporizador() {
        clearInterval(this.temporizadorInterval);
        if (this.tiempoInicio===null) return 0;
        return Math.floor((Date.now()-this.tiempoInicio)/1000);
    }
    // Coloca una pieza correcta fija y suma +5s
    usarAyudita() {
        if (!this.juegoIniciado||this.nivelCompletado||this.perdido||this.ayuditaUsada) return;
        const inc = this.piezas.filter(p=>p.angulo!==0);
        if (inc.length===0) return;
        const p = inc[Math.floor(Math.random()*inc.length)];
        if (!p) return;
        p.angulo=0; p.fija=true;
        if (this.tiempoInicio!==null) this.tiempoInicio = this.tiempoInicio-5000;
        this.ayuditaUsada=true;
        if (this.btnAyudita) this.btnAyudita.disabled=true;
        this.dibujarTablero(); this.verificarVictoria();
    }
    // Muestra pantalla de derrota por tiempo
    perderNivel(motivo) {
        if (this.perdido||this.nivelCompletado) return;
        this.perdido=true; clearInterval(this.temporizadorInterval);
        this.canvas.onclick=null; this.canvas.oncontextmenu=null;
        if (this.mensajeVictoria) {
            this.mensajeVictoria.hidden=false; this.mensajeVictoria.replaceChildren();
            const s=document.createElement("span"); s.textContent=`${motivo} No lograste completar el nivel a tiempo.`; this.mensajeVictoria.append(s);
            const br=document.createElement("br");
            const re=document.createElement("button"); re.type="button"; re.className="blocka-siguiente"; re.textContent="Reintentar nivel"; re.onclick=()=>this.reiniciarNivelActual(); this.mensajeVictoria.append(re);
            const vm=document.createElement("button"); vm.type="button"; vm.className="blocka-volver"; vm.textContent="Volver al menú principal"; vm.onclick=()=>this.volverAlMenu(); this.mensajeVictoria.append(vm);
        }
    }
    // Reinicia el nivel actual
    reiniciarNivelActual() {
        if (this.mensajeVictoria) { this.mensajeVictoria.hidden=true; this.mensajeVictoria.replaceChildren(); }
        this.nivelCompletado=false; this.perdido=false; this.ayuditaUsada=false;
        if (this.btnAyudita) this.btnAyudita.disabled=false;
        this.canvas.onclick=null; this.canvas.oncontextmenu=null;
        this.iniciarNivel(this.nivelActual, this.imagenElegidaSrc);
    }
    // Vuelve al menú principal
    volverAlMenu() {
        clearInterval(this.temporizadorInterval);
        this.limpiarEstadoSorteo();
        this.juegoIniciado=false; this.nivelCompletado=false; this.perdido=false; this.ayuditaUsada=false; this.piezas=[]; this.imagenElegidaSrc=null; this.nivelActual=1;
        if (this.btnAyudita) this.btnAyudita.disabled=true;
        if (this.mensajeVictoria) { this.mensajeVictoria.hidden=true; this.mensajeVictoria.replaceChildren(); }
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        this.mostrarImagenInicial();
        const sj=document.getElementById("blocka-juego"); if (sj) sj.style.display="none";
        if (this.pantallaSeleccion) this.pantallaSeleccion.style.display="none";
        const mp=document.getElementById("menuPrincipal"); if (mp) mp.style.display="flex";
        const lt=document.getElementById("val-tiempo"); if (lt) lt.innerText="00:00";
        const ln=document.getElementById("val-nivel"); if (ln) ln.innerText="1";
        this.actualizarVistaRecord();
    }
    // Aplica filtro de escala de grises
    filtroGrises(imageData){var s=this.ctx.createImageData(imageData.width,imageData.height);for(var x=0;x<imageData.width;x++){for(var y=0;y<imageData.height;y++){var r=this.getRed(imageData,x,y),g=this.getGreen(imageData,x,y),b=this.getBlue(imageData,x,y),gr=(r+g+b)/3;this.setPixel(s,x,y,gr,gr,gr,255);}}this.ctx.putImageData(s,0,0);}
    // Aplica filtro de brillo
    filtroBrillo(imageData,p){var s=this.ctx.createImageData(imageData.width,imageData.height),aj=255*(p/100);for(var x=0;x<imageData.width;x++){for(var y=0;y<imageData.height;y++){var r=Math.min(255,this.getRed(imageData,x,y)+aj),g=Math.min(255,this.getGreen(imageData,x,y)+aj),b=Math.min(255,this.getBlue(imageData,x,y)+aj);this.setPixel(s,x,y,r,g,b,255);}}this.ctx.putImageData(s,0,0);}
    // Aplica filtro negativo
    filtroNegativo(imageData){var s=this.ctx.createImageData(imageData.width,imageData.height);for(var x=0;x<imageData.width;x++){for(var y=0;y<imageData.height;y++){var r=255-this.getRed(imageData,x,y),g=255-this.getGreen(imageData,x,y),b=255-this.getBlue(imageData,x,y);this.setPixel(s,x,y,r,g,b,255);}}this.ctx.putImageData(s,0,0);}
    // Establece color de un píxel
    setPixel(id,x,y,r,g,b,a){let i=(x+y*id.width)*4;id.data[i+0]=r;id.data[i+1]=g;id.data[i+2]=b;id.data[i+3]=a;}
    // Obtiene canal rojo
    getRed(id,x,y){return id.data[(x+y*id.width)*4+0];}
    // Obtiene canal verde
    getGreen(id,x,y){return id.data[(x+y*id.width)*4+1];}
    // Obtiene canal azul
    getBlue(id,x,y){return id.data[(x+y*id.width)*4+2];}
    // Verifica si todas las piezas están correctas
    verificarVictoria() {
        if (this.perdido || this.nivelCompletado) return;
        if (this.piezas.length === 0) return;
        const g = this.piezas.every(p=>p.angulo===0);
        if (g) {
            this.nivelCompletado=true; let tf=this.detenerTemporizador();
            this.canvas.onclick=null; this.canvas.oncontextmenu=null;
            if (this.btnAyudita) this.btnAyudita.disabled=true;
            this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
            if (this.imagenSeleccionada) this.ctx.drawImage(this.imagenSeleccionada,0,0,this.canvas.width,this.canvas.height);
            let ra=localStorage.getItem(`record_nivel_${this.nivelActual}`);
            const nr=!ra||tf<parseInt(ra,10);
            if (nr){localStorage.setItem(`record_nivel_${this.nivelActual}`,tf); this.actualizarVistaRecord();}
            if (this.mensajeVictoria) {
                this.mensajeVictoria.hidden=false; this.mensajeVictoria.replaceChildren();
                const m=document.createElement("span"); m.textContent=nr?`Nuevo récord! Nivel ${this.nivelActual} completado en ${tf} segundos.`:`Felicitaciones! Nivel ${this.nivelActual} completado en ${tf} segundos.`; this.mensajeVictoria.append(m);
                if (this.nivelActual<3){ const bs=document.createElement("button"); bs.type="button"; bs.className="blocka-siguiente"; bs.textContent=`Continuar al nivel ${this.nivelActual+1}`; bs.onclick=()=>this.iniciarNivel(this.nivelActual+1,this.imagenElegidaSrc); this.mensajeVictoria.append(bs); }
                else { const mf=document.createElement("span"); mf.textContent=" Completaste todos los niveles!"; this.mensajeVictoria.append(mf); }
                const vmv=document.createElement("button"); vmv.type="button"; vmv.className="blocka-volver"; vmv.textContent="Volver al menú principal"; vmv.onclick=()=>this.volverAlMenu(); this.mensajeVictoria.append(vmv);
            }
        }
    }
}
document.addEventListener("DOMContentLoaded", () => {
    const game = new BlockaGame();
    const btnStart = document.getElementById("startBlocka");
    if (btnStart) btnStart.addEventListener("click", (e)=>{e.preventDefault(); game.mostrarPantallaSeleccion();});
    else console.log("No se encontro el boton con ID startBlocka");
});
