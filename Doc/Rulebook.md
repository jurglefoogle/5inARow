# 🎯Complete Rulebook (Developer Reference)

**Game Type:** Abstract Strategy  
**Players:** 2–4  
**Board:** 19×19 intersections (Go-style grid)  
**Objective:** Capture opponent stones or align your stones in a row  
**Official Source:** Winning Moves / Deluxe Pente, Ultraboardgames cross-references  

---

## 1️⃣ Overview
Pente is a strategy board game played on a 19×19 grid.  
Players alternate placing stones on intersections with the goal of either:

- Forming **five or more stones** in a straight line (horizontal, vertical, or diagonal), **or**
- **Capturing five pairs** (10 stones total) of opponent stones.

The first player to achieve **either condition wins immediately**.

---

## 2️⃣ Components
- **Board:** 19×19 grid (Go-style intersections)  
- **Stones:** Each player uses a distinct color  
  - 2-Player: White vs. Black  
  - 3–4 Players: Each player uses a unique color  
- **Starting Position:** Board begins empty  

---

## 3️⃣ Turn Order
- **2-Player:** White goes first.  
- **3–4 Players:** Turns proceed clockwise around the table.  
- Each player places one stone per turn on any empty intersection.

---

## 4️⃣ Move Rules
- A player places **exactly one stone** on any empty intersection.
- Stones remain in place unless **captured**.
- You cannot pass a turn.
- It is legal to form your own pair between opponent stones (no self-capture).

---

## 5️⃣ Capture Rules (Custodial “Sandwich”)
A **capture** occurs when **exactly two** adjacent enemy stones are flanked on both ends by your stones in a straight line (orthogonal or diagonal).

**Example:**
```
Before:  ● ○ ○ _
After:   ● ○ ○ ●   ← The two ○ are captured and removed
```

### Capture Conditions
- **Pair Only:** Captures occur only when exactly two opponent stones are flanked.  
- **Directions:** Horizontal, vertical, or diagonal.  
- **Timing:** Captured stones are removed **immediately** after placement.  
- **Multiple Captures:** One move may create multiple captures in different directions.  
- **Mixed Captures (3–4 Player Games):** You can capture two stones of **different colors** between your two stones.  

### Capture Accounting
- Each capture = one **pair** (2 stones).  
- Track captured pairs for each player or team.  
- Captured stones are permanently removed from play.  

---

## 6️⃣ Winning Conditions
A player wins immediately if **either** occurs on their turn:

1. **Five-in-a-Row:** Five or more consecutive stones of the same color in a straight line.  
2. **Capture Victory:** Capturing **five pairs** (10 stones total).  

### Precedence
If both occur on the same move, **five-in-a-row** takes precedence.

> *Once a five-in-a-row is formed, it cannot be broken by a later capture (unlike some house variants).*

---

## 7️⃣ Tournament Rules (“Pro” Mode)
Used to balance first-move advantage in competitive play:

1. **White’s first move:** Must be on the **center** point.  
2. **Black’s first move:** Anywhere on the board.  
3. **White’s second move:** Must be **at least three intersections away** from the center.

---

## 8️⃣ Strategy Notes
- Control the **center** early.  
- Avoid placing pairs that can be easily flanked.  
- Use **captures** defensively to interrupt opponent lines.  
- Prioritize **open threes (trias)** and **open fours (tesseras)** to force wins.  
- Watch diagonals — they’re powerful but easily overlooked.

---

## 9️⃣ Multi-Player Variants

### 🧩 9.1 Free-for-All (3–4 Players)
Each player has a unique color. Turns proceed clockwise.

#### Win Conditions
- Form **five (or sometimes four)** in a row, depending on house rules.
- Or reach the capture threshold (commonly 4 or 5 pairs).
- Mixed captures allowed — two flanked stones may be of **any colors**.

#### Mixed Capture Example
```
● A B ●   →   Both A and B (different players) are captured
```

#### Capture Notes
- You can capture stones belonging to any opponent.
- Capturing two of your own stones is not allowed.

---

### 🤝 9.2 Team Pente (4 Players)
Four players form **two teams** of two.

#### Setup
- Each player uses a distinct color.  
- Teammates sit opposite each other and alternate turns.  

#### Win Conditions
A team wins when **either** condition is met:

1. One teammate achieves **five-in-a-row**, or  
2. The **team’s combined capture total** reaches **five pairs (10 stones)**.

#### Capture Rules
- You may capture **any two stones**, even from **different players**.  
- Capturing your partner’s stones is allowed but **does not** count toward your team’s total.  
- Only captures of **opponent stones** count toward victory.  

#### Strategic Implications
- Teammates can use their stones to **block** or **support** one another’s lines.  
- Defensive coordination is key — a partner may deliberately set traps for captures.  

---

## 🔧 10️⃣ Implementation Notes (for Developers)
To code Pente in your engine:

| Concept | Implementation |
|----------|----------------|
| **Board** | 19×19 2D array |
| **Values** | `0=Empty`, `1=White`, `2=Black`, `3=Red`, `4=Blue` |
| **Turn Order** | Array or circular iterator |
| **Functions** | `placeStone(player, row, col)`, `checkForCaptures()`, `checkForFiveInARow()`, `getWinner()` |
| **Capture Logic** | For each of 8 directions, check pattern `you | opp | opp | you` (any color combo allowed in multi-player). |
| **Victory Logic** | Return first valid win (line or capture). |
| **Tournament Mode** | Optional toggle; enforce center and distance rule. |
| **Multi-Player Support** | Store team/group data structure with shared capture totals. |

---

## ⚖️ 11️⃣ Rule Variants (Optional)
| Variant | Description |
|----------|-------------|
| **Keryo-Pente** | Captures of two or three allowed; 15 stones to win. |
| **Poof Pente** | Your own flanked pairs are auto-captured (“poofed”). |
| **Boat Pente** | A five-in-a-row can be broken by immediate capture. |
| **Team Pente** | 4-Player team variant (covered above). |

---

## 📚 12️⃣ Source Authority
- [Winning Moves — Official Deluxe Pente Rules (PDF)](https://winning-moves.com/images/PenteRules.pdf)  
- [UltraBoardGames Pente Guide](https://www.ultraboardgames.com/pente/game-rules.php)  
- [Wikipedia: Pente Overview & Variants](https://en.wikipedia.org/wiki/Pente)  

---

© 2025 — Rule summary compiled for open-source implementation use.
