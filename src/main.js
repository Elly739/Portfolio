// Portfolio JavaScript
document.addEventListener('DOMContentLoaded', () => {
  // Update year
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
  
  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light-mode');
      const isLight = document.body.classList.contains('light-mode');
      themeToggle.innerHTML = isLight ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });
  }
  
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href && href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          const headerHeight = document.querySelector('header').offsetHeight;
          const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;
          window.scrollTo({ top: targetPosition, behavior: 'smooth' });
          
          // If navigating to projects section, show all projects
          if (href === '#projects') {
            showAllProjects();
          }
        }
      }
    });
  });
  
  // See All Projects button
  const seeAllBtn = document.getElementById('seeAllProjects');
  if (seeAllBtn) {
    seeAllBtn.addEventListener('click', () => {
      showAllProjects();
    });
  }
  
  // Function to show all projects
  function showAllProjects() {
    const projectsSection = document.querySelector('.projects .container');
    if (projectsSection) {
      projectsSection.classList.add('show-all-projects');
    }
    // Hide the "See All" button
    const moreProjectsBtn = document.querySelector('.more-projects');
    if (moreProjectsBtn) {
      moreProjectsBtn.classList.add('hidden');
    }
  }
  
  // Typewriter effect
  const typedTextElement = document.querySelector('.typed-text');
  if (typedTextElement) {
    const phrases = ['Software Engineer', 'Innovator', 'Full-Stack Developer', 'Problem Solver'];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    
    function type() {
      const currentPhrase = phrases[phraseIndex];
      if (isDeleting) {
        typedTextElement.textContent = currentPhrase.substring(0, charIndex - 1);
        charIndex--;
      } else {
        typedTextElement.textContent = currentPhrase.substring(0, charIndex + 1);
        charIndex++;
      }
      
      let speed = isDeleting ? 50 : 100;
      
      if (!isDeleting && charIndex === currentPhrase.length) {
        speed = 2000;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        speed = 500;
      }
      
      setTimeout(type, speed);
    }
    
    type();
  }
});

console.log('Portfolio Loaded!');
