const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const gameTimeElement = document.getElementById("gameTime");
const multiplierElement = document.getElementById("multiplier");
const backgroundMusic = document.getElementById("backgroundMusic");
const clickSound = document.getElementById("clickSound");
const toggleMusicBtn = document.getElementById("toggleMusic");
const startGameBtn = document.getElementById("startGame");
const pauseGameBtn = document.getElementById("pauseGame");
const startOverlay = document.getElementById("startOverlay");

// Tamaño fijo del canvas
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

let score = 0;
let objectsCollected = 0;
let gameStarted = false;
let gamePaused = false;
let gameTime = 0;
let multiplier = 1;
let multiplierTime = 0;
const objects = [];
let animationId;

// Precargar imágenes
const images = {
    calavera1: new Image(),
    calavera2: new Image(),
    calavera3: new Image(),
    fantasma: new Image(),
    background: new Image()
};

images.calavera1.src = 'assets/images/calavera1.png';
images.calavera2.src = 'assets/images/calavera2.png';
images.calavera3.src = 'assets/images/calavera3.png';
images.fantasma.src = 'assets/images/calavera1.png';
images.background.src = 'assets/images/background.png';

Object.values(images).forEach(img => {
    img.onerror = () => console.log('Error cargando imagen:', img.src);
});

class GameObject {
    constructor(type, x, y, size, speed) {
        this.type = type;
        this.posX = x;
        this.posY = y;
        this.size = size;
        this.baseSpeed = speed;
        this.speed = speed;
        this.visible = true;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
        this.movementType = Math.floor(Math.random() * 5);
        this.initialX = x;
        this.initialY = y;
        this.amplitude = Math.random() * 50 + 20;
        this.frequency = Math.random() * 0.02 + 0.01;
        this.angle = 0;
        this.circleRadius = Math.random() * 100 + 50;
        this.circleSpeed = Math.random() * 0.03 + 0.01;
        this.circleCenterX = x;
        this.circleCenterY = y;
        this.disappearTimer = Math.random() * 300 + 150;
        this.reappearTimer = 0;
        this.alpha = 1;
    }

    updateSpeed() {
        this.speed = this.baseSpeed * multiplier;
    }

    draw() {
        if (!this.visible) return;

        ctx.save();
        ctx.translate(this.posX, this.posY);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.alpha;

        let image;
        if (this.type === 'fantasma') {
            image = images.fantasma;
        } else {
            const calaveraTypes = [images.calavera1, images.calavera2, images.calavera3];
            image = calaveraTypes[Math.floor(Math.random() * calaveraTypes.length)];
        }

        if (image && image.complete && image.naturalWidth > 0) {
            ctx.drawImage(image, -this.size/2, -this.size/2, this.size, this.size);
        } else {
            ctx.fillStyle = this.type === 'fantasma' ? '#8a2be2' : '#ff6b35';
            ctx.beginPath();
            ctx.arc(0, 0, this.size/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold ' + (this.size/3) + 'px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.type === 'fantasma' ? '👻' : '💀', 0, 0);
        }

        ctx.restore();
    }

    update() {
        if (!gameStarted || gamePaused) return;

        this.updateSpeed();

        // Lógica de aparecer/desaparecer
        if (this.disappearTimer > 0) {
            this.disappearTimer--;
            if (this.disappearTimer < 30) {
                this.alpha = this.disappearTimer / 30;
            }
            if (this.disappearTimer === 0) {
                this.visible = false;
                this.reappearTimer = Math.random() * 150 + 75;
                this.alpha = 0;
            }
        } else if (this.reappearTimer > 0) {
            this.reappearTimer--;
            if (this.reappearTimer > 120) {
                this.alpha = (150 - this.reappearTimer) / 30;
            }
            if (this.reappearTimer === 0) {
                this.visible = true;
                this.disappearTimer = Math.random() * 300 + 150;
                this.alpha = 1;
                this.resetPosition();
            }
        }

        if (!this.visible) return;

        this.rotation += this.rotationSpeed;

        // Movimientos
        switch(this.movementType) {
            case 0:
                this.posY += this.speed;
                break;
            case 1:
                this.posX += this.speed * 0.7;
                this.posY += this.speed;
                break;
            case 2:
                this.posY += this.speed;
                this.posX = this.initialX + Math.sin(this.posY * this.frequency) * this.amplitude;
                break;
            case 3:
                this.angle += this.circleSpeed;
                this.posX = this.circleCenterX + Math.cos(this.angle) * this.circleRadius;
                this.posY = this.circleCenterY + Math.sin(this.angle) * this.circleRadius;
                break;
            case 4:
                this.posY += this.speed;
                this.posX = this.initialX + Math.sin(this.posY * this.frequency * 2) * this.amplitude * 1.5;
                break;
        }

        // Colisiones
        this.checkCollisions();

        // Reiniciar posición
        if (this.posY > CANVAS_HEIGHT + this.size || 
            this.posX < -this.size || 
            this.posX > CANVAS_WIDTH + this.size) {
            this.resetPosition();
        }
    }

    checkCollisions() {
        for (let other of objects) {
            if (other === this || !other.visible) continue;
            
            const dx = this.posX - other.posX;
            const dy = this.posY - other.posY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = (this.size + other.size) / 2;
            
            if (distance < minDistance) {
                const angle = Math.atan2(dy, dx);
                const force = 2;
                
                this.posX += Math.cos(angle) * force;
                this.posY += Math.sin(angle) * force;
                other.posX -= Math.cos(angle) * force;
                other.posY -= Math.sin(angle) * force;
            }
        }
    }

    resetPosition() {
        this.posX = Math.random() * (CANVAS_WIDTH - this.size * 2) + this.size;
        this.posY = -this.size;
        this.initialX = this.posX;
        this.visible = true;
        this.disappearTimer = Math.random() * 300 + 150;
        this.alpha = 1;
    }

    isPointInside(x, y) {
        if (!this.visible) return false;
        const dx = x - this.posX;
        const dy = y - this.posY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= this.size / 2;
    }
}

function generateObjects(count) {
    objects.length = 0;
    for (let i = 0; i < count; i++) {
        const type = Math.random() < 0.2 ? 'fantasma' : 'calavera';
        const size = type === 'fantasma' ? 
            Math.random() * 30 + 40 : 
            Math.random() * 25 + 30;
        const x = Math.random() * (CANVAS_WIDTH - size * 2) + size;
        const y = -size - Math.random() * 200;
        const speed = type === 'fantasma' ? 
            Math.random() * 1 + 0.5 : 
            Math.random() * 2 + 1;

        objects.push(new GameObject(type, x, y, size, speed));
    }
}

function drawBackground() {
    if (images.background.complete && images.background.naturalWidth > 0) {
        ctx.drawImage(images.background, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
        ctx.fillStyle = '#1a0b2e';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        ctx.fillStyle = '#2d1b4e';
        for (let i = 0; i < CANVAS_WIDTH; i += 50) {
            for (let j = 0; j < CANVAS_HEIGHT; j += 50) {
                if ((i + j) % 100 === 0) {
                    ctx.fillRect(i, j, 3, 3);
                }
            }
        }
    }
}

function updateUI() {
    // Redondear la puntuación a número entero
    scoreElement.textContent = Math.round(score);
    multiplierElement.textContent = multiplier.toFixed(1) + 'x';
}

// Event Listeners
canvas.addEventListener('click', function(event) {
    if (!gameStarted || gamePaused) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    
    const mouseX = (event.clientX - rect.left) * scaleX;
    const mouseY = (event.clientY - rect.top) * scaleY;

    for (let i = objects.length - 1; i >= 0; i--) {
        if (objects[i].isPointInside(mouseX, mouseY)) {
            if (clickSound) {
                clickSound.currentTime = 0;
                clickSound.play().catch(e => console.log('Error en sonido:', e));
            }

            let points = 0;
            if (objects[i].type === 'fantasma') {
                points = 50 * multiplier;
                multiplier = Math.min(multiplier + 0.5, 5);
                multiplierTime = 300;
            } else {
                points = 10 * multiplier;
                multiplier = Math.min(multiplier + 0.1, 5);
                multiplierTime = 100;
            }

            score += points;
            objectsCollected++;
            
            updateUI();
            createExplosion(objects[i].posX, objects[i].posY);
            objects[i].resetPosition();
            break;
        }
    }
});

function createExplosion(x, y) {
    const particles = 8;
    for (let i = 0; i < particles; i++) {
        setTimeout(() => {
            ctx.save();
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }, i * 30);
    }
}

toggleMusicBtn.addEventListener('click', function() {
    if (backgroundMusic.paused) {
        backgroundMusic.play().catch(e => console.log('Error en música:', e));
        toggleMusicBtn.innerHTML = '🔊 Silenciar';
    } else {
        backgroundMusic.pause();
        toggleMusicBtn.innerHTML = '🔊 Sonido';
    }
});

pauseGameBtn.addEventListener('click', function() {
    if (!gameStarted) return;
    
    gamePaused = !gamePaused;
    if (gamePaused) {
        pauseGameBtn.innerHTML = '▶️ Reanudar';
        backgroundMusic.pause();
    } else {
        pauseGameBtn.innerHTML = '⏸️ Pausa';
        backgroundMusic.play().catch(e => console.log('Error en música:', e));
    }
});

startGameBtn.addEventListener('click', startGame);

function startGame() {
    gameStarted = true;
    gamePaused = false;
    score = 0;
    objectsCollected = 0;
    gameTime = 0;
    multiplier = 1;
    
    startOverlay.style.display = 'none';
    updateUI();
    generateObjects(15);
    
    pauseGameBtn.innerHTML = '⏸️ Pausa';
    backgroundMusic.play().catch(e => console.log('Error en música:', e));
}

function animate() {
    drawBackground();
    
    if (gameStarted && !gamePaused) {
        objects.forEach(obj => {
            obj.update();
            obj.draw();
        });

        if (multiplierTime > 0) {
            multiplierTime--;
            if (multiplierTime === 0) {
                multiplier = Math.max(1, multiplier - 0.5);
                updateUI();
            }
        }

        gameTime++;
        const minutes = Math.floor(gameTime / 600).toString().padStart(2, '0');
        const seconds = Math.floor((gameTime % 600) / 10).toString().padStart(2, '0');
        gameTimeElement.textContent = `${minutes}:${seconds}`;
    } else {
        objects.forEach(obj => {
            obj.draw();
        });
    }

    animationId = requestAnimationFrame(animate);
}

// Inicialización
window.addEventListener('load', function() {
    animate();
    startOverlay.style.display = 'flex';
});

window.addEventListener('beforeunload', function() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
});