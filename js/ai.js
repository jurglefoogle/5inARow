// AI player for 5-in-a-Row
class GameAI {
    constructor(playerNumber, difficulty = 'medium') {
        this.player = playerNumber;
        this.opponent = playerNumber === 1 ? 2 : 1;
        this.difficulty = difficulty; // 'easy', 'medium', 'hard'
    }

    // Main function to get AI's move
    getBestMove(board, boardSize) {
        if (this.difficulty === 'easy') {
            return this.getEasyMove(board, boardSize);
        } else if (this.difficulty === 'medium') {
            return this.getMediumMove(board, boardSize);
        } else {
            return this.getHardMove(board, boardSize);
        }
    }

    // Easy: Basic strategy (still plays smart but makes some suboptimal moves)
    getEasyMove(board, boardSize) {
        // 1. Check if AI can win
        const winMove = this.findWinningMove(board, boardSize, this.player);
        if (winMove) return winMove;

        // 2. Block opponent's winning move
        const blockMove = this.findWinningMove(board, boardSize, this.opponent);
        if (blockMove) return blockMove;

        // 3. Look for 4 in a row opportunities
        const fourMove = this.findThreatMove(board, boardSize, this.player, 4);
        if (fourMove && Math.random() > 0.3) return fourMove; // 70% chance to take it

        // 4. Block opponent's 4 in a row
        const blockFourMove = this.findThreatMove(board, boardSize, this.opponent, 4);
        if (blockFourMove && Math.random() > 0.2) return blockFourMove; // 80% chance to block

        // 5. Check if AI can capture
        const captureMove = this.findCaptureMove(board, boardSize, this.player);
        if (captureMove && Math.random() > 0.4) return captureMove; // 60% chance

        // 6. Look for 3 in a row
        const threeMove = this.findThreatMove(board, boardSize, this.player, 3);
        if (threeMove && Math.random() > 0.5) return threeMove; // 50% chance

        // 7. Play strategically
        return this.getStrategicMove(board, boardSize);
    }

    // Medium: More aggressive and forward-thinking
    getMediumMove(board, boardSize) {
        // 1. Check if AI can win
        const winMove = this.findWinningMove(board, boardSize, this.player);
        if (winMove) return winMove;

        // 2. Block opponent's winning move
        const blockMove = this.findWinningMove(board, boardSize, this.opponent);
        if (blockMove) return blockMove;

        // 3. Look for 4 in a row opportunities (one move from winning)
        const fourMove = this.findThreatMove(board, boardSize, this.player, 4);
        if (fourMove) return fourMove;

        // 4. Block opponent's 4 in a row
        const blockFourMove = this.findThreatMove(board, boardSize, this.opponent, 4);
        if (blockFourMove) return blockFourMove;

        // 5. Check if near capture victory (4+ pairs captured)
        if (this.getCaptureCount(board, this.player) >= 4) {
            const captureMove = this.findCaptureMove(board, boardSize, this.player);
            if (captureMove) return captureMove;
        }

        // 6. Block opponent near capture victory
        if (this.getCaptureCount(board, this.opponent) >= 4) {
            const blockCaptureMove = this.findDefensiveCaptureMove(board, boardSize);
            if (blockCaptureMove) return blockCaptureMove;
        }

        // 7. Look for 3 in a row (open-ended)
        const threeMove = this.findOpenThree(board, boardSize, this.player);
        if (threeMove) return threeMove;

        // 8. Block opponent's 3 in a row (open-ended)
        const blockThreeMove = this.findOpenThree(board, boardSize, this.opponent);
        if (blockThreeMove) return blockThreeMove;

        // 9. Check if AI can capture
        const captureMove = this.findCaptureMove(board, boardSize, this.player);
        if (captureMove) return captureMove;

        // 10. Evaluate best strategic move
        return this.getAdvancedStrategicMove(board, boardSize);
    }

    // Hard: More advanced evaluation with deeper search
    getHardMove(board, boardSize) {
        // Use minimax-like evaluation for each possible move
        let bestScore = -Infinity;
        let bestMove = null;

        const moves = this.getPrioritizedMoves(board, boardSize);

        // Check top 30 moves with deep evaluation
        for (const move of moves.slice(0, 30)) {
            const score = this.evaluateMoveDeep(board, boardSize, move.row, move.col);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove || this.getMediumMove(board, boardSize);
    }

    // Find move that creates a specific threat (3 or 4 in a row)
    findThreatMove(board, boardSize, player, targetCount) {
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                if (board[row][col] === 0) {
                    board[row][col] = player;
                    const threats = this.countThreats(board, boardSize, row, col, player);
                    board[row][col] = 0;
                    
                    // Check if this creates the target threat level
                    if (targetCount === 4 && threats >= 3) {
                        return { row, col };
                    } else if (targetCount === 3 && threats >= 1) {
                        return { row, col };
                    }
                }
            }
        }
        return null;
    }

    // Find open three (three in a row with both ends open)
    findOpenThree(board, boardSize, player) {
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                if (board[row][col] === 0) {
                    board[row][col] = player;
                    if (this.hasOpenThree(board, boardSize, row, col, player)) {
                        board[row][col] = 0;
                        return { row, col };
                    }
                    board[row][col] = 0;
                }
            }
        }
        return null;
    }

    // Check if position creates an open three
    hasOpenThree(board, boardSize, row, col, player) {
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

        for (let [dr, dc] of directions) {
            let count = 1;
            let openEnds = 0;

            // Check forward
            let i = 1;
            while (i <= 3) {
                const r = row + dr * i, c = col + dc * i;
                if (r >= 0 && r < boardSize && c >= 0 && c < boardSize) {
                    if (board[r][c] === player) {
                        count++;
                        i++;
                    } else if (board[r][c] === 0 && i === count) {
                        openEnds++;
                        break;
                    } else {
                        break;
                    }
                } else break;
            }

            // Check backward
            i = 1;
            while (i <= 3) {
                const r = row - dr * i, c = col - dc * i;
                if (r >= 0 && r < boardSize && c >= 0 && c < boardSize) {
                    if (board[r][c] === player) {
                        count++;
                        i++;
                    } else if (board[r][c] === 0 && i === count) {
                        openEnds++;
                        break;
                    } else {
                        break;
                    }
                } else break;
            }

            if (count === 3 && openEnds === 2) {
                return true;
            }
        }
        return false;
    }

    // Get capture count from board state
    getCaptureCount(board, player) {
        // This is a simplified version - in real game, we'd track this
        // For now, return 0 as captures are tracked in game state
        return 0;
    }

    // Find defensive move to prevent opponent's capture
    findDefensiveCaptureMove(board, boardSize) {
        const opponent = this.opponent;
        
        // Look for positions where opponent could capture if they place a stone
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                if (board[row][col] === this.player) {
                    // Check if this stone is vulnerable (part of a pair that could be captured)
                    if (this.isVulnerable(board, boardSize, row, col)) {
                        // Find move to protect it
                        const protectMove = this.findProtectiveMove(board, boardSize, row, col);
                        if (protectMove) return protectMove;
                    }
                }
            }
        }
        return null;
    }

    // Check if a stone is vulnerable to capture
    isVulnerable(board, boardSize, row, col) {
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1], [0, -1], [-1, 0], [-1, -1], [-1, 1]];
        
        for (let [dr, dc] of directions) {
            const adj = { row: row + dr, col: col + dc };
            if (this.isValid(adj, boardSize) && board[adj.row][adj.col] === this.player) {
                // Found adjacent friendly stone - check if vulnerable
                const before = { row: row - dr, col: col - dc };
                const after = { row: adj.row + dr, col: adj.col + dc };
                
                if (this.isValid(before, boardSize) && this.isValid(after, boardSize) &&
                    (board[before.row][before.col] === 0 || board[before.row][before.col] === this.opponent) &&
                    (board[after.row][after.col] === 0 || board[after.row][after.col] === this.opponent)) {
                    return true;
                }
            }
        }
        return false;
    }

    // Find move to protect vulnerable stones
    findProtectiveMove(board, boardSize, row, col) {
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1], [0, -1], [-1, 0], [-1, -1], [-1, 1]];
        
        for (let [dr, dc] of directions) {
            const move = { row: row - dr, col: col - dc };
            if (this.isValid(move, boardSize) && board[move.row][move.col] === 0) {
                return move;
            }
        }
        return null;
    }

    // Advanced strategic move with better evaluation
    getAdvancedStrategicMove(board, boardSize) {
        const moves = [];
        
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                if (board[row][col] === 0) {
                    const score = this.evaluateMove(board, boardSize, row, col);
                    if (score > 0) {
                        moves.push({ row, col, score });
                    }
                }
            }
        }

        if (moves.length === 0) {
            return this.getStrategicMove(board, boardSize);
        }

        moves.sort((a, b) => b.score - a.score);
        return { row: moves[0].row, col: moves[0].col };
    }

    // Deep evaluation with look-ahead
    evaluateMoveDeep(board, boardSize, row, col) {
        let score = this.evaluateMove(board, boardSize, row, col);
        
        // Look one move ahead
        board[row][col] = this.player;
        
        // Check opponent's best response
        let opponentBestScore = -Infinity;
        const nearbyMoves = this.getNearbyMoves(board, boardSize, row, col, 2);
        
        for (const move of nearbyMoves.slice(0, 10)) {
            board[move.row][move.col] = this.opponent;
            const opponentScore = this.evaluateMove(board, boardSize, move.row, move.col);
            opponentBestScore = Math.max(opponentBestScore, opponentScore);
            board[move.row][move.col] = 0;
        }
        
        board[row][col] = 0;
        
        // Penalize moves that give opponent good opportunities
        score -= opponentBestScore * 0.5;
        
        return score;
    }

    // Get moves near a position
    getNearbyMoves(board, boardSize, row, col, range) {
        const moves = [];
        for (let r = Math.max(0, row - range); r <= Math.min(boardSize - 1, row + range); r++) {
            for (let c = Math.max(0, col - range); c <= Math.min(boardSize - 1, col + range); c++) {
                if (board[r][c] === 0) {
                    const score = this.getProximityScore(board, boardSize, r, c);
                    moves.push({ row: r, col: c, score });
                }
            }
        }
        moves.sort((a, b) => b.score - a.score);
        return moves;
    }
    findWinningMove(board, boardSize, player) {
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                if (board[row][col] === 0) {
                    // Try this move
                    board[row][col] = player;
                    if (this.checkWin(board, boardSize, row, col, player)) {
                        board[row][col] = 0; // Undo
                        return { row, col };
                    }
                    board[row][col] = 0; // Undo
                }
            }
        }
        return null;
    }

    // Check if position creates 5 in a row
    checkWin(board, boardSize, row, col, player) {
        const directions = [
            [0, 1],   // Horizontal
            [1, 0],   // Vertical
            [1, 1],   // Diagonal \
            [1, -1]   // Diagonal /
        ];

        for (let [dr, dc] of directions) {
            let count = 1;

            // Check forward
            for (let i = 1; i < 5; i++) {
                const newRow = row + dr * i;
                const newCol = col + dc * i;
                if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize &&
                    board[newRow][newCol] === player) {
                    count++;
                } else {
                    break;
                }
            }

            // Check backward
            for (let i = 1; i < 5; i++) {
                const newRow = row - dr * i;
                const newCol = col - dc * i;
                if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize &&
                    board[newRow][newCol] === player) {
                    count++;
                } else {
                    break;
                }
            }

            if (count >= 5) return true;
        }
        return false;
    }

    // Find move that captures opponent stones
    findCaptureMove(board, boardSize, player) {
        const opponent = player === 1 ? 2 : 1;

        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                if (board[row][col] === 0) {
                    // Check if this move would capture
                    const directions = [
                        [[0, 1], [0, -1]],   // Horizontal
                        [[1, 0], [-1, 0]],   // Vertical
                        [[1, 1], [-1, -1]],  // Diagonal \
                        [[1, -1], [-1, 1]]   // Diagonal /
                    ];

                    for (let [dir1, dir2] of directions) {
                        // Check pattern: player - opponent - opponent - player
                        const pos1 = { row: row + dir1[0], col: col + dir1[1] };
                        const pos2 = { row: row + dir1[0] * 2, col: col + dir1[1] * 2 };
                        const pos3 = { row: row + dir1[0] * 3, col: col + dir1[1] * 3 };

                        if (this.isValid(pos1, boardSize) && this.isValid(pos2, boardSize) && this.isValid(pos3, boardSize) &&
                            board[pos1.row][pos1.col] === opponent &&
                            board[pos2.row][pos2.col] === opponent &&
                            board[pos3.row][pos3.col] === player) {
                            return { row, col };
                        }
                    }
                }
            }
        }
        return null;
    }

    // Get a strategic move (near center or existing stones)
    getStrategicMove(board, boardSize) {
        const center = Math.floor(boardSize / 2);
        
        // If center is empty, take it
        if (board[center][center] === 0) {
            return { row: center, col: center };
        }

        // Find moves near existing stones
        const moves = [];
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                if (board[row][col] === 0) {
                    const score = this.getProximityScore(board, boardSize, row, col);
                    if (score > 0) {
                        moves.push({ row, col, score });
                    }
                }
            }
        }

        if (moves.length === 0) {
            return this.getRandomMove(board, boardSize);
        }

        // Sort by score and pick best
        moves.sort((a, b) => b.score - a.score);
        return { row: moves[0].row, col: moves[0].col };
    }

    // Get moves sorted by strategic value
    getPrioritizedMoves(board, boardSize) {
        const moves = [];
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                if (board[row][col] === 0) {
                    const score = this.getProximityScore(board, boardSize, row, col);
                    moves.push({ row, col, score });
                }
            }
        }
        moves.sort((a, b) => b.score - a.score);
        return moves;
    }

    // Evaluate how good a move is
    evaluateMove(board, boardSize, row, col) {
        let score = 0;

        // Try the move
        board[row][col] = this.player;

        // Check for wins (highest priority)
        if (this.checkWin(board, boardSize, row, col, this.player)) {
            board[row][col] = 0;
            return 10000;
        }

        // Check for creating threats (4 in a row, 3 in a row)
        score += this.countThreats(board, boardSize, row, col, this.player) * 100;

        // Check for captures
        score += this.countCaptures(board, boardSize, row, col, this.player) * 50;

        // Proximity to other stones
        score += this.getProximityScore(board, boardSize, row, col);

        board[row][col] = 0; // Undo

        // Check if blocking opponent's win
        board[row][col] = this.opponent;
        if (this.checkWin(board, boardSize, row, col, this.opponent)) {
            score += 5000;
        }
        score += this.countThreats(board, boardSize, row, col, this.opponent) * 80;
        board[row][col] = 0; // Undo

        return score;
    }

    // Count threats (sequences of 3 or 4)
    countThreats(board, boardSize, row, col, player) {
        let threats = 0;
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

        for (let [dr, dc] of directions) {
            let count = 1;
            // Forward
            for (let i = 1; i < 5; i++) {
                const r = row + dr * i, c = col + dc * i;
                if (r >= 0 && r < boardSize && c >= 0 && c < boardSize && board[r][c] === player) {
                    count++;
                } else break;
            }
            // Backward
            for (let i = 1; i < 5; i++) {
                const r = row - dr * i, c = col - dc * i;
                if (r >= 0 && r < boardSize && c >= 0 && c < boardSize && board[r][c] === player) {
                    count++;
                } else break;
            }

            if (count === 4) threats += 3;
            else if (count === 3) threats += 1;
        }

        return threats;
    }

    // Count potential captures from this move
    countCaptures(board, boardSize, row, col, player) {
        let captures = 0;
        const opponent = player === 1 ? 2 : 1;
        const directions = [[[0, 1], [0, -1]], [[1, 0], [-1, 0]], [[1, 1], [-1, -1]], [[1, -1], [-1, 1]]];

        for (let [dir1, dir2] of directions) {
            const pos1 = { row: row + dir1[0], col: col + dir1[1] };
            const pos2 = { row: row + dir1[0] * 2, col: col + dir1[1] * 2 };
            const pos3 = { row: row + dir1[0] * 3, col: col + dir1[1] * 3 };

            if (this.isValid(pos1, boardSize) && this.isValid(pos2, boardSize) && this.isValid(pos3, boardSize) &&
                board[pos1.row][pos1.col] === opponent &&
                board[pos2.row][pos2.col] === opponent &&
                board[pos3.row][pos3.col] === player) {
                captures++;
            }
        }
        return captures;
    }

    // Get score based on proximity to other stones
    getProximityScore(board, boardSize, row, col) {
        let score = 0;
        const range = 2;

        for (let dr = -range; dr <= range; dr++) {
            for (let dc = -range; dc <= range; dc++) {
                const r = row + dr;
                const c = col + dc;
                if (r >= 0 && r < boardSize && c >= 0 && c < boardSize && board[r][c] !== 0) {
                    const distance = Math.abs(dr) + Math.abs(dc);
                    score += (range + 1 - distance);
                }
            }
        }

        // Bonus for center area
        const center = Math.floor(boardSize / 2);
        const distFromCenter = Math.abs(row - center) + Math.abs(col - center);
        score += Math.max(0, 10 - distFromCenter);

        return score;
    }

    isValid(pos, boardSize) {
        return pos.row >= 0 && pos.row < boardSize && pos.col >= 0 && pos.col < boardSize;
    }
}
