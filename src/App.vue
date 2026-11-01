<template>
  <header>
    <h1>2026 Musical Christmas Calendar</h1>
    <p>
      From Dec 1&ndash;24, one album recommendation a day. Check back every day
      to get a new recommendation until Christmas.
    </p>
  </header>
  <div id="grid-container">
    <Card v-for="day in days" v-bind:key="day.day" :day="day.day" :has-opened="day.hasOpened" @has-opened="setOpened(day.day)"></Card>
  </div>

  <!-- Intro information for first-time visitors -->
  <dialog id="intro-dialog" closedby="any">
    <h1>Musical Christmas Calendar 2026</h1>
    <p>
      Welcome to my (musical) Christmas Calendar 2026! Throughout December 2026,
      you will find a new album recommendation every day. These suggestions come
      directly from my own music library and have been curated throughout the
      year to provide you a broad and diverse overview over my musical taste
      &ndash; completely subjective and without any warranties, of course.
    </p>
    <p>
      Every day, a new "door" will unlock that you can click to view a new album
      reommendation. I have made sure that no artist occurs twice, and I have
      always written a few words about each album and a bit of personal
      anecdotes where applicable.
    </p>
    <p>
      Each album is available on Bandcamp, which means that you can click a link
      in the overview to view the album and listen to it in full for free. If
      you like a record, you can either purchase it digitally, or sometimes even
      order merch (depending on availability).
    </p>
    <p>
      I hope you enjoy (some of) my suggestions, and then happy holidays!
    </p>
    <button class="button" command="request-close" commandfor="intro-dialog">Got it!</button>
  </dialog>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Card from './components/Card.vue'

const LOCAL_STORAGE_KEY = 'christmas-calendar-2026-days'
const INTRO_DIALOG_KEY = 'christmas-calendar-2026-show-dialog'

export interface DayElement {
  day: number
  hasOpened: boolean
}

/**
 * Generates a wholly new day grid (already shuffled to use)
 *
 * @return  {DayElement[]}  The elements
 */
function generateDayGrid (): DayElement[] {
  const days: DayElement[] = []

  for (let i = 0; i < 24; i++) {
    days.push({ day: i + 1, hasOpened: false })
  }

  shuffle(days)

  return days
}

/**
 * Checks to see if there is a day grid saved to local storage, and if, so,
 * returns that one (for persistence reasons), otherwise, creates a new one.
 *
 * @return  {DayElement[]}  The elements
 */
function getDayGrid (): DayElement[] {
  // Check if it's in local storage. If not, generate a new one.
  const storedValues = localStorage.getItem(LOCAL_STORAGE_KEY)

  if (storedValues === null) {
    const newDayGrid = generateDayGrid()
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newDayGrid))
    return newDayGrid
  } else {
    const dayGrid = JSON.parse(storedValues)
    return dayGrid
  }
}

// Retrieve the day elements
const days = ref(getDayGrid())

onMounted(() => {
  // Check if we should reset the state (for debug purposes; simply append the
  // parameter ?reset=true to the URL)
  const search = new URLSearchParams(window.location.search)
  if (search.get('reset') === 'true') {
    localStorage.clear()
    console.log('Local Storage cleared successfully.')
    window.location.search = '' // Also make further reloads simpler.
  }

  window.addEventListener('resize', onResize)
  // Manually call once to get initial estimate
  onResize()

  // Check if we should show the intro dialog
  const introDialog = document.getElementById('intro-dialog') as HTMLDialogElement|null

  const dialogItem = localStorage.getItem(INTRO_DIALOG_KEY)

  if (introDialog === null) {
    console.error('Could not find the intro dialog element!')
    return
  } else if (dialogItem !== null) {
    // Dialog has been shown already
    return
  } else {
    introDialog.showModal()
    localStorage.setItem(INTRO_DIALOG_KEY, 'Intro dialog has been shown.')
  }

})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
})

function onResize () {
  const { clientWidth, clientHeight } = document.body
  const aspect = clientWidth / clientHeight
  
  const BASE_COUNT = 5 // square root of 25 when we have a square
  const columnCount = Math.ceil(BASE_COUNT * aspect)
  let rowCount = Math.ceil(BASE_COUNT / aspect)

  // While the algorithm works quite well, there are some edge cases where it
  // will have too many rows, sometimes one or two. Here, we reduce the rowCount
  // until it has just enough rows.
  while (columnCount * (rowCount - 1) >= 24) {
    rowCount--
  }

  document.documentElement.style.setProperty('--row-count', String(rowCount))
  document.documentElement.style.setProperty('--col-count', String(columnCount))
}

/**
 * Basic shuffle function. Courtesy of https://bost.ocks.org/mike/shuffle/.
 *
 * @param   {unknown[]}  array  The array to shuffle
 *
 * @return  {void}              Shuffles in place
 */
function shuffle (array: unknown[]): void {
  let m = array.length
  let t
  let i

  // While there remain elements to shuffle…
  while (m) {
    // Pick a remaining element…
    i = Math.floor(Math.random() * m--)

    // And swap it with the current element.
    t = array[m]
    array[m] = array[i]
    array[i] = t
  }
}

// Update the "has opened" information in localstorage.
function setOpened (day: number) {
  const idx = days.value.findIndex(d => d.day === day)
  if (idx < 0) {
    return
  }

  days.value[idx].hasOpened = true
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(days.value))
}
</script>

<style lang="css">
:root {
  --row-count: 5;
  --col-count: 5;
}

body {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  background-image: url('/bg_the_ocean_gebaeude9_cgn.jpg');
  background-size: cover;
  color: white;
  font-family: 'Inter', system-ui, 'Segoe UI', Roboto, sans-serif;
}

/* The app container constrains all its contents to the available display size */
div#app {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;

  header {
    padding: 0 10px;

    h1, p {
      margin: 0 10px;
    }
  }
}

/* The grid container maximizes the available space and arranges all 24 cards
   into a grid based on the row and column counts. */
div#grid-container {
  flex-grow: 1;
  display: grid;
  grid-template-rows: repeat(var(--row-count), 1fr);
  grid-template-columns: repeat(var(--col-count), 1fr);
  place-items: center;
  gap: 10px;
  padding: 10px;
}

/* General dialog styling */
dialog {
  border: none;
  border-radius: 10px;
  position: absolute;
  top: 0;
  /* Ensure the dialog doesn't become too wide */
  max-width: 800px;

  &::backdrop {
    backdrop-filter: blur(25px);
  }

  h1 {
    margin-top: 0;
  }

  h2 {
    margin-bottom: 0;
  }

  a.button, button, div.tag {
    background-color: white;
    font-size: inherit;
    cursor: default;
    display: inline-block;
    border: 1px solid black;
    border-radius: 4px;
    color: black;
    text-decoration: none;
    padding: 4px 10px;
  }

  a.button:hover, button:hover {
    background-color: #eee;
    cursor: pointer;
  }

  /* Make the links stand out by using the bandcamp color */
  a.button {
    color: rgb(78, 169,211);
    border-color: rgb(78, 169,211);
  }
}
</style>
