//starting scene
document.addEventListener('DOMContentLoaded', function() {
  var playButton = document.getElementById('playButton');
  playButton.addEventListener('click', startGame);
});

function startGame() {
  // Hide the starting scene
  var startingScene = document.getElementById('startingScene');
  startingScene.style.display = 'none';

  // Show the game elements
  var centerContainer = document.querySelector('.center-container');
  centerContainer.classList.remove('hidden');

  //console.log('Game started!');
  // Game Variables
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const resultsDisplay = document.querySelector('.score');
  const livesDisplay = document.querySelector('.lives');

  // Sounds
  const enemyDeath = new Audio('sounds/enemy-death.wav');
  const shootSound = new Audio('sounds/shoot.wav');

  // Images
  const playerImage = new Image();
  playerImage.src = 'images/player.png';
  const enemyImage = new Image();
  enemyImage.src = 'images/enemy.png';
  const bulletImage = new Image();
  bulletImage.src = 'images/bullet.png';

  // Canvas size
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Game State
  const gameState = {
    playerShip: null,
    enemyShips: [],
    playerBullets: [],
    enemyBullets: [],
    numRows: 6,
    numCols: 9,
    enemyWidth: (canvas.width / 9) * 0.65,
    enemyHeight: 60,
    score: 0,
    lives: 3,
    gameOver: false
  };

  // Player Ship
  class PlayerShip {
    constructor(x, y, width, height) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.speed = 10;
      this.bullets = [];
      this.bulletSpeed = 10;
    }

    moveLeft() {
      if (this.x > 0) {
        this.x -= this.speed;
      }
    }

    moveRight() {
      if (this.x + this.width < canvas.width) {
        this.x += this.speed;
      }
    }

    draw() {
      ctx.drawImage(playerImage, this.x, this.y, this.width, this.height);
    }

    shoot() {
      const bulletWidth = 20;
      const bulletHeight = 20;
      const bulletX = this.x + (this.width - 20) / 2 - (bulletWidth - 20) / 2;
      const bulletY = this.y - bulletHeight;
      const bullet = new Bullet(
        bulletX,
        bulletY,
        bulletWidth,
        bulletHeight,
        this.bulletSpeed
      );
      this.bullets.push(bullet);

      shootSound.play();

      gameState.playerBullets.push(bullet);
    }
  }

  //enemy Ship
  class EnemyShip {
    constructor(x, y, width, height, speed) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.speed = speed;
      this.direction = 1;
      this.bullets = [];
      this.bulletSpeed = 5;
      this.bulletInterval = getRandomInterval(5000, 10000); 
      this.bulletTimer = 0;
    }
  
    move() {
      this.x += this.speed * this.direction;
      if (this.x < 0 || this.x + this.width > canvas.width) {
        this.direction *= -1;
        this.y += 20;
      }
    }
  
    draw() {
      ctx.drawImage(enemyImage, this.x, this.y, this.width, this.height);
    }
  
    shoot() {
      this.bulletTimer += 10;
      if (this.bulletTimer >= this.bulletInterval) {
        const bulletWidth = 20;
        const bulletHeight = 20;
        const bulletX = this.x + (this.width - 20) / 2 - (bulletWidth - 20) / 2;
        const bulletY = this.y - bulletHeight;
        const bullet = new EnemyBullet(
          bulletX,
          bulletY,
          bulletWidth,
          bulletHeight,
          this.bulletSpeed
      );


        this.bullets.push(bullet);
        this.bulletTimer = 0;
        this.bulletInterval = getRandomInterval(5000, 10000); 
  
        //shootSound.play();
  
        gameState.enemyBullets.push(bullet);
      }
    }
  }
  
  function getRandomInterval(min, max) {
    return Math.random() * (max - min) + min;
  }
  

    // Bullet
  class Bullet {
    constructor(x, y, width, height, speed) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height + 20;
      this.speed = speed;
      this.active = true;
    }

    move() {
      this.y -= this.speed;
      if (this.y < 0) {
        this.active = false;
      }
    }

    draw() {
      ctx.drawImage(bulletImage, this.x-50, this.y-50, this.width + 100, this.height + 100);
    }
  }

  //enemy bullet  
  class EnemyBullet {
    constructor(x, y, width, height, speed) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height + 20;
      this.speed = speed;
      this.active = true;
    }

    move() {
      this.y += this.speed;
      if (this.y > canvas.height) {
        this.active = false;
      }
    }

    draw() {
      ctx.drawImage(bulletImage, this.x, this.y, this.width + 20, this.height + 20);
    }
  }

  // Populate Enemy Ships
  for (let row = 0; row < gameState.numRows; row++) {
    for (let col = 0; col < gameState.numCols; col++) {
      const enemyX = col * (canvas.width / gameState.numCols) + ((canvas.width / gameState.numCols) - gameState.enemyWidth) / 2;
      const enemyY = row * gameState.enemyHeight;
      gameState.enemyShips.push(new EnemyShip(enemyX, enemyY, gameState.enemyWidth, gameState.enemyHeight, 6));
    }
  }

  gameState.playerShip = new PlayerShip(canvas.width / 2 - 25, canvas.height - 100, 100, 80);

  // Game Loop
  function gameLoop() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw player ship
    gameState.playerShip.draw();

    // Update and draw bullets
    gameState.playerShip.bullets.forEach((bullet, bulletIndex) => {
      bullet.move();
      bullet.draw();

      // Check collision with enemy ships
      for (let enemyIndex = gameState.enemyShips.length - 1; enemyIndex >= 0; enemyIndex--) {
        const enemyShip = gameState.enemyShips[enemyIndex];
        if (checkCollision(bullet, enemyShip)) {
          // Collision occurred
          handleBulletCollision(bulletIndex, enemyIndex);
          break; // Break out of the loop after removing one enemy ship
        }
      }

      // Deactivate and remove bullets that are inactive
      if (!bullet.active) {
        gameState.playerShip.bullets.splice(bulletIndex, 1);
      }
    });

    // Update and draw enemy ships
    gameState.enemyShips.forEach((enemyShip) => {
      enemyShip.move();
      enemyShip.draw();
      enemyShip.shoot(); 
    });

    gameState.enemyBullets.forEach((bullet, bulletIndex) => {
      bullet.move();
      bullet.draw();
    
      // Check collision with player ship
      if (checkCollision(bullet, gameState.playerShip)) {
        // Collision occurred
        handleBulletCollision(bulletIndex, null); 
      }
    
      // Deactivate and remove bullets that are inactive
      if (!bullet.active) {
        gameState.enemyBullets.splice(bulletIndex, 1);
      }
    });
  

    // enemy ships destroyed
    if (gameState.enemyShips.length === 0) {
      // Game over - win 
      endGame(true);
      return; 
    }

    // if player hit
    if (checkPlayerCollision()) {
      gameState.lives--;

      // no more lives
      if (gameState.lives === 0) {
        // Game over - lose 
        endGame(false);
        return; 
      }
    }

    updateGameStats();
    requestAnimationFrame(gameLoop);
  }
  
  // Collision Detection
  function checkCollision(object1, object2) {
    return (
      object1.x < object2.x + object2.width &&
      object1.x + object1.width > object2.x &&
      object1.y < object2.y + object2.height &&
      object1.y + object1.height > object2.y
    );
  }

  // Check if player ship is hit
  function checkPlayerCollision() {
    for (let enemyIndex = 0; enemyIndex < gameState.enemyShips.length; enemyIndex++) {
      const enemyShip = gameState.enemyShips[enemyIndex];
      if (checkCollision(gameState.playerShip, enemyShip)) {
        // Collision occurred
        return true;
      }
    }
    return false;
  }

  // Update game stats
  function updateGameStats() {
    resultsDisplay.textContent = `Score: ${gameState.score}`;
    livesDisplay.textContent = `Lives: ${gameState.lives}`;
  }

  // Handle game over
  function endGame(victory) {
    // Show game over screen
    var gameOverScreen = document.getElementById('gameOverScreen');
    gameOverScreen.style.display = 'flex';
  
    // Set game over message
    var gameOverMessage = document.getElementById('gameOverMessage');
    gameOverMessage.textContent = victory ? 'You won!' : 'You lost!';

    //reload screen automatically after game over
    setTimeout(() => {window.location.reload() }, 5000);

  }

  // Bullet Collision
  function handleBulletCollision(bulletIndex, enemyIndex) {
    // Deactivate bullet
    if (enemyIndex === null) {
      gameState.enemyBullets[bulletIndex].active = false;
      if (checkCollision(gameState.playerShip, gameState.enemyBullets[bulletIndex])) {
        // Collision occurred
        gameState.lives--;

        // no more lives
      if (gameState.lives === 0) {
        // Game over - lose 
        endGame(false);
        return; 
      }
      }
    } else {
      gameState.playerShip.bullets[bulletIndex].active = false;
        // Remove the enemy ship from grid
      gameState.enemyShips.splice(enemyIndex, 1);

      enemyDeath.play();

      // incremenet score
      gameState.score += 10;
    }
    
    

    // reached score limit
    if (gameState.score >= 540) {
      // Game over - win
      endGame(true);
      return; 
    }
  }

  // Handle Key Press

  function handleKeyPress(event) {
    if (event.key === "ArrowLeft") {
      gameState.playerShip.moveLeft();
    } else if (event.key === "ArrowRight") {
      gameState.playerShip.moveRight();
    } else if (event.key === " ") {
      gameState.playerShip.shoot();
    }
  }

  // Event Listeners
  window.addEventListener('keydown', handleKeyPress);

  // Start the game loop
  gameLoop();
}
  