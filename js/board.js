// Board rendering and interaction
class Board {
    constructor(canvasId, size = 19) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.size = size; // 19x19 grid
        this.padding = 30; // Padding around the board
        this.cellSize = (this.canvas.width - this.padding * 2) / (this.size - 1);
        this.stones = []; // Store placed stones for rendering
        this.hoverPosition = null; // Current hover position
        
        // Load images
        this.images = {
            board: new Image(),
            white: new Image(),
            black: new Image(),
            red: new Image(),
            blue: new Image()
        };
        
        this.imagesLoaded = 0;
        this.totalImages = 5;
        
        this.loadImages();
    }

    loadImages() {
        const imageFiles = {
            board: 'Assets/Leather.png',
            white: 'Assets/Piece_White.PNG',
            black: 'Assets/Piece_Black.PNG',
            red: 'Assets/Piece_Red.PNG',
            blue: 'Assets/Piece_Blue.PNG'
        };
        
        Object.keys(imageFiles).forEach(key => {
            this.images[key].onload = () => {
                this.imagesLoaded++;
                if (this.imagesLoaded === this.totalImages) {
                    this.init();
                }
            };
            this.images[key].onerror = () => {
                console.error(`Failed to load image: ${imageFiles[key]}`);
                this.imagesLoaded++;
                if (this.imagesLoaded === this.totalImages) {
                    this.init();
                }
            };
            this.images[key].src = imageFiles[key];
        });
    }

    init() {
        this.drawBoard();
        this.setupEventListeners();
    }

    drawBoard() {
        const ctx = this.ctx;
        const { width, height } = this.canvas;
        
        // Draw board texture
        if (this.images.board.complete && this.images.board.naturalWidth > 0) {
            // Create pattern from leather texture
            const pattern = ctx.createPattern(this.images.board, 'repeat');
            ctx.fillStyle = pattern;
            ctx.fillRect(0, 0, width, height);
        } else {
            // Fallback color
            ctx.fillStyle = '#daa520';
            ctx.fillRect(0, 0, width, height);
        }
        
        // Draw grid lines
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.6;
        
        for (let i = 0; i < this.size; i++) {
            const pos = this.padding + i * this.cellSize;
            
            // Vertical lines
            ctx.beginPath();
            ctx.moveTo(pos, this.padding);
            ctx.lineTo(pos, height - this.padding);
            ctx.stroke();
            
            // Horizontal lines
            ctx.beginPath();
            ctx.moveTo(this.padding, pos);
            ctx.lineTo(width - this.padding, pos);
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1.0;
        
        // Draw star points (traditional Go board markings)
        this.drawStarPoints();
    }

    drawStarPoints() {
        const ctx = this.ctx;
        const starPoints = [
            [3, 3], [3, 9], [3, 15],
            [9, 3], [9, 9], [9, 15],
            [15, 3], [15, 9], [15, 15]
        ];
        
        ctx.fillStyle = '#000';
        starPoints.forEach(([row, col]) => {
            const x = this.padding + col * this.cellSize;
            const y = this.padding + row * this.cellSize;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const position = this.getIntersection(x, y);
        
        if (position && this.isValidPosition(position)) {
            this.hoverPosition = position;
            this.render();
        } else if (this.hoverPosition) {
            this.hoverPosition = null;
            this.render();
        }
    }

    handleMouseLeave() {
        if (this.hoverPosition) {
            this.hoverPosition = null;
            this.render();
        }
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const position = this.getIntersection(x, y);
        
        if (position && this.isValidPosition(position)) {
            // Trigger callback if game is handling clicks
            if (this.onStonePlace) {
                this.onStonePlace(position.row, position.col);
            }
        }
    }

    getIntersection(x, y) {
        // Calculate nearest intersection
        const col = Math.round((x - this.padding) / this.cellSize);
        const row = Math.round((y - this.padding) / this.cellSize);
        
        // Check if click is close enough to an intersection
        const snapX = this.padding + col * this.cellSize;
        const snapY = this.padding + row * this.cellSize;
        const distance = Math.sqrt(Math.pow(x - snapX, 2) + Math.pow(y - snapY, 2));
        
        // Only snap if within reasonable distance (half a cell)
        if (distance < this.cellSize / 2 && row >= 0 && row < this.size && col >= 0 && col < this.size) {
            return { row, col };
        }
        
        return null;
    }

    isValidPosition(position) {
        // Check if position is already occupied
        return !this.stones.some(stone => 
            stone.row === position.row && stone.col === position.col
        );
    }

    placeStone(row, col, playerId, color) {
        this.stones.push({ row, col, playerId, color });
        this.render();
    }

    removeStone(row, col) {
        this.stones = this.stones.filter(stone => 
            !(stone.row === row && stone.col === col)
        );
        this.render();
    }

    removeStones(positions) {
        positions.forEach(pos => this.removeStone(pos.row, pos.col));
    }

    render() {
        // Redraw everything
        this.drawBoard();
        this.drawStones();
        if (this.hoverPosition) {
            this.drawHoverIndicator();
        }
    }

    drawStones() {
        this.stones.forEach(stone => {
            const x = this.padding + stone.col * this.cellSize;
            const y = this.padding + stone.row * this.cellSize;
            const radius = this.cellSize * 0.4;
            
            // Draw shadow to the right
            this.ctx.save();
            this.ctx.globalAlpha = 0.8;
            this.ctx.beginPath();
            this.ctx.arc(x + 6, y + 4, radius, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fill();
            this.ctx.restore();
            
            // Set transparency for the stone
            this.ctx.save();
            this.ctx.globalAlpha = 0.8; // 80% opacity = 20% transparent
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            
            // Use custom color if provided, otherwise use default based on player ID
            const baseColor = stone.color || (stone.playerId === 1 ? '#FFFFFF' : '#000000');
            
            // Fill with base color
            this.ctx.fillStyle = baseColor;
            this.ctx.fill();
            
            // Add border
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Add shine effect with gradient
            const gradient = this.ctx.createRadialGradient(
                x - radius * 0.3, y - radius * 0.3, 0,
                x, y, radius
            );
            
            // Check if it's a light or dark color to adjust gradient
            const rgb = this.hexToRgb(baseColor);
            const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
            
            if (brightness > 128) {
                // Light color - darker gradient
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
                gradient.addColorStop(1, this.adjustColor(baseColor, -30));
            } else {
                // Dark color - lighter gradient
                gradient.addColorStop(0, this.adjustColor(baseColor, 60));
                gradient.addColorStop(1, baseColor);
            }
            
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    adjustColor(hex, amount) {
        const rgb = this.hexToRgb(hex);
        const r = Math.max(0, Math.min(255, rgb.r + amount));
        const g = Math.max(0, Math.min(255, rgb.g + amount));
        const b = Math.max(0, Math.min(255, rgb.b + amount));
        return `rgba(${r}, ${g}, ${b}, 0.8)`;
    }

    drawHoverIndicator() {
        if (!this.hoverPosition) return;
        
        const x = this.padding + this.hoverPosition.col * this.cellSize;
        const y = this.padding + this.hoverPosition.row * this.cellSize;
        const radius = this.cellSize * 0.4;
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.6)';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        this.ctx.fillStyle = 'rgba(102, 126, 234, 0.1)';
        this.ctx.fill();
    }

    clear() {
        this.stones = [];
        this.hoverPosition = null;
        this.render();
    }

    highlightWinningLine(positions) {
        positions.forEach(pos => {
            const x = this.padding + pos.col * this.cellSize;
            const y = this.padding + pos.row * this.cellSize;
            const radius = this.cellSize * 0.5;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
            this.ctx.lineWidth = 4;
            this.ctx.stroke();
        });
    }
}
