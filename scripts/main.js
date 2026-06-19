// ==========================================
// 0. UTILITY FUNCTIONS
// ==========================================
function getAcademicYearInfo(dateObj) {
  const month = dateObj.getMonth(); // 0 is Jan, 7 is Aug
  let startYear = dateObj.getFullYear();
  
  // If month is before August, we are still in the previous academic year
  if (month < 7) startYear -= 1; 
  
  const nextYearShort = (startYear + 1).toString().slice(-2);
  
  return {
    string: `${startYear}–${nextYearShort}`, // e.g., "2025–26"
    startYear: startYear                     // e.g., 2025
  };
}

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
  updateActiveLink(); 
}

// ==========================================
// 2. LIGHTBOX LOGIC
// ==========================================
function initLightbox() {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxClose = document.getElementById("lightbox-close");

  if (!lightbox || !lightboxImg || !lightboxClose) return;

  document.addEventListener("click", (e) => {
    if (e.target.matches(".gallery-item img")) {
      lightboxImg.src = e.target.src;
      lightboxImg.alt = e.target.alt;
      lightbox.classList.add("active");
    }
  });

  lightboxClose.addEventListener("click", () => {
    lightbox.classList.remove("active");
  });

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) {
      lightbox.classList.remove("active");
    }
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

  // 1. Bulletproof checks: Only true if the field exists, isn't empty spaces, and isn't "N/A"
  const hasAbstract = lec.abstract && lec.abstract.trim() !== "" && lec.abstract.trim().toUpperCase() !== "N/A" && lec.abstract.trim() !== "#";
  const hasNotes = lec.notes && lec.notes.trim() !== "" && lec.notes.trim().toUpperCase() !== "N/A" && lec.notes.trim() !== "#";
  
  // 2. Clean up Speaker and Topic so "N/A" doesn't show up as text/tags
  const showSpeaker = lec.speaker && lec.speaker.trim() !== "" && lec.speaker.trim().toUpperCase() !== "N/A";
  const showTopic = lec.topic && lec.topic.trim() !== "" && lec.topic.trim().toUpperCase() !== "N/A";

  return `
    <div class="seminar-entry">
      <div class="seminar-date">${formattedDate}</div>
      <div class="seminar-info">
        <h3>${lec.title || ""}</h3>
        
        ${showSpeaker ? `<p class="speaker">${lec.speaker}</p>` : ""}
        ${showTopic ? `<span class="topic-tag">${lec.topic}</span>` : ""}
        
        <div class="links">
          ${hasAbstract ? `<a href="${lec.abstract}" target="_blank">Abstract</a>` : ''}
          ${hasNotes    ? `<a href="${lec.notes}"    target="_blank">Notes</a>`    : ''}
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
function createGalleryHTML(lec) {
  return `
    <div class="gallery-item">
      <img src="${lec.image}" alt="Seminar Photo" loading="lazy">
    </div>
  `;
}
let galleryRAF = null;

function initGalleryCarousel() {

    const viewport = document.getElementById("gallery-grid");
    const track = viewport ? viewport.querySelector(".gallery-track-inner") : null;
    const prev = document.getElementById("gallery-prev");
    const next = document.getElementById("gallery-next");

    if (!viewport || !track || !prev || !next) return;

    if (galleryRAF) cancelAnimationFrame(galleryRAF);

    // Track is duplicated content (see loadSeminarData), so half its
    // rendered width is exactly one full, non-duplicated image set.
    const setWidth = track.scrollWidth / 2;
    if (!setWidth) return;

    const wrapperEl = viewport.closest(".gallery-wrapper") || viewport;

    const SPEED = 40;            // px/sec, continuous drift speed
    const NUDGE = 340;           // px per button click (~one item + gap)
    const RESUME_DELAY = 2500;   // ms idle before auto-scroll resumes after a click

    let offset = 0;
    let lastTime = null;
    let resumeTimer = null;
    const pauseReasons = new Set();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        pauseReasons.add("reduced-motion");
    }

    function setPaused(reason, isPaused) {
        if (isPaused) pauseReasons.add(reason);
        else pauseReasons.delete(reason);
        lastTime = null; // avoid a big dt jump on resume
    }

    function wrap(value) {
        value %= setWidth;
        if (value > 0) value -= setWidth;
        return value;
    }

    function applyOffset() {
        track.style.transform = `translateX(${offset}px)`;
    }

    function frame(time) {
        if (lastTime === null) lastTime = time;
        const dt = (time - lastTime) / 1000;
        lastTime = time;

        if (pauseReasons.size === 0) {
            offset = wrap(offset - SPEED * dt);
            applyOffset();
        }

        galleryRAF = requestAnimationFrame(frame);
    }

    function nudge(direction) {
        offset = wrap(offset - direction * NUDGE);
        applyOffset();
        setPaused("manual", true);
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(() => setPaused("manual", false), RESUME_DELAY);
    }

    prev.onclick = () => nudge(-1);
    next.onclick = () => nudge(1);

    wrapperEl.addEventListener("mouseenter", () => setPaused("hover", true));
    wrapperEl.addEventListener("mouseleave", () => setPaused("hover", false));
    wrapperEl.addEventListener("focusin", () => setPaused("focus", true));
    wrapperEl.addEventListener("focusout", () => setPaused("focus", false));

    document.addEventListener("visibilitychange", () => {
        setPaused("hidden", document.hidden);
    });

    if ("IntersectionObserver" in window) {
        new IntersectionObserver(entries => {
            setPaused("offscreen", !entries[0].isIntersecting);
        }).observe(wrapperEl);
    }

    applyOffset();
    galleryRAF = requestAnimationFrame(frame);
}

// ==========================================
// 4. SCHEDULE FILTERING
// ==========================================
function initFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  // Target ALL table rows, including the dynamically generated archived ones
  const scheduleRows = document.querySelectorAll('.schedule-table tbody tr');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterString = btn.dataset.filter;
      // Split comma-separated keywords into an array
      const filterTerms = filterString.split(','); 
      
      scheduleRows.forEach(row => {
        const rowTopic = row.dataset.topic;
        // Check if AT LEAST ONE of the filter terms matches the row's topic
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

    const currentAcademicYear = getAcademicYearInfo(today).string;

    const upcomingContainer = document.getElementById("upcoming-container");
    const pastContainer = document.getElementById("past-container");
    const scheduleBody = document.getElementById("schedule-body");
    const archiveContainer = document.getElementById("archive-container");
    const galleryGrid = document.getElementById("gallery-grid");
    
    const INITIAL_SHOW = 3;

    // Sort ascending
    const sorted = data.lectures.sort((a, b) => new Date(a.date) - new Date(b.date));

    let upcomingShown = false;
    const pastLectures = [];
    const scheduleBuckets = {}; // Stores arrays of HTML rows by year

    sorted.forEach(lec => {
      const lecDate = new Date(lec.date);
      const formattedDate = lecDate.toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
      
      const isPast = lecDate < today;
      
      // Determine bucket for this lecture
      const lecAcademicYear = getAcademicYearInfo(lecDate).string;
      if (!scheduleBuckets[lecAcademicYear]) {
        scheduleBuckets[lecAcademicYear] = [];
      }

      // ── UPCOMING ──
      if (!isPast && !upcomingShown) {
        upcomingContainer.innerHTML = createUpcomingHTML(lec, formattedDate);
        if (window.MathJax) MathJax.typesetPromise([upcomingContainer]);
        upcomingShown = true;
      }

      // ── PAST GLOBAL LIST ──
      if (isPast) {
        pastLectures.push({ lec, formattedDate });
      }

      // ── SCHEDULE BUCKETING ──
      scheduleBuckets[lecAcademicYear].push(
        createScheduleRowHTML(lec, formattedDate, isPast)
      );
    });
    // ── GALLERY ──
    if (galleryGrid) {
      const galleryLectures = [...sorted]
        .reverse()
        .filter(lec => lec.image && lec.image.trim() !== "");

      // Duplicate the set an EVEN number of times so the continuous
      // marquee wraps seamlessly at the halfway point. Small photo
      // counts get extra copies so the strip still fills the viewport.
      const REPEATS = galleryLectures.length > 6 ? 2 : 4;
      let innerHTML = "";
      for (let i = 0; i < REPEATS; i++) {
        galleryLectures.forEach(lec => {
          innerHTML += createGalleryHTML(lec);
        });
      }

      // Decorative carousel: the same photos and info already appear,
      // accessibly, in the Past Lectures list above — so hide this
      // repeated strip (and its now-redundant nav buttons) from
      // screen readers and the tab order.
      galleryGrid.innerHTML = `<div class="gallery-track-inner">${innerHTML}</div>`;
      galleryGrid.closest(".gallery-wrapper")?.setAttribute("aria-hidden", "true");
      document.querySelectorAll("#gallery-prev, #gallery-next")
        .forEach(btn => btn.setAttribute("tabindex", "-1"));

      initLightbox();
      initGalleryCarousel();
    };

    // ── RENDER MAIN SCHEDULE (Current Year Only) ──
    if (scheduleBuckets[currentAcademicYear]) {
      scheduleBody.innerHTML = scheduleBuckets[currentAcademicYear].join('');
    } else {
      scheduleBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No lectures scheduled yet for the ${currentAcademicYear} academic year.</td></tr>`;
    }

    // ── RENDER ARCHIVES (Previous Years) ──
    if (archiveContainer) {
      const archivedYears = Object.keys(scheduleBuckets)
        .filter(year => year !== currentAcademicYear)
        .sort()
        .reverse();

      let archiveHTML = '';
      archivedYears.forEach(year => {
        archiveHTML += `
          <details class="archive-schedule">
            <summary>View ${year} Schedule</summary>
            <table class="schedule-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Speaker</th>
                  <th>Topic</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${scheduleBuckets[year].join('')}
              </tbody>
            </table>
          </details>
        `;
      });
      archiveContainer.innerHTML = archiveHTML;
    }

    // Initialize filters AFTER all tables are built
    initFilters();

    if (!upcomingShown) {
      upcomingContainer.innerHTML = "<p>No upcoming seminar scheduled.</p>";
    }

    // ── RENDER PAST LECTURES (Descending with Show More) ──
    pastLectures.reverse(); 

    if (pastLectures.length === 0) {
      pastContainer.innerHTML = `<p class="empty-note">No past lectures yet. Check back after the first seminar.</p>`;
    } else {
      let pastHTML = "";
      pastLectures.slice(0, INITIAL_SHOW).forEach(entry => {
        pastHTML += createPastEntryHTML(entry);
      });
      pastContainer.innerHTML = pastHTML;
      if (window.MathJax) {
          MathJax.typesetPromise([pastContainer]);
      }

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
          if (window.MathJax) {
            MathJax.typesetPromise([pastContainer]);
          }
          showMoreBtn.remove();
        });
        pastContainer.appendChild(showMoreBtn);
      }
    }

  } catch (err) {
    console.error("Failed to load data:", err);
  }
}

// ==========================================
// 6. DYNAMIC TIME & COHORT TRACKING
// ==========================================
function initDynamicYears() {
  const today = new Date();
  const currentYearInfo = getAcademicYearInfo(today);
  
  document.querySelectorAll('.dynamic-academic-year').forEach(el => {
    el.textContent = currentYearInfo.string;
  });

  const cohortStartYear = 2025; 
  let yearInProgram = (currentYearInfo.startYear - cohortStartYear) + 1;
  
  if (yearInProgram > 5) yearInProgram = 5;
  if (yearInProgram < 1) yearInProgram = 1;

  const ordinals = ["", "st", "nd", "rd", "th", "th"];
  const yearText = `${yearInProgram}${ordinals[yearInProgram]} Year PhD`;

  document.querySelectorAll('.dynamic-org-year').forEach(el => {
    el.textContent = yearText;
  });
}

// ==========================================
// 7. INITIALIZE APPLICATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initDynamicYears();
  loadSeminarData();
});
