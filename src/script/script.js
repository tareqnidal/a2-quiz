import { showHighScores, saveHighScore } from './highScore.js'

document.addEventListener('DOMContentLoaded', () => {
  // Event listeners
  document.getElementById('start-btn').addEventListener('click', startGame)
  document.getElementById('restartGameButton').addEventListener('click', restartGame)
  const highScoreButton = document.getElementById('highScoreLink')
  highScoreButton.addEventListener('click', showHighScores)
  const usernameInput = document.getElementById('username')
  usernameInput.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault() // Prevent the default action to avoid any unwanted behavior
      startGame()
    }
  })

  // Variables to keep track of game state
  let currentQuestionId
  let playerName
  let startTime
  let endTime
  let timer

  /**
   *
   */
  function getPlayerName () {
    playerName = document.getElementById('username').value
    if (!playerName) {
      alert('Please enter a nickname to start the game.')
    }
  }

  /**
   * Initializes and starts the game.
   */
  function startGame () {
    getPlayerName()

    startTime = Date.now()
    currentQuestionId = 0
    document.getElementById('startContainer').style.display = 'none'
    document.getElementById('Quiz').style.display = 'block'
    document.getElementById('timer').style.display = 'block' // Show the timer
    getNextQuestion()
  }

  /**
   *  Retrieves the next quiz question from the server.
   */
  function getNextQuestion () {
    fetch(`https://courselab.lnu.se/quiz/question/${currentQuestionId + 1}`)
      .then(response => response.json())
      .then(question => showQuestion(question))
  }

  /**
   * Displays a given question and its associated answer options
   * @param {object} question - The question object to display.
   */
  function showQuestion (question) {
    currentQuestionId = question.id
    document.getElementById('question').innerHTML = `<h2>${question.question}</h2>`

    resetAndStartTimer() // Reset and start the timer for the new question

    const optionsContainer = document.getElementById('optionsContainer')
    optionsContainer.innerHTML = '' // Clear previous answers

    if (question.alternatives) {
      // Handling multiple-choice questions
      Object.entries(question.alternatives).forEach(([key, value]) => {
        const label = document.createElement('label')
        const radioButton = document.createElement('input')
        radioButton.setAttribute('type', 'radio')
        radioButton.setAttribute('name', 'answer')
        radioButton.setAttribute('value', key)

        radioButton.addEventListener('keypress', function (event) {
          if (event.key === 'Enter') {
            event.preventDefault() // Prevent the default form submit action
            submitAnswer()
          }
        })

        label.appendChild(radioButton)
        label.appendChild(document.createTextNode(value))
        optionsContainer.appendChild(label)
      })

      const submitButton = document.createElement('button')
      submitButton.textContent = 'Submit Answer'
      submitButton.className = 'btn'
      submitButton.addEventListener('click', submitAnswer)
      optionsContainer.appendChild(submitButton)
    } else {
      // Handling text input questions
      optionsContainer.innerHTML = `
            <label for="textAnswer">Press enter or Submit to submit your answer:</label>
            <input type="text" id="textAnswer" placeholder="Your answer">
            <button class="btn" id="submit-answer">Submit</button>
        `
      const textAnswerInput = document.getElementById('textAnswer')
      textAnswerInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
          submitAnswer()
        }
      })

      // Ensure to remove any previous event listeners
      const submitButton = document.getElementById('submit-answer')
      submitButton.removeEventListener('click', submitAnswer)
      submitButton.addEventListener('click', submitAnswer)
    }
  }

  /**
   * Submits the selected or entered answer for the current question.
   * @param {string|null} selectedAnswer - (Optional) The selected answer value in case of a multiple-choice question.
   */
  function submitAnswer (selectedAnswer = null) {
    let answer

    const radioButtons = document.getElementsByName('answer')
    for (const radioButton of radioButtons) {
      if (radioButton.checked) {
        selectedAnswer = radioButton.value
        break
      }
    }

    // Check if there is a text input field with the ID 'textAnswer'
    const textAnswerInput = document.getElementById('textAnswer')
    if (textAnswerInput) {
      answer = textAnswerInput.value.trim()
    } else if (selectedAnswer !== null) {
      answer = selectedAnswer
    } else {
      showResult()
      return
    }

    clearInterval(timer) // Stop the timer

    sendAnswer(currentQuestionId, answer)
      .then(response => handleAnswerResponse(response))
      .catch(error => {
        if (error.message === 'Incorrect answer') {
          // Update the <h1> element with the server's message
          document.getElementById('quizTitle').textContent = error.message
          document.getElementById('timeTaken').style.display = 'none'
          // Stop the timer and show game over message for incorrect answer
          clearInterval(timer)
          gameOver('Wrong answer <😔> game over.')
        } else {
          console.error('Error submitting answer:', error)
        }
      })
  }

  /**
   * Handles the response from the server after submitting an answer.
   * @param {object} response - The response object from the server after submitting an answer.
   */
  function handleAnswerResponse (response) {
    // Update the <h1> element with the server's message
    if (response.message) {
      document.getElementById('quizTitle').textContent = response.message
    }

    currentQuestionId = 0

    // Check if the quiz is over
    if (!response.nextURL) {
      gameOver('Congrats, You win! Good work.')
      showResult(response)
    } else {
      // Fetch the next question using the provided nextURL
      fetch(response.nextURL)
        .then(response => response.json())
        .then(nextQuestion => showQuestion(nextQuestion))
    }
  }

  /**
   * Send the user's answer to the server.
   * @param {number} questionId - The ID of the question.
   * @param {string} answer - The user's answer.
   * @returns {Promise<object>} A promise that resolves with the server response.
   */
  async function sendAnswer (questionId, answer) {
    const response = await fetch(`https://courselab.lnu.se/quiz/answer/${questionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        answer
      })
    })

    if (!response.ok && response.status === 400) {
      // Answer is incorrect
      throw new Error('Incorrect answer')
    }

    return await response.json()
  }

  /**
   * Displays the final results of the quiz game.
   * @param {boolean} gameFinished - A boolean flag indicating whether the game has finished. If true, it triggers
   *                                 the saving of the high score.
   */
  function showResult (gameFinished) {
    const timeTakenElement = document.getElementById('timeTaken')
    const highScoreLink = document.getElementById('highScoreLink')

    // Hide the quiz container and show the result container
    document.getElementById('Quiz').style.display = 'none'
    const resultContainer = document.getElementById('resultContainer')
    resultContainer.style.display = 'block'

    endTime = Date.now()
    const timeSpent = endTime - startTime // Time spent in milliseconds
    const seconds = ((timeSpent % 60000) / 1000).toFixed(0)

    if (gameFinished) {
      saveHighScore(startTime, playerName)
    }

    // Add event listener to the restart button
    const restartGameButton = document.getElementById('restartGameButton')
    restartGameButton.addEventListener('click', restartGame)
    document.getElementById('timer').style.display = 'none' // Hide the timer
    document.getElementById('restartGameButton').style.display = 'block'
    timeTakenElement.textContent = `${playerName} Time taken:  ${seconds} seconds`

    // Display high score link
    highScoreLink.style.display = 'block'
  }

  /**
   * Restarts the game by resetting the game state and updating the UI elements.
   */
  function restartGame () {
    currentQuestionId = 0

    document.getElementById('resultContainer').style.display = 'none'
    document.getElementById('startContainer').style.display = 'block'
    document.getElementById('timer').style.display = 'none' // Hide the timer
    document.getElementById('restartGameButton').style.display = 'none'
    document.getElementById('highScoreLink').style.display = 'none'

    // Reset the <h1> title to its original text
    document.getElementById('quizTitle').textContent = 'The Quiz'
    document.getElementById('username').value = ''
  }

  /**
   * Resets and restarts the game timer.
   */
  function resetAndStartTimer () {
    clearInterval(timer) // Clear any existing timer
    startTimer() // Start a new timer
  }

  /**
   * Starts a countdown timer for the game.
   */
  function startTimer () {
    let timeLeft = 10
    const timeElement = document.getElementById('time')
    timeElement.textContent = timeLeft // Update immediately
    timeElement.style.color = 'green' // Reset color

    timer = setInterval(() => {
      document.getElementById('time').textContent = Math.floor(timeLeft)
      timeLeft = (timeLeft - 0.1).toFixed(1)
      if (timeLeft <= 0) {
        clearInterval(timer)
        gameOver("Time's up <br> Game Over")
        document.getElementById('timeTaken').style.display = 'none' // Hide the time taken
        return
      }

      timeElement.textContent = timeLeft

      // Change color based on remaining time
      if (timeLeft < 4) {
        timeElement.style.color = 'red'
      } else if (timeLeft < 7) {
        timeElement.style.color = 'orange'
      }

      timeLeft -= 0.1
    }, 195)
  }

  /**
   * Handles the end of the quiz game.
   * @param {string} message - The message to be displayed to the user upon game completion.
   */
  function gameOver (message) {
    clearInterval(timer)
    document.getElementById('quizTitle').textContent = 'The Quiz'
    document.getElementById('timer').style.display = 'none' // Hide the timer
    document.getElementById('resultMessage').textContent = message // Display the game over message
    showResult()
  }
})
