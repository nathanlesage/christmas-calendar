<template>
  <button
    :class="{ card: true, 'can-open': canOpen, 'has-opened': props.hasOpened }"
    :style="props.hasOpened && parsedContent ? `background-image: url('${absUrl(parsedContent.cover_link)}')` : ''"
    :command="dialogCommand" :commandfor="dialogId"
    @click="maybeHasOpened"
  >
    <div class="number" v-if="!hasOpened">
      {{ props.day }}
    </div>
  </button>

  <!-- Overlay modal with the information -->
  <dialog :id="dialogId" class="calendar-details" closedby="any" v-if="parsedContent">
    <h1>{{ parsedContent.artist }} &ndash; {{ parsedContent.album }} ({{ parsedContent.release_date }})</h1>
    <img :src="absUrl(parsedContent.cover_link)" :alt="`${parsedContent.artist} - ${parsedContent.album}`" class="cover">
    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
      <a class="button" :href="parsedContent.link" target="_blank">View on Bandcamp</a>
      <div class="tag">Genre: {{ parsedContent.genre }}</div>
      <div class="tag">My rating: {{ parsedContent.rating }}</div>
      <div class="tag">Favorite song: {{ parsedContent.favorite }}</div>
    </div>
    <h2>About the album</h2>
    <p class="review" v-html="parsedContent.review"></p>
    <button class="button" command="request-close" :commandfor="dialogId">Close</button>
  </dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { parseMarkdown, type MarkdownContents } from '../parse-md'
import { absUrl } from '../abs-url'

// Target year and month (when the calendar is being deployed). Used to
// determine when this card should be considered active.
const TARGET_YEAR = 2026
const TARGET_MONTH = 12

const props = defineProps<{ day: number, hasOpened: boolean }>()
const emit = defineEmits<(event: 'has-opened') => void>()

const parsedContent = ref<MarkdownContents>()
const currentDate = ref<Date>(new Date())

let timer: number|undefined
  
onMounted(async () => {
  // Dynamically import the review file. NOTE that inline & raw are required to
  // tell vite that it should, in these cases, return a literal string and NOT
  // keep those files separate. Everything should be folded into the JS bundle.
  const module = await import(`../contents/day-${props.day}.md?inline&raw`)
  // But modules also have a `default` prop, which actually contains the string.
  const body: string = module.default
  const parsed = parseMarkdown(body)
  parsedContent.value = parsed

  // Refresh the date every minute so that people can leave the page open and
  // still see newly unlocked days.
  timer = setInterval(() => {
    currentDate.value = new Date()
  }, 1000 * 60)
})

onBeforeUnmount(() => {
  if (timer !== undefined) {
    clearTimeout(timer)
  }
})

const dialogCommand = computed(() => {
  // Taken from the HTML dialog API. "show-modal" makes the modal appear. An
  // empty string is an invalid command and thus essentially disables the button.
  return canOpen.value ? 'show-modal' : ''
})
// Required to uniquely identify the various dialogs we have on the page.
const dialogId = computed(() => `dialog-${props.day}`)

// This function calculates if we are on that day, and enables it if so.
const canOpen = computed(() => {
  const dt = currentDate.value
  const currentYear = dt.getFullYear()
  const currentMonth = dt.getMonth() + 1
  const currentDay = dt.getDate()

  if (currentYear > TARGET_YEAR) {
    return true // We're in 2027 upwards, so everything can open.
  }

  if (currentYear < TARGET_YEAR) {
    return false // This can happen if we plan far in advance.
  }

  // We now know target year equals current year
  if (currentMonth > TARGET_MONTH) {
    // This can happen for calendars somewhere in the mid of the year. Will
    // never be true for christmas calendars.
    return true
  }

  if (currentMonth < TARGET_MONTH) {
    // We're not yet in December.
    return false
  }

  // We now know we're in the correct year and month. A day can thus be opened
  // if its date is less than or equal to the currentDay.
  return currentDay >= props.day
})

// Emit an open event if the user has clicked on the card and they were allowed
// to open it today.
function maybeHasOpened () {
  if (!canOpen.value) {
    return
  } else {
    emit('has-opened')
  }
}
</script>

<style lang="css">
button.card {
  width: 100%;
  height: 100%;
  font-size: 2.5em;
  overflow: hidden;
  border: 1px solid white;
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, .5);
  color: currentColor;
  backdrop-filter: blur(2px);
  /* For the background cover image after a card has been opened */
  background-size: cover;
  background-position: center center;
  /* Transitions upon hover */
  transition: backdrop-filter 0.2s ease, transform 0.2s ease;
  /* Make non-open days slightly transparent to make it easier to find the unlocked days. */
  cursor: not-allowed;
  opacity: 0.5;

  &.can-open {
    opacity: 1; /* Reset opacity for active days */
    cursor: pointer;

    &:hover {
      backdrop-filter: blur(10px);
      transform: scale(1.1);
      z-index: 1;
    }
  }

  &.has-opened {
    /* I figured out that having no border makes it look nicer with the covers */
    border-color: transparent;
  }
}

dialog.calendar-details {
  img.cover {
    max-width: 200px;
    float: left;
    margin: 0 20px 0px 0;
  }

  p.review {
    line-height: 1.4;
    hyphens: auto;
  }
}

/* When the display size gets too small, do not float the image anymore. */
@media (max-width: 550px) {
  dialog.calendar-details {
    img.cover {
      float: none;
      margin: 10px 0;
      max-width: 100%;
    }
  }
}
</style>
