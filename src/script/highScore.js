// High Score Module

/**
 * Saves the current player's score to the local storage.
 */
function showHighScores () {
  const highScores = JSON.parse(localStorage.getItem('highScores')) || []
  highScores.sort((a, b) => a.time - b.time)
  const tableContainer = document.getElementById('highscore')
  const table = document.createElement('table')
  table.innerHTML = `
        <thead>
            <tr>
                <th>Rank</th>
                <th>Nickname</th>
                <th>Time Taken (s)</th>
            </tr>
        </thead>
        <tbody>
            ${highScores.slice(0, 5).map((entry, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${entry.nickname}</td>
                    <td>${entry.time}</td>
                </tr>
            `).join('')}
        </tbody>
    `
  tableContainer.innerHTML = ''
  tableContainer.appendChild(table)
}

/**
 * Saves the current player's score to the local storage.
 * @param {number} startTime -The start time in milliseconds since the epoch (1970-01-01T00:00:00Z).
 *                             Typically obtained from a Date.now() call at the beginning of the game.
 * @param {string} playerName - The name of the player to be saved along with the score.
 */
function saveHighScore (startTime, playerName) {
  const highScores = JSON.parse(localStorage.getItem('highScores')) || []
  const endTime = new Date()
  const totalTime = Math.floor((endTime - startTime) / 1000)

  // Check if player already exists in highScores
  const existingPlayerScore = highScores.find(entry => entry.nickname === playerName)

  if (existingPlayerScore) {
    // Update the time if the new score is better (lower)
    if (totalTime < existingPlayerScore.time) {
      existingPlayerScore.time = totalTime
    }
  } else {
    // Add a new score since player doesn't exist
    highScores.push({
      nickname: playerName,
      time: totalTime
    })
  }

  // Save updated highScores back to localStorage
  localStorage.setItem('highScores', JSON.stringify(highScores))
}

export { showHighScores, saveHighScore }
