// Game state management and logic
class Game {
    constructor() {
        this.boardSize = 19;
        this.board = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(0));
        
        // Player configuration - default 2 players
        this.players = [
            { id: 1, position: 'right', color: '#FFFFFF', name: 'White', enabled: true, isAI: false, difficulty: 'easy' },
            { id: 2, position: 'left', color: '#000000', name: 'Black', enabled: true, isAI: false, difficulty: 'easy' },
            { id: 3, position: 'top', color: '#FF0000', name: 'Red', enabled: false, isAI: false, difficulty: 'easy' },
            { id: 4, position: 'bottom', color: '#0000FF', name: 'Blue', enabled: false, isAI: false, difficulty: 'easy' }
        ];
        
        this.currentPlayerIndex = 0; // Index into enabled players array
        this.captures = { 1: 0, 2: 0, 3: 0, 4: 0 }; // Capture pairs count
        this.wins = { 1: 0, 2: 0, 3: 0, 4: 0 }; // Win tracking for scoreboard
        this.gameOver = false;
        this.moveHistory = []; // For undo functionality
        this.isAIThinking = false;
        this.aiInstances = {}; // Map of player ID to AI instance
        
        // Initialize board renderer
        this.boardRenderer = new Board('game-board', this.boardSize);
        this.boardRenderer.onStonePlace = (row, col) => this.makeMove(row, col);
        
        // UI elements
        this.statusMessage = document.getElementById('status-message');
        this.newGameBtn = document.getElementById('new-game-btn');
        this.quickNewGameBtn = document.getElementById('quick-new-game-btn');
        this.undoBtn = document.getElementById('undo-btn');
        this.hamburgerBtn = document.getElementById('hamburger-btn');
        this.modal = document.getElementById('settings-modal');
        this.closeModalBtn = document.getElementById('close-modal-btn');
        
        this.setupControls();
        this.loadPlayerConfig();
        this.applyPlayerConfig();
        this.updateUI();
    }

    setupControls() {
        this.newGameBtn.addEventListener('click', () => {
            this.savePlayerConfig();
            this.applyPlayerConfig();
            this.newGame();
            this.closeModal();
        });
        
        // Quick new game button - doesn't open modal
        this.quickNewGameBtn.addEventListener('click', () => {
            this.newGame();
        });
        
        this.undoBtn.addEventListener('click', () => this.undoMove());
        
        this.hamburgerBtn.addEventListener('click', () => this.openModal());
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        
        // Close modal when clicking outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // Setup AI toggle handlers for all players
        for (let i = 1; i <= 4; i++) {
            const aiCheckbox = document.getElementById(`player${i}-ai`);
            const difficultySelect = document.getElementById(`player${i}-difficulty`);
            
            aiCheckbox.addEventListener('change', (e) => {
                difficultySelect.disabled = !e.target.checked;
            });
        }
    }

    openModal() {
        this.modal.classList.add('show');
    }

    closeModal() {
        this.modal.classList.remove('show');
    }

    loadPlayerConfig() {
        // Load player configurations from UI
        for (let i = 1; i <= 4; i++) {
            const player = this.players[i - 1];
            const enabled = document.getElementById(`player${i}-enabled`).checked;
            const color = document.getElementById(`player${i}-color`).value;
            const isAI = document.getElementById(`player${i}-ai`).checked;
            const difficulty = document.getElementById(`player${i}-difficulty`).value;
            
            player.enabled = enabled;
            player.color = color;
            player.isAI = isAI;
            player.difficulty = difficulty;
        }
    }

    savePlayerConfig() {
        this.loadPlayerConfig();
    }

    applyPlayerConfig() {
        // Update AI instances
        this.aiInstances = {};
        this.players.forEach(player => {
            if (player.enabled && player.isAI) {
                this.aiInstances[player.id] = new GameAI(player.id, player.difficulty);
            }
        });
        
        // Update player names from colors
        this.players.forEach(player => {
            player.name = this.getColorName(player.color);
        });
        
        // Show/hide player panels based on enabled status
        this.players.forEach(player => {
            const panel = document.querySelector(`.player${player.id}-panel`);
            if (panel) {
                if (player.enabled) {
                    panel.classList.remove('hidden');
                } else {
                    panel.classList.add('hidden');
                }
                
                // Update panel color indicator
                const stone = panel.querySelector('.stone');
                if (stone) {
                    stone.style.background = player.color;
                }
                
                // Update player name
                const nameSpan = panel.querySelector('.player-name');
                if (nameSpan) {
                    nameSpan.textContent = player.name;
                }
            }
            
            // Update scoreboard entries
            const scoreEntry = document.querySelector(`.score-entry[data-player="${player.id}"]`);
            if (scoreEntry) {
                if (player.enabled) {
                    scoreEntry.classList.remove('hidden');
                } else {
                    scoreEntry.classList.add('hidden');
                }
                
                // Update scoreboard player name
                const scoreNameEl = scoreEntry.querySelector('.player-name-score');
                if (scoreNameEl) {
                    scoreNameEl.textContent = player.name;
                }
            }
        });
        
        this.updateScoreboard();
    }

    getColorName(hexColor) {
        const color = hexColor.toUpperCase();
        const colorMap = {
            '#FFFFFF': 'White',
            '#000000': 'Black',
            '#FF0000': 'Red',
            '#0000FF': 'Blue',
            '#00FF00': 'Green',
            '#FFFF00': 'Yellow',
            '#FF00FF': 'Magenta',
            '#00FFFF': 'Cyan',
            '#FFA500': 'Orange',
            '#800080': 'Purple'
        };
        
        return colorMap[color] || 'Player';
    }

    getCurrentPlayer() {
        const enabledPlayers = this.players.filter(p => p.enabled);
        return enabledPlayers[this.currentPlayerIndex];
    }

    getNextPlayer() {
        const enabledPlayers = this.players.filter(p => p.enabled);
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % enabledPlayers.length;
        return this.getCurrentPlayer();
    }

    makeMove(row, col) {
        if (this.gameOver || this.isAIThinking) return;
        
        // Check if position is valid
        if (this.board[row][col] !== 0) {
            return; // Position occupied
        }
        
        this.executeMoveAndChecks(row, col);
    }

    executeMoveAndChecks(row, col) {
        const currentPlayer = this.getCurrentPlayer();
        
        // Save move for undo
        const moveState = {
            row,
            col,
            playerId: currentPlayer.id,
            playerIndex: this.currentPlayerIndex,
            captures: { ...this.captures },
            capturedStones: []
        };
        
        // Place stone
        this.board[row][col] = currentPlayer.id;
        this.boardRenderer.placeStone(row, col, currentPlayer.id, currentPlayer.color);
        
        // Check for captures
        const captured = this.checkCaptures(row, col, currentPlayer.id);
        if (captured.length > 0) {
            moveState.capturedStones = captured;
            this.captures[currentPlayer.id] += captured.length / 2; // Each capture is 2 stones = 1 pair
            this.boardRenderer.removeStones(captured);
        }
        
        this.moveHistory.push(moveState);
        
        // Check win conditions
        if (this.checkWin(row, col, currentPlayer.id)) {
            this.endGame(currentPlayer);
            return;
        }
        
        // Switch to next player
        this.getNextPlayer();
        this.updateUI();

        // If AI's turn, make AI move
        const nextPlayer = this.getCurrentPlayer();
        if (nextPlayer.isAI && !this.gameOver) {
            this.makeAIMove();
        }
    }

    makeAIMove() {
        const currentPlayer = this.getCurrentPlayer();
        this.isAIThinking = true;
        this.statusMessage.textContent = `${currentPlayer.name} (AI) is thinking...`;

        // Delay to make it feel more natural
        setTimeout(() => {
            const ai = this.aiInstances[currentPlayer.id];
            if (ai) {
                const move = ai.getBestMove(this.board, this.boardSize);
                if (move) {
                    this.executeMoveAndChecks(move.row, move.col);
                }
            }
            this.isAIThinking = false;
        }, 300);
    }

    checkCaptures(row, col, playerId) {
        const captured = [];
        
        // Check all 8 directions (4 lines through the placed stone)
        const directions = [
            [[0, 1], [0, -1]],   // Horizontal
            [[1, 0], [-1, 0]],   // Vertical
            [[1, 1], [-1, -1]],  // Diagonal \
            [[1, -1], [-1, 1]]   // Diagonal /
        ];
        
        directions.forEach(([dir1, dir2]) => {
            // Check pattern: player - opponent - opponent - player
            // Opponents can be ANY stones that aren't the current player (can be mixed colors)
            const pos1 = { row: row + dir1[0], col: col + dir1[1] };
            const pos2 = { row: row + dir1[0] * 2, col: col + dir1[1] * 2 };
            const pos3 = { row: row + dir1[0] * 3, col: col + dir1[1] * 3 };
            
            // Check if positions are valid and match capture pattern
            // Both middle stones must NOT be the current player's stones
            if (this.isValid(pos1) && this.isValid(pos2) && this.isValid(pos3) &&
                this.board[pos1.row][pos1.col] !== 0 &&
                this.board[pos1.row][pos1.col] !== playerId &&
                this.board[pos2.row][pos2.col] !== 0 &&
                this.board[pos2.row][pos2.col] !== playerId &&
                this.board[pos3.row][pos3.col] === playerId) {
                
                // Save player IDs before capturing (they can be different)
                const capturedPlayerId1 = this.board[pos1.row][pos1.col];
                const capturedPlayerId2 = this.board[pos2.row][pos2.col];
                
                // Capture the two opponent stones
                this.board[pos1.row][pos1.col] = 0;
                this.board[pos2.row][pos2.col] = 0;
                captured.push({ ...pos1, playerId: capturedPlayerId1 }, { ...pos2, playerId: capturedPlayerId2 });
            }
            
            // Check in opposite direction
            const pos4 = { row: row + dir2[0], col: col + dir2[1] };
            const pos5 = { row: row + dir2[0] * 2, col: col + dir2[1] * 2 };
            const pos6 = { row: row + dir2[0] * 3, col: col + dir2[1] * 3 };
            
            if (this.isValid(pos4) && this.isValid(pos5) && this.isValid(pos6) &&
                this.board[pos4.row][pos4.col] !== 0 &&
                this.board[pos4.row][pos4.col] !== playerId &&
                this.board[pos5.row][pos5.col] !== 0 &&
                this.board[pos5.row][pos5.col] !== playerId &&
                this.board[pos6.row][pos6.col] === playerId) {
                
                // Save player IDs before capturing (they can be different)
                const capturedPlayerId1 = this.board[pos4.row][pos4.col];
                const capturedPlayerId2 = this.board[pos5.row][pos5.col];
                
                this.board[pos4.row][pos4.col] = 0;
                this.board[pos5.row][pos5.col] = 0;
                captured.push({ ...pos4, playerId: capturedPlayerId1 }, { ...pos5, playerId: capturedPlayerId2 });
            }
        });
        
        return captured;
    }

    checkWin(row, col, playerId) {
        // Check for 5 in a row
        if (this.checkFiveInRow(row, col, playerId)) {
            return true;
        }
        
        // Check for 5 capture pairs (10 stones)
        if (this.captures[playerId] >= 5) {
            return true;
        }
        
        return false;
    }

    checkFiveInRow(row, col, playerId) {
        const directions = [
            [0, 1],   // Horizontal
            [1, 0],   // Vertical
            [1, 1],   // Diagonal \
            [1, -1]   // Diagonal /
        ];
        
        for (let [dr, dc] of directions) {
            let count = 1; // Count the placed stone
            const line = [{ row, col }];
            
            // Check forward
            for (let i = 1; i < 5; i++) {
                const newRow = row + dr * i;
                const newCol = col + dc * i;
                if (this.isValid({ row: newRow, col: newCol }) && 
                    this.board[newRow][newCol] === playerId) {
                    count++;
                    line.push({ row: newRow, col: newCol });
                } else {
                    break;
                }
            }
            
            // Check backward
            for (let i = 1; i < 5; i++) {
                const newRow = row - dr * i;
                const newCol = col - dc * i;
                if (this.isValid({ row: newRow, col: newCol }) && 
                    this.board[newRow][newCol] === playerId) {
                    count++;
                    line.unshift({ row: newRow, col: newCol });
                } else {
                    break;
                }
            }
            
            if (count >= 5) {
                // Highlight winning line
                this.boardRenderer.highlightWinningLine(line.slice(0, 5));
                return true;
            }
        }
        
        return false;
    }

    isValid(pos) {
        return pos.row >= 0 && pos.row < this.boardSize && 
               pos.col >= 0 && pos.col < this.boardSize;
    }

    endGame(player) {
        this.gameOver = true;
        
        // Record the win
        this.wins[player.id]++;
        
        // Determine win reason
        let reason = '';
        if (this.captures[player.id] >= 5) {
            reason = ' by capturing 5 pairs!';
        } else {
            reason = ' with 5 in a row!';
        }
        
        this.statusMessage.textContent = `${player.name} wins${reason}`;
        this.statusMessage.style.background = '#d4edda';
        this.statusMessage.style.borderColor = '#28a745';
        this.statusMessage.style.color = '#155724';
        
        // Update scoreboard
        this.updateScoreboard();
    }

    undoMove() {
        if (this.moveHistory.length === 0 || this.gameOver || this.isAIThinking) return;
        
        // Count AI moves to undo
        let movesToUndo = 1;
        const lastMove = this.moveHistory[this.moveHistory.length - 1];
        const lastPlayer = this.players.find(p => p.id === lastMove.playerId);
        
        // If last move was AI and we have more moves, undo both AI and player move
        if (lastPlayer && lastPlayer.isAI && this.moveHistory.length >= 2) {
            movesToUndo = 2;
        }
        
        for (let i = 0; i < movesToUndo && this.moveHistory.length > 0; i++) {
            this.undoSingleMove();
        }
        
        this.updateUI();
    }

    undoSingleMove() {
        if (this.moveHistory.length === 0) return;

        const lastMove = this.moveHistory.pop();
        
        // Remove the placed stone
        this.board[lastMove.row][lastMove.col] = 0;
        this.boardRenderer.removeStone(lastMove.row, lastMove.col);
        
        // Restore captured stones
        lastMove.capturedStones.forEach(stone => {
            const restoredPlayer = this.players.find(p => p.id === stone.playerId);
            if (restoredPlayer) {
                this.board[stone.row][stone.col] = restoredPlayer.id;
                this.boardRenderer.placeStone(stone.row, stone.col, restoredPlayer.id, restoredPlayer.color);
            }
        });
        
        // Restore capture counts
        this.captures = { ...lastMove.captures };
        
        // Restore player index
        this.currentPlayerIndex = lastMove.playerIndex;
    }

    newGame() {
        // Reset game state
        this.board = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(0));
        this.currentPlayerIndex = 0;
        this.captures = { 1: 0, 2: 0, 3: 0, 4: 0 };
        this.gameOver = false;
        this.moveHistory = [];
        this.isAIThinking = false;
        
        // Clear board
        this.boardRenderer.clear();
        
        // Reset UI
        this.statusMessage.style.background = '';
        this.statusMessage.style.borderColor = '';
        this.statusMessage.style.color = '';
        
        this.updateUI();
    }

    updateUI() {
        const currentPlayer = this.getCurrentPlayer();
        
        // Update turn indicator
        if (!this.gameOver && !this.isAIThinking) {
            this.statusMessage.textContent = `${currentPlayer.name}'s turn`;
        }
        
        // Update capture counts for all players
        for (let i = 1; i <= 4; i++) {
            const captureEl = document.getElementById(`player${i}-captures`);
            if (captureEl) {
                captureEl.textContent = this.captures[i];
            }
        }
        
        // Update active player panel
        this.players.forEach(player => {
            const panel = document.querySelector(`.player${player.id}-panel`);
            if (panel && player.enabled) {
                if (player.id === currentPlayer.id) {
                    panel.classList.add('active');
                } else {
                    panel.classList.remove('active');
                }
            }
        });
        
        // Update undo button state
        this.undoBtn.disabled = this.moveHistory.length === 0 || this.gameOver || this.isAIThinking;
    }

    updateScoreboard() {
        // Update tally marks for each player
        for (let i = 1; i <= 4; i++) {
            const tallyContainer = document.getElementById(`tally-player${i}`);
            if (tallyContainer) {
                tallyContainer.innerHTML = '';
                const wins = this.wins[i];
                
                // Group tallies by 5s
                const fullGroups = Math.floor(wins / 5);
                const remainder = wins % 5;
                
                // Create full groups of 5
                for (let g = 0; g < fullGroups; g++) {
                    const group = document.createElement('div');
                    group.className = 'tally-group';
                    
                    // First 4 vertical marks
                    for (let t = 0; t < 4; t++) {
                        const mark = document.createElement('div');
                        mark.className = 'tally-mark';
                        group.appendChild(mark);
                    }
                    
                    // 5th diagonal mark
                    const fifthMark = document.createElement('div');
                    fifthMark.className = 'tally-mark fifth';
                    group.appendChild(fifthMark);
                    
                    tallyContainer.appendChild(group);
                }
                
                // Add remaining marks
                if (remainder > 0) {
                    const group = document.createElement('div');
                    group.className = 'tally-group';
                    
                    for (let t = 0; t < remainder; t++) {
                        const mark = document.createElement('div');
                        mark.className = 'tally-mark';
                        group.appendChild(mark);
                    }
                    
                    tallyContainer.appendChild(group);
                }
            }
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});
