const fs = require('fs')
const util = require('util')
const express = require('express')

const {
  validateVerse,
  validateChapter,
  VERSE_INDEX_BY_CHAPTER,
  NUMBER_OF_VERSES_BY_CHAPTER
} = require('./utils')
const TRANSLATIONS = require('./translations')

const readFile = util.promisify(fs.readFile)

const app = express()

app.use(express.static('public'))

// load quran
async function init(callback) {
  const data = await readFile('./quran-uthmani.txt', 'utf8')
  const verses = data.split('\r\n')
  app.set('data', verses)

  callback()
}

// fetch translation
async function fetchTranslation(chapter, verse) {
  const data = await readFile(
    `./assets/translations/muhsin-khan/${chapter}.txt`,
    'utf8'
  )
  const translations = data.split('\n')
  return translations[verse - 1]
}

init(() => {
  app.get('/api/verses/:chapterId', (req, res) => {
    const { chapterId } = req.params

    try {
      validateChapter(chapterId)
    } catch (err) {
      return next(err)
    }

    const verseStartIndex = VERSE_INDEX_BY_CHAPTER[Number(chapterId) - 1]
    const numberOfVersesInChapter =
      NUMBER_OF_VERSES_BY_CHAPTER[Number(chapterId) - 1]
    const verses = app
      .get('data')
      .slice(verseStartIndex, verseStartIndex + numberOfVersesInChapter)

    res.json(verses)
  })

  app.get('/api/verses/:chapterId/:verseId', (req, res, next) => {
    const { chapterId, verseId } = req.params

    try {
      validateChapter(chapterId)
      validateVerse(chapterId, verseId)
    } catch (err) {
      return next(err)
    }

    const verseIndex =
      VERSE_INDEX_BY_CHAPTER[Number(chapterId) - 1] + Number(verseId) - 1
    const text = app.get('data')[verseIndex]

    res.json(text)
  })

  app.get('/api/translations/:chapterId/:verseId', async (req, res, next) => {
    let { chapterId, verseId } = req.params

    try {
      validateChapter(chapterId)
      validateVerse(chapterId, verseId)
    } catch (err) {
      return next(err)
    }

    res.json([
      {
        name: 'Muhsin Khan',
        text: await fetchTranslation(chapterId, verseId)
      }
    ])
  })

  app.use((err, _, res, __) => {
    res.status(500).send(err.message)
  })

  app.listen(3000, () => {
    console.log('app running on port 3000')
  })
})
