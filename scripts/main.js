// ==========================================
// 1. NAVIGATION SCROLL LOGIC
// ==========================================
function initNavigation() {
  const sections = document.querySelectorAll("main section");
  const navLinks = document.querySelectorAll("nav a");

  function updateActiveLink() {
    let currentSection = "";
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      // Check if section is near the top of the viewport
      if (rect.top <= 120 && rect.bottom >= 120) {
        currentSection = section.getAttribute("id");
      }
    });

    navLinks.forEach(link => {
      link.classList.remove("active");
      if (link.getAttribute("href") === "#" + currentSection) {
        link.classList.add("active");
      }
    });
  }

  window.addEventListener("scroll", updateActiveLink);
  updateActiveLink(); // Run once on load
}

// ==========================================
// 2. LIGHTBOX LOGIC
// ==========================================
function initLightbox() {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxClose = document.getElementById("lightbox-close");

  if (!lightbox || !lightboxImg || !lightboxClose) return;

  document.querySelectorAll(".gallery-grid img").forEach(img => {
    img.addEventListener("click", () => {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightbox.classList.add("active");
    });
  });

  lightboxClose.addEventListener("click", () => lightbox.classList.remove("active"));
  
  lightbox.addEventListener("click", e => {
    if (e.target === lightbox) lightbox.classList.remove("active");
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") lightbox.classList.remove("active");
  });
}

// ==========================================
// 3. HTML TEMPLATE GENERATORS
// ==========================================
function createUpcomingHTML(lec, formattedDate) {
  return `
    <div class="upcoming-card">
      <p class="tag">Next · ${formattedDate}</p>
      <h3>${lec.title || ""}</h3>
      <p class="speaker">Presented by ${lec.speaker || ""}</p>
      <p class="date-line">${formattedDate} · 12:00 PM · Hall B113</p>
      ${lec.abstract_text ? `
        <div class="abstract-box">
          <h4>Abstract</h4>
          <p>${lec.abstract_text}</p>
        </div>
      ` : ''}
    </div>
  `;
}

function createPastEntryHTML(entry) {
  const { lec, formattedDate } = entry;
  return `
    <div class="seminar-entry">
      <div class="seminar-date">${formattedDate}</div>
      <div class="seminar-info">
        <h3>${lec.title || ""}</h3>
        <p class="speaker">${lec.speaker || ""}</p>
        <span class="topic-tag">${lec.topic || ""}</span>
        <div class="links">
          ${lec.abstract ? `<a href="${lec.abstract}" target="_blank">Abstract</a>` : ''}
          ${lec.notes    ? `<a href="${lec.notes}"    target="_blank">Notes</a>`    : ''}
        </div>
      </div>
    </div>
  `;
}

function createScheduleRowHTML(lec, formattedDate, isPast) {
  return `
    <tr data-topic="${(lec.topic || '').toLowerCase()}">
      <td class="date-cell">${formattedDate}</td>
      <td>${lec.speaker || ""}</td>
      <td>${lec.topic || ""}</td>
      <td>
        <span class="status-badge ${isPast ? 'badge-done' : 'badge-upcoming'}">
          ${isPast ? 'Completed' : 'Upcoming'}
        </span>
      </td>
    </tr>
  `;
}

// ==========================================
// 4. SCHEDULE FILTERING
// ==========================================
function initFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const scheduleRows = document.querySelectorAll('#schedule-body tr');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons, add to clicked
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterString = btn.dataset.filter;
      const filterTerms = filterString.split(','); 
      
      // Filter rows
      scheduleRows.forEach(row => {
        const rowTopic = row.dataset.topic;
        
        // .some() checks if AT LEAST ONE of the filter terms is inside the topic
        const topicMatch = filterTerms.some(term => rowTopic.includes(term.trim()));
        
        row.style.display = (filterString === 'all' || topicMatch) ? '' : 'none';
      });
    });
  });
}
// ==========================================
// 5. DATA FETCHING & RENDERING ENGINE
// ==========================================
async function loadSeminarData() {
  try {
    const res = await fetch('data.json');
    const data = await res.json();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingContainer = document.getElementById("upcoming-container");
    const pastContainer = document.getElementById("past-container");
    const scheduleBody = document.getElementById("schedule-body");
    const INITIAL_SHOW = 3;

    // Sort ascending for schedule + upcoming logic
    const sorted = data.lectures.sort((a, b) => new Date(a.date) - new Date(b.date));

    let upcomingShown = false;
    const pastLectures = [];
    let scheduleHTML = "";

    // Process all lectures
    sorted.forEach(lec => {
      const lecDate = new Date(lec.date);
      const formattedDate = lecDate.toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
      const isPast = lecDate < today;

      // ── UPCOMING (first future lecture only) ──
      if (!isPast && !upcomingShown) {
        upcomingContainer.innerHTML = createUpcomingHTML(lec, formattedDate);
        if (window.MathJax) MathJax.typesetPromise([upcomingContainer]);
        upcomingShown = true;
      }

      // ── PAST ARRAY (collect for later) ──
      if (isPast) {
        pastLectures.push({ lec, formattedDate });
      }

      // ── SCHEDULE ROW ──
      scheduleHTML += createScheduleRowHTML(lec, formattedDate, isPast);
    });

    // Inject schedule HTML and initialize filters
    scheduleBody.innerHTML = scheduleHTML;
    initFilters();

    // Fallback if no upcoming
    if (!upcomingShown) {
      upcomingContainer.innerHTML = "<p>No upcoming seminar scheduled.</p>";
    }

    // ── RENDER PAST LECTURES (Descending with Show More) ──
    pastLectures.reverse(); // newest first

    if (pastLectures.length === 0) {
      pastContainer.innerHTML = `<p class="empty-note">No past lectures yet. Check back after the first seminar.</p>`;
    } else {
      // Render initial batch
      let pastHTML = "";
      pastLectures.slice(0, INITIAL_SHOW).forEach(entry => {
        pastHTML += createPastEntryHTML(entry);
      });
      pastContainer.innerHTML = pastHTML;

      // Render "Show More" button if needed
      if (pastLectures.length > INITIAL_SHOW) {
        const remaining = pastLectures.length - INITIAL_SHOW;
        const showMoreBtn = document.createElement("button");
        showMoreBtn.textContent = `Show ${remaining} more`;
        showMoreBtn.className = "show-more-btn";

        showMoreBtn.addEventListener("click", () => {
          pastLectures.slice(INITIAL_SHOW).forEach(entry => {
            const temp = document.createElement("div");
            temp.innerHTML = createPastEntryHTML(entry);
            pastContainer.insertBefore(temp.firstElementChild, showMoreBtn);
          });
          showMoreBtn.remove();
        });

        pastContainer.appendChild(showMoreBtn);
      }
    }

  } catch (err) {
    console.error("Failed to load data.json:", err);
  }
}

// ==========================================
// 6. DYNAMIC TIME & COHORT TRACKING
// ==========================================
function initDynamicYears() {
  const today = new Date();
  const currentMonth = 7; // 0 is Jan, 11 is Dec
  const currentYear = today.getFullYear();
  
  // 1. Calculate Academic Year
  // Indian academic years typically roll over around August.
  // If the current month is before August (month index 7), 
  // we are still in the previous year's academic session.
  let academicStartYear = currentYear;
  if (currentMonth < 7) { 
    academicStartYear -= 1;
  }
  
  // Create the string (e.g., "2026" + "–" + "27" -> "2026–27")
  const nextYearShort = (academicStartYear + 1).toString().slice(-2);
  const academicYearString = `${academicStartYear}–${nextYearShort}`;
  
  // Inject the academic year into the HTML
  document.querySelectorAll('.dynamic-academic-year').forEach(el => {
    el.textContent = academicYearString;
  });

  // 2. Calculate Organizer Year
  // We set the baseline: This cohort started their 1st year in the 2025 academic session.
  const cohortStartYear = 2025; 
  let yearInProgram = (academicStartYear - cohortStartYear) + 1;
  
  // Cap the display at 5th year (and ensure it doesn't go below 1)
  if (yearInProgram > 5) yearInProgram = 5;
  if (yearInProgram < 1) yearInProgram = 1;

  // Determine the correct suffix (st, nd, rd, th)
  const ordinals = ["", "st", "nd", "rd", "th", "th"]; // Index matches the year
  const yearText = `${yearInProgram}${ordinals[yearInProgram]} Year`;

  // Inject the organizer year into the HTML
  document.querySelectorAll('.dynamic-org-year').forEach(el => {
    el.textContent = yearText;
  });
}
// ==========================================
// 7. INITIALIZE APPLICATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initLightbox();
  initDynamicYears();
  loadSeminarData();
});
