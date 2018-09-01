const fs = require('fs')
const http = require('http')
const util = require('util')

const writeFile = util.promisify(fs.writeFile)

const BASE_URL = 'http://www.noblequran.com/translation'

const parseHTMLResponse = (html) => {
  const re = /(?:<p>)?<a name=\d+>(?:<\/a>)?(?:<font size=\+1>)?<b>.+?<\/b>(.+?)<\/[a|p]>/g
  const data = []

  let match
  while ((match = re.exec(html)) !== null) {
    // const sanitized = match[1].replace(
    //   /\.?((?:<b>)?(?:&nbsp;)(?:<\/b>)?)*/g,
    //   ''
    // )
    data.push(match[1])
  }

  return data
}

const fetchTranslation = (path) =>
  new Promise((resolve, reject) =>
    http.get(`${BASE_URL}${path}`, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        resolve(parseHTMLResponse(data))
      })

      res.on('error', (err) => reject(err))
    })
  )

const chapters = Array.from({ length: 114 }, (_, i) => i + 1)

Promise.all(
  chapters.map((chapter) =>
    fetchTranslation(`/surah${chapter}.html`).then((data) => {
      writeFile(
        `assets/translations/muhsin-khan/${chapter}.txt`,
        data.join('\n')
      )
    })
  )
)
